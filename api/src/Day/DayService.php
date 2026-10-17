<?php

declare(strict_types=1);

namespace Primed\Day;

use DateTimeImmutable;
use DateTimeZone;
use PDO;
use Primed\Http\HttpException;
use Primed\Http\Input;
use Primed\Support\Clock;
use Throwable;

/**
 * Days, day types, week template and the protein default.
 *
 * Rules (BRIEFING §3, D-051): settings changes apply from today on. Past days are fixed: before any change,
 * every past day without a row is stored with the values valid until then. Today stays live.
 */
final class DayService
{
    public const DURATIONS = [60, 90, 120];
    public const LATEST_TRAINING_MIN = 23 * 60 + 45;
    /** Neutral training time when a training day has no time yet (e.g. switched manually). */
    public const DEFAULT_TRAINING_START = 18 * 60;

    public function __construct(
        private readonly PDO $pdo,
        private readonly DayRepository $days,
        private readonly DayTypeRepository $dayTypes,
        private readonly WeekTemplateRepository $template,
        private readonly SettingsRepository $settings,
        private readonly LogicalCalendar $calendar,
        private readonly Clock $clock,
    ) {
    }

    public function today(int $userId): string
    {
        return $this->calendar->today($this->settings->get($userId)->dayBoundaryMin);
    }

    /**
     * Returns the day; today is always recalculated from the current settings, past days are fixed.
     */
    public function getDay(int $userId, string $date): Day
    {
        $today = $this->today($userId);
        self::assertNotFuture($date, $today);

        if ($date === $today) {
            return $this->refreshToday($userId);
        }

        return $this->days->find($userId, $date) ?? $this->storeFromTemplate($userId, $date);
    }

    /**
     * Sets the day type (and training time) of one day, also retroactively. The template stays unchanged.
     */
    public function setDay(int $userId, string $date, int $dayTypeId, ?int $trainingStart, ?int $durationMin): Day
    {
        self::assertNotFuture($date, $this->today($userId));
        $settings = $this->settings->get($userId);
        $type = $this->requireDayType($userId, $dayTypeId);
        [$trainingStart, $durationMin] = $this->validateTraining($type, $trainingStart, $durationMin, $settings);

        $day = Day::fromType($date, $type, $settings->proteinDefault, $trainingStart, $durationMin, 'manual');
        $this->days->save($userId, $day, $this->clock->now());

        return $day;
    }

    public function createDayType(int $userId, DayTypeInput $input): DayType
    {
        $id = $this->dayTypes->create(
            $userId,
            $input->name,
            $input->kcal,
            $input->protein,
            $input->carbs,
            $input->sugarRef,
            $input->isTraining,
            $this->clock->now(),
        );

        return $this->requireDayType($userId, $id);
    }

    public function updateDayType(int $userId, int $id, DayTypeInput $input): DayType
    {
        $existing = $this->requireDayType($userId, $id);
        if ($existing->isTraining !== $input->isTraining && $this->template->usesDayType($userId, $id)) {
            throw new HttpException(
                422,
                'day_type_in_use',
                'Diese Tagesart wird in der Wochenvorlage verwendet. Ändere dort zuerst die Tagesart.',
            );
        }

        $this->changeSettings($userId, function () use ($userId, $id, $input): void {
            $this->dayTypes->update(
                $userId,
                $id,
                $input->name,
                $input->kcal,
                $input->protein,
                $input->carbs,
                $input->sugarRef,
                $input->isTraining,
                $this->clock->now(),
            );
        });

        return $this->requireDayType($userId, $id);
    }

    public function deleteDayType(int $userId, int $id): void
    {
        $this->requireDayType($userId, $id);
        if ($this->template->usesDayType($userId, $id)) {
            throw new HttpException(
                422,
                'day_type_in_use',
                'Diese Tagesart wird in der Wochenvorlage verwendet. Ändere dort zuerst die Tagesart.',
            );
        }
        if (count($this->dayTypes->all($userId)) <= 1) {
            throw new HttpException(422, 'last_day_type', 'Mindestens eine Tagesart muss bleiben.');
        }

        $this->changeSettings($userId, function () use ($userId, $id): void {
            $this->dayTypes->softDelete($userId, $id, $this->clock->now());
        });
    }

    /**
     * @return array<int, TemplateDay>
     */
    public function weekTemplate(int $userId): array
    {
        return $this->template->all($userId);
    }

    /**
     * @param list<TemplateDay> $days exactly one entry per weekday 1–7
     */
    public function replaceWeekTemplate(int $userId, array $days): void
    {
        $settings = $this->settings->get($userId);
        $seen = [];
        $validated = [];
        foreach ($days as $day) {
            if ($day->weekday < 1 || $day->weekday > 7 || isset($seen[$day->weekday])) {
                throw Input::invalid('Die Wochenvorlage braucht genau einen Eintrag pro Wochentag.');
            }
            $seen[$day->weekday] = true;
            $type = $this->requireDayType($userId, $day->dayTypeId);
            [$start, $duration] = $this->validateTraining($type, $day->trainingStart, $day->durationMin, $settings);
            $validated[] = new TemplateDay($day->weekday, $type->id, $start, $duration);
        }
        if (count($validated) !== 7) {
            throw Input::invalid('Die Wochenvorlage braucht genau einen Eintrag pro Wochentag.');
        }

        $this->changeSettings($userId, function () use ($userId, $validated): void {
            $this->template->replace($userId, $validated);
        });
    }

    public function updateProteinDefault(int $userId, int $protein): void
    {
        $this->changeSettings($userId, function () use ($userId, $protein): void {
            $this->settings->updateProteinDefault($userId, $protein, $this->clock->now());
        });
    }

    /**
     * Stores every past day (since the account was created) that has no row yet, using the current values.
     * Must run before any change to the week template, day types or protein default.
     */
    public function materializePast(int $userId): void
    {
        $today = $this->today($userId);
        $from = $this->accountStartDate($userId);
        $yesterday = (new DateTimeImmutable($today))->modify('-1 day')->format('Y-m-d');
        if ($from > $yesterday) {
            return;
        }

        $existing = $this->days->existingDates($userId, $from, $yesterday);
        $date = new DateTimeImmutable($from);
        while (($key = $date->format('Y-m-d')) <= $yesterday) {
            $date = $date->modify('+1 day');
            if (!isset($existing[$key])) {
                $this->storeFromTemplate($userId, $key);
            }
        }
    }

    /**
     * Today's row always reflects the current settings: day type from the template unless set manually.
     */
    public function refreshToday(int $userId): Day
    {
        $settings = $this->settings->get($userId);
        $today = $this->calendar->today($settings->dayBoundaryMin);
        $existing = $this->days->find($userId, $today);

        $manualType = $existing !== null && $existing->source === 'manual' && $existing->dayTypeId !== null
            ? $this->dayTypes->find($userId, $existing->dayTypeId)
            : null;

        if ($existing !== null && $manualType !== null) {
            $day = Day::fromType(
                $today,
                $manualType,
                $settings->proteinDefault,
                $existing->trainingStart ?? self::DEFAULT_TRAINING_START,
                $existing->durationMin ?? $settings->defaultDurationMin,
                'manual',
            );
        } else {
            $day = $this->fromTemplate($userId, $today, $settings);
        }

        if ($existing === null || !$existing->equals($day)) {
            $this->days->save($userId, $day, $this->clock->now());
        }

        return $day;
    }

    /**
     * @param callable(): void $change
     */
    private function changeSettings(int $userId, callable $change): void
    {
        $this->pdo->beginTransaction();
        try {
            $this->materializePast($userId);
            $change();
            $this->refreshToday($userId);
            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    private function storeFromTemplate(int $userId, string $date): Day
    {
        $day = $this->fromTemplate($userId, $date, $this->settings->get($userId));
        $this->days->save($userId, $day, $this->clock->now());

        return $day;
    }

    private function fromTemplate(int $userId, string $date, UserSettings $settings): Day
    {
        $entry = $this->template->all($userId)[LogicalCalendar::weekday($date)] ?? null;
        $type = $entry === null ? null : $this->dayTypes->find($userId, $entry->dayTypeId);
        if ($type === null) {
            $types = $this->dayTypes->all($userId);
            $type = $types[0] ?? throw new \RuntimeException('User has no day types');
        }

        return Day::fromType(
            $date,
            $type,
            $settings->proteinDefault,
            $entry->trainingStart ?? self::DEFAULT_TRAINING_START,
            $entry->durationMin ?? $settings->defaultDurationMin,
            'template',
        );
    }

    /**
     * @return array{0: int|null, 1: int|null}
     */
    private function validateTraining(DayType $type, ?int $start, ?int $duration, UserSettings $settings): array
    {
        if (!$type->isTraining) {
            return [null, null];
        }
        $inRange = $start !== null && $start >= $settings->earliestTrainingMin && $start <= self::LATEST_TRAINING_MIN;
        if (!$inRange || $start % 15 !== 0) {
            throw Input::invalid(sprintf(
                'Bitte wähle eine Trainingszeit zwischen %s und 23:45 im 15-Minuten-Raster.',
                self::formatTime($settings->earliestTrainingMin),
            ));
        }
        $duration ??= $settings->defaultDurationMin;
        if (!in_array($duration, self::DURATIONS, true)) {
            throw Input::invalid('Die Dauer muss 60, 90 oder 120 Minuten betragen.');
        }

        return [$start, $duration];
    }

    private function requireDayType(int $userId, int $id): DayType
    {
        return $this->dayTypes->find($userId, $id) ?? throw HttpException::notFound();
    }

    private function accountStartDate(int $userId): string
    {
        $statement = $this->pdo->prepare('SELECT created_at FROM users WHERE id = ?');
        $statement->execute([$userId]);
        $created = $statement->fetchColumn();
        if (!is_string($created)) {
            throw HttpException::notFound();
        }

        $instant = new DateTimeImmutable($created, new DateTimeZone('UTC'));

        return LogicalCalendar::logicalDate($instant, $this->settings->get($userId)->dayBoundaryMin);
    }

    private static function assertNotFuture(string $date, string $today): void
    {
        if (!LogicalCalendar::isValidDate($date)) {
            throw Input::invalid('Ungültiges Datum.');
        }
        if ($date > $today) {
            throw Input::invalid('Für zukünftige Tage kannst du noch nichts eintragen.');
        }
    }

    private static function formatTime(int $minutes): string
    {
        return sprintf('%02d:%02d', intdiv($minutes, 60), $minutes % 60);
    }
}

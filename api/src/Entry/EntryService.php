<?php

declare(strict_types=1);

namespace Primed\Entry;

use Primed\Day\DayService;
use Primed\Day\SettingsRepository;
use Primed\Food\FoodRepository;
use Primed\Dish\DishService;
use Primed\Food\ShakeService;
use Primed\Food\Units;
use Primed\Http\HttpException;
use Primed\Http\Input;
use Primed\Support\Clock;

/**
 * Diary entries (BRIEFING §5): nutrient snapshot computed on the server from the food at the time of logging.
 */
final class EntryService
{
    public const MAX_AMOUNT = 10000;

    public function __construct(
        private readonly EntryRepository $entries,
        private readonly FoodRepository $foods,
        private readonly DayService $days,
        private readonly SettingsRepository $settings,
        private readonly Clock $clock,
        private readonly ShakeService $shakes,
        private readonly DishService $dishes,
    ) {
    }

    /**
     * @return list<Entry> in chronological order of the logical day (after-midnight entries last)
     */
    public function forDate(int $userId, string $date): array
    {
        $this->days->getDay($userId, $date); // validates the date (no future) and fixes the day
        $boundary = $this->settings->get($userId)->dayBoundaryMin;
        $entries = $this->entries->forDate($userId, $date);
        usort($entries, static fn (Entry $a, Entry $b): int => [self::logical($a->timeMin, $boundary), $a->id]
            <=> [self::logical($b->timeMin, $boundary), $b->id]);

        return $entries;
    }

    public function create(int $userId, string $date, int $timeMin, int $foodId, float $amount, string $unit): Entry
    {
        $this->days->getDay($userId, $date);
        self::assertTime($timeMin);
        $food = $this->foods->find($userId, $foodId) ?? throw HttpException::notFound();
        $quantity = Units::toQuantity($food->basis, $unit, $amount, $food->packageAmount);
        $nutrients = Units::nutrients($food->basis, $food->perBasis(), $quantity);
        $now = $this->clock->now();

        $id = $this->entries->create(
            $userId,
            $date,
            $timeMin,
            'food',
            $food->id,
            null,
            $food->name,
            $amount,
            $unit,
            $quantity,
            $nutrients,
            $now,
        );
        $this->foods->recordUse($userId, $food->id, $amount, $unit, $now);

        return $this->entries->find($userId, $id) ?? throw HttpException::notFound();
    }

    /** Logs one of the quick shakes (BRIEFING §9); nutrients from milk + current protein powder. */
    public function createShake(int $userId, string $date, int $timeMin, string $shakeId): Entry
    {
        $this->days->getDay($userId, $date);
        self::assertTime($timeMin);
        $shake = $this->shakes->get($userId, $shakeId);
        $id = $this->entries->create(
            $userId,
            $date,
            $timeMin,
            'shake',
            null,
            null,
            $shake['name'],
            1,
            'stueck',
            1,
            $shake['nutrients'],
            $this->clock->now(),
        );

        return $this->entries->find($userId, $id) ?? throw HttpException::notFound();
    }

    /** Logs portions of a meal prep dish (0.5 steps, not more than left). */
    public function createDishPortion(int $userId, string $date, int $timeMin, int $dishId, float $portions): Entry
    {
        $this->days->getDay($userId, $date);
        self::assertTime($timeMin);
        $result = $this->dishes->portions($userId, $dishId, $portions);
        $id = $this->entries->create(
            $userId,
            $date,
            $timeMin,
            'dish',
            null,
            $dishId,
            $result['dish']->name,
            $portions,
            'portion',
            $portions,
            $result['nutrients'],
            $this->clock->now(),
        );

        return $this->entries->find($userId, $id) ?? throw HttpException::notFound();
    }

    /**
     * Changes time and/or amount. The snapshot is scaled, never recomputed from the (possibly changed) food.
     */
    public function update(int $userId, int $id, ?int $timeMin, ?float $amount, ?string $unit): Entry
    {
        $entry = $this->entries->find($userId, $id) ?? throw HttpException::notFound();
        $timeMin ??= $entry->timeMin;
        self::assertTime($timeMin);
        $amount ??= $entry->amount;
        $unit ??= $entry->unit;
        if ($entry->kind === 'dish') {
            if ($unit !== 'portion' || $entry->dishId === null) {
                throw Input::invalid('Gerichte werden in Portionen eingetragen.');
            }
            if ($amount !== $entry->amount) {
                $this->dishes->portions($userId, $entry->dishId, $amount, $entry->amount);
            }
        }

        if ($unit === $entry->unit) {
            $quantity = $entry->quantity * ($amount / $entry->amount);
        } else {
            $food = $entry->foodId === null ? null : $this->foods->findAny($userId, $entry->foodId);
            if ($food === null) {
                throw Input::invalid('Die Einheit kann bei diesem Eintrag nicht mehr geändert werden.');
            }
            $quantity = Units::toQuantity($food->basis, $unit, $amount, $food->packageAmount);
        }

        $factor = $quantity / $entry->quantity;
        $nutrients = array_map(static fn (float $v): float => round($v * $factor, 1), $entry->nutrients);
        $now = $this->clock->now();
        $this->entries->update($userId, $id, $timeMin, $amount, $unit, round($quantity, 2), $nutrients, $now);

        return $this->entries->find($userId, $id) ?? throw HttpException::notFound();
    }

    public function delete(int $userId, int $id): void
    {
        $this->entries->find($userId, $id) ?? throw HttpException::notFound();
        $this->entries->delete($userId, $id);
    }

    private static function logical(int $timeMin, int $boundary): int
    {
        return $timeMin < $boundary ? $timeMin + 1440 : $timeMin;
    }

    private static function assertTime(int $timeMin): void
    {
        if ($timeMin < 0 || $timeMin > 1439 || $timeMin % 15 !== 0) {
            throw Input::invalid('Bitte wähle eine Uhrzeit im 15-Minuten-Raster.');
        }
    }
}

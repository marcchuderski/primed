<?php

declare(strict_types=1);

namespace Primed\Day;

use DateTimeImmutable;
use PDO;
use Primed\Support\Db;
use Primed\Support\Row;

final class DayRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function find(int $userId, string $date): ?Day
    {
        $statement = $this->pdo->prepare(
            'SELECT date, day_type_id, day_type_name, is_training, training_start, duration_min,
                    target_kcal, target_protein, target_carbs, target_sugar, source
               FROM days WHERE user_id = ? AND date = ?',
        );
        $statement->execute([$userId, $date]);
        $row = $statement->fetch();
        if (!is_array($row)) {
            return null;
        }

        return new Day(
            Row::string($row, 'date'),
            ($row['day_type_id'] ?? null) === null ? null : Row::int($row, 'day_type_id'),
            Row::string($row, 'day_type_name'),
            Row::int($row, 'is_training') === 1,
            ($row['training_start'] ?? null) === null ? null : Row::int($row, 'training_start'),
            ($row['duration_min'] ?? null) === null ? null : Row::int($row, 'duration_min'),
            Row::int($row, 'target_kcal'),
            Row::int($row, 'target_protein'),
            Row::int($row, 'target_carbs'),
            Row::int($row, 'target_sugar'),
            Row::string($row, 'source'),
        );
    }

    /** Inserts or replaces the day of the user. */
    public function save(int $userId, Day $day, DateTimeImmutable $now): void
    {
        $this->pdo->prepare(
            'INSERT INTO days (user_id, date, day_type_id, day_type_name, is_training, training_start, duration_min,
                               target_kcal, target_protein, target_carbs, target_sugar, source, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE day_type_id = VALUES(day_type_id), day_type_name = VALUES(day_type_name),
                 is_training = VALUES(is_training), training_start = VALUES(training_start),
                 duration_min = VALUES(duration_min), target_kcal = VALUES(target_kcal),
                 target_protein = VALUES(target_protein), target_carbs = VALUES(target_carbs),
                 target_sugar = VALUES(target_sugar), source = VALUES(source), updated_at = VALUES(updated_at)',
        )->execute([
            $userId,
            $day->date,
            $day->dayTypeId,
            $day->dayTypeName,
            $day->isTraining ? 1 : 0,
            $day->trainingStart,
            $day->durationMin,
            $day->targetKcal,
            $day->targetProtein,
            $day->targetCarbs,
            $day->targetSugar,
            $day->source,
            Db::dateTime($now),
            Db::dateTime($now),
        ]);
    }

    /**
     * @return array<string, true> dates (Y-m-d) that already have a row in [from, to]
     */
    public function existingDates(int $userId, string $from, string $to): array
    {
        $statement = $this->pdo->prepare('SELECT date FROM days WHERE user_id = ? AND date BETWEEN ? AND ?');
        $statement->execute([$userId, $from, $to]);

        $dates = [];
        foreach ($statement->fetchAll(PDO::FETCH_COLUMN) as $date) {
            if (is_string($date)) {
                $dates[$date] = true;
            }
        }

        return $dates;
    }
}

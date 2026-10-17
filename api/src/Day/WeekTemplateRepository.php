<?php

declare(strict_types=1);

namespace Primed\Day;

use PDO;
use Primed\Support\Row;

final class WeekTemplateRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @return array<int, TemplateDay> keyed by weekday (1–7)
     */
    public function all(int $userId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT weekday, day_type_id, training_start, duration_min
               FROM week_template WHERE user_id = ? ORDER BY weekday',
        );
        $statement->execute([$userId]);

        $days = [];
        foreach ($statement->fetchAll() as $row) {
            if (!is_array($row)) {
                continue;
            }
            $weekday = Row::int($row, 'weekday');
            $days[$weekday] = new TemplateDay(
                $weekday,
                Row::int($row, 'day_type_id'),
                ($row['training_start'] ?? null) === null ? null : Row::int($row, 'training_start'),
                ($row['duration_min'] ?? null) === null ? null : Row::int($row, 'duration_min'),
            );
        }

        return $days;
    }

    /**
     * @param list<TemplateDay> $days
     */
    public function replace(int $userId, array $days): void
    {
        $this->pdo->prepare('DELETE FROM week_template WHERE user_id = ?')->execute([$userId]);
        $insert = $this->pdo->prepare(
            'INSERT INTO week_template (user_id, weekday, day_type_id, training_start, duration_min)
             VALUES (?, ?, ?, ?, ?)',
        );
        foreach ($days as $day) {
            $insert->execute([$userId, $day->weekday, $day->dayTypeId, $day->trainingStart, $day->durationMin]);
        }
    }

    public function usesDayType(int $userId, int $dayTypeId): bool
    {
        $statement = $this->pdo->prepare('SELECT 1 FROM week_template WHERE user_id = ? AND day_type_id = ? LIMIT 1');
        $statement->execute([$userId, $dayTypeId]);

        return $statement->fetchColumn() !== false;
    }
}

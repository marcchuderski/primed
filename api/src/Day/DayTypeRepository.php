<?php

declare(strict_types=1);

namespace Primed\Day;

use DateTimeImmutable;
use PDO;
use Primed\Support\Db;
use Primed\Support\Row;

final class DayTypeRepository
{
    private const COLUMNS = 'id, system_key, name, kcal, protein, carbs, sugar_ref, is_training, sort';

    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @return list<DayType> active day types, ordered
     */
    public function all(int $userId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT ' . self::COLUMNS . ' FROM day_types
              WHERE user_id = ? AND deleted_at IS NULL ORDER BY sort, id',
        );
        $statement->execute([$userId]);

        $types = [];
        foreach ($statement->fetchAll() as $row) {
            if (is_array($row)) {
                $types[] = self::hydrate($row);
            }
        }

        return $types;
    }

    /** Active day type owned by the user, or null. */
    public function find(int $userId, int $id): ?DayType
    {
        $statement = $this->pdo->prepare(
            'SELECT ' . self::COLUMNS . ' FROM day_types WHERE user_id = ? AND id = ? AND deleted_at IS NULL',
        );
        $statement->execute([$userId, $id]);
        $row = $statement->fetch();

        return is_array($row) ? self::hydrate($row) : null;
    }

    public function create(
        int $userId,
        string $name,
        int $kcal,
        ?int $protein,
        int $carbs,
        int $sugarRef,
        bool $isTraining,
        DateTimeImmutable $now,
    ): int {
        $sortStatement = $this->pdo->prepare('SELECT COALESCE(MAX(sort), 0) + 1 FROM day_types WHERE user_id = ?');
        $sortStatement->execute([$userId]);
        $sort = (int) $sortStatement->fetchColumn();

        $this->pdo->prepare(
            'INSERT INTO day_types
                 (user_id, name, kcal, protein, carbs, sugar_ref, is_training, sort, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        )->execute([
            $userId,
            $name,
            $kcal,
            $protein,
            $carbs,
            $sugarRef,
            $isTraining ? 1 : 0,
            $sort,
            Db::dateTime($now),
            Db::dateTime($now),
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    public function update(
        int $userId,
        int $id,
        string $name,
        int $kcal,
        ?int $protein,
        int $carbs,
        int $sugarRef,
        bool $isTraining,
        DateTimeImmutable $now,
    ): void {
        $this->pdo->prepare(
            'UPDATE day_types
                SET name = ?, kcal = ?, protein = ?, carbs = ?, sugar_ref = ?, is_training = ?, updated_at = ?
              WHERE user_id = ? AND id = ? AND deleted_at IS NULL',
        )->execute([$name, $kcal, $protein, $carbs, $sugarRef, $isTraining ? 1 : 0, Db::dateTime($now), $userId, $id]);
    }

    public function markAsRest(int $userId, int $id): void
    {
        $this->pdo->prepare("UPDATE day_types SET system_key = 'rest' WHERE user_id = ? AND id = ?")
            ->execute([$userId, $id]);
    }

    public function softDelete(int $userId, int $id, DateTimeImmutable $now): void
    {
        $this->pdo->prepare('UPDATE day_types SET deleted_at = ? WHERE user_id = ? AND id = ? AND deleted_at IS NULL')
            ->execute([Db::dateTime($now), $userId, $id]);
    }

    /**
     * @param array<mixed> $row
     */
    private static function hydrate(array $row): DayType
    {
        return new DayType(
            Row::int($row, 'id'),
            Row::string($row, 'name'),
            Row::int($row, 'kcal'),
            ($row['protein'] ?? null) === null ? null : Row::int($row, 'protein'),
            Row::int($row, 'carbs'),
            Row::int($row, 'sugar_ref'),
            Row::int($row, 'is_training') === 1,
            Row::int($row, 'sort'),
            ($row['system_key'] ?? null) === 'rest',
        );
    }
}

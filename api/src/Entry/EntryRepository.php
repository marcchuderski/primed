<?php

declare(strict_types=1);

namespace Primed\Entry;

use DateTimeImmutable;
use PDO;
use Primed\Support\Db;
use Primed\Support\Row;

final class EntryRepository
{
    private const COLUMNS = 'e.id, e.date, e.time_min, e.kind, e.food_id, e.dish_id, e.name_snapshot, e.amount, e.unit,
        e.quantity, e.kcal, e.protein, e.carbs, e.sugar, e.fat, f.basis, f.package_amount';
    private const FROM = ' FROM entries e LEFT JOIN foods f ON f.id = e.food_id AND f.user_id = e.user_id ';

    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @return list<Entry> unordered; callers sort by logical time
     */
    public function forDate(int $userId, string $date): array
    {
        $statement = $this->pdo->prepare('SELECT ' . self::COLUMNS . self::FROM . 'WHERE e.user_id = ? AND e.date = ?');
        $statement->execute([$userId, $date]);

        $entries = [];
        foreach ($statement->fetchAll() as $row) {
            if (is_array($row)) {
                $entries[] = self::hydrate($row);
            }
        }

        return $entries;
    }

    public function find(int $userId, int $id): ?Entry
    {
        $statement = $this->pdo->prepare('SELECT ' . self::COLUMNS . self::FROM . 'WHERE e.user_id = ? AND e.id = ?');
        $statement->execute([$userId, $id]);
        $row = $statement->fetch();

        return is_array($row) ? self::hydrate($row) : null;
    }

    /**
     * @param array{kcal: float, protein: float, carbs: float, sugar: float, fat: float} $n
     */
    public function create(
        int $userId,
        string $date,
        int $timeMin,
        string $kind,
        ?int $foodId,
        string $name,
        float $amount,
        string $unit,
        float $quantity,
        array $n,
        DateTimeImmutable $now,
    ): int {
        $this->pdo->prepare(
            'INSERT INTO entries (user_id, date, time_min, kind, food_id, name_snapshot, amount, unit, quantity,
                                  kcal, protein, carbs, sugar, fat, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        )->execute([
            $userId,
            $date,
            $timeMin,
            $kind,
            $foodId,
            $name,
            $amount,
            $unit,
            $quantity,
            $n['kcal'],
            $n['protein'],
            $n['carbs'],
            $n['sugar'],
            $n['fat'],
            Db::dateTime($now),
            Db::dateTime($now),
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    /**
     * @param array{kcal: float, protein: float, carbs: float, sugar: float, fat: float} $n
     */
    public function update(
        int $userId,
        int $id,
        int $timeMin,
        float $amount,
        string $unit,
        float $quantity,
        array $n,
        DateTimeImmutable $now,
    ): void {
        $this->pdo->prepare(
            'UPDATE entries SET time_min = ?, amount = ?, unit = ?, quantity = ?, kcal = ?, protein = ?, carbs = ?,
                    sugar = ?, fat = ?, updated_at = ?
              WHERE user_id = ? AND id = ?',
        )->execute([
            $timeMin,
            $amount,
            $unit,
            $quantity,
            $n['kcal'],
            $n['protein'],
            $n['carbs'],
            $n['sugar'],
            $n['fat'],
            Db::dateTime($now),
            $userId,
            $id,
        ]);
    }

    public function delete(int $userId, int $id): void
    {
        $this->pdo->prepare('DELETE FROM entries WHERE user_id = ? AND id = ?')->execute([$userId, $id]);
    }

    /**
     * @param array<mixed> $row
     */
    private static function hydrate(array $row): Entry
    {
        return new Entry(
            Row::int($row, 'id'),
            Row::string($row, 'date'),
            Row::int($row, 'time_min'),
            Row::string($row, 'kind'),
            ($row['food_id'] ?? null) === null ? null : Row::int($row, 'food_id'),
            ($row['dish_id'] ?? null) === null ? null : Row::int($row, 'dish_id'),
            Row::string($row, 'name_snapshot'),
            Row::float($row, 'amount'),
            Row::string($row, 'unit'),
            Row::float($row, 'quantity'),
            [
                'kcal' => Row::float($row, 'kcal'),
                'protein' => Row::float($row, 'protein'),
                'carbs' => Row::float($row, 'carbs'),
                'sugar' => Row::float($row, 'sugar'),
                'fat' => Row::float($row, 'fat'),
            ],
            Row::nullableString($row, 'basis'),
            Row::nullableFloat($row, 'package_amount'),
        );
    }
}

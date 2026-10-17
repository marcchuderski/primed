<?php

declare(strict_types=1);

namespace Primed\Food;

use DateTimeImmutable;
use PDO;
use Primed\Support\Db;
use Primed\Support\Row;

final class FoodRepository
{
    private const COLUMNS = 'id, type, name, brand, barcode, category, basis, kcal, protein, carbs, sugar, fat,
        package_amount, usage_count, last_amount, last_unit';

    public function __construct(private readonly PDO $pdo)
    {
    }

    /** Active food of the user. */
    public function find(int $userId, int $id): ?Food
    {
        return $this->fetchOne(
            'SELECT ' . self::COLUMNS . ' FROM foods WHERE user_id = ? AND id = ? AND deleted_at IS NULL',
            [$userId, $id],
        );
    }

    /** Food of the user even if deleted (only for editing existing entries). */
    public function findAny(int $userId, int $id): ?Food
    {
        return $this->fetchOne('SELECT ' . self::COLUMNS . ' FROM foods WHERE user_id = ? AND id = ?', [$userId, $id]);
    }

    /**
     * @param array{type: string, name: string, brand: string|null, barcode: string|null, category: string,
     *     basis: string, kcal: float, protein: float, carbs: float, sugar: float, fat: float,
     *     packageAmount: float|null, source: string} $food
     */
    public function create(int $userId, array $food, DateTimeImmutable $now): int
    {
        $this->pdo->prepare(
            'INSERT INTO foods (user_id, type, name, brand, barcode, category, basis, kcal, protein, carbs, sugar, fat,
                                package_amount, source, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        )->execute([
            $userId,
            $food['type'],
            $food['name'],
            $food['brand'],
            $food['barcode'],
            $food['category'],
            $food['basis'],
            $food['kcal'],
            $food['protein'],
            $food['carbs'],
            $food['sugar'],
            $food['fat'],
            $food['packageAmount'],
            $food['source'],
            Db::dateTime($now),
            Db::dateTime($now),
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    public function recordUse(int $userId, int $foodId, float $amount, string $unit, DateTimeImmutable $now): void
    {
        $this->pdo->prepare(
            'UPDATE foods SET usage_count = usage_count + 1, last_amount = ?, last_unit = ?, updated_at = ?
              WHERE user_id = ? AND id = ?',
        )->execute([$amount, $unit, Db::dateTime($now), $userId, $foodId]);
    }

    public function hasAny(int $userId): bool
    {
        $statement = $this->pdo->prepare('SELECT 1 FROM foods WHERE user_id = ? LIMIT 1');
        $statement->execute([$userId]);

        return $statement->fetchColumn() !== false;
    }

    /**
     * @param list<int|string> $params
     */
    private function fetchOne(string $sql, array $params): ?Food
    {
        $statement = $this->pdo->prepare($sql);
        $statement->execute($params);
        $row = $statement->fetch();

        return is_array($row) ? self::hydrate($row) : null;
    }

    /**
     * @param array<mixed> $row
     */
    public static function hydrate(array $row): Food
    {
        return new Food(
            Row::int($row, 'id'),
            Row::string($row, 'type'),
            Row::string($row, 'name'),
            Row::nullableString($row, 'brand'),
            Row::nullableString($row, 'barcode'),
            Row::string($row, 'category'),
            Row::string($row, 'basis'),
            Row::float($row, 'kcal'),
            Row::float($row, 'protein'),
            Row::float($row, 'carbs'),
            Row::float($row, 'sugar'),
            Row::float($row, 'fat'),
            Row::nullableFloat($row, 'package_amount'),
            Row::int($row, 'usage_count'),
            Row::nullableFloat($row, 'last_amount'),
            Row::nullableString($row, 'last_unit'),
        );
    }
}

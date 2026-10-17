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

    /**
     * Library search (BRIEFING §6): sorted by frequency. Ingredients only when requested (meal prep).
     *
     * @return list<Food>
     */
    public function search(
        int $userId,
        ?string $query,
        ?string $category,
        ?string $type,
        bool $includeIngredients,
        int $limit = 50,
    ): array {
        $sql = 'SELECT ' . self::COLUMNS . ' FROM foods WHERE user_id = ? AND deleted_at IS NULL';
        $params = [$userId];
        if (!$includeIngredients && $type === null) {
            $sql .= " AND type <> 'ingredient'";
        }
        if ($category !== null) {
            $sql .= ' AND category = ?';
            $params[] = $category;
        }
        if ($type !== null) {
            $sql .= ' AND type = ?';
            $params[] = $type;
        }
        if ($query !== null && $query !== '') {
            $like = '%' . addcslashes($query, '%_\\') . '%';
            $sql .= " AND (name LIKE ? ESCAPE '\\\\' OR brand LIKE ? ESCAPE '\\\\')";
            $params[] = $like;
            $params[] = $like;
        }
        $sql .= ' ORDER BY usage_count DESC, name LIMIT ' . max(1, min(100, $limit));

        return $this->fetchAll($sql, $params);
    }

    /**
     * Most used foods around a time of day (±window) in the recent past, most frequent first (D-083).
     *
     * @return list<Food>
     */
    public function frequentAround(
        int $userId,
        int $logicalMinute,
        int $windowMin,
        int $dayBoundaryMin,
        string $sinceDate,
        int $limit = 5,
    ): array {
        $sql = 'SELECT ' . self::prefixed('f') . ', COUNT(*) AS hits
                  FROM entries e
                  JOIN foods f ON f.id = e.food_id AND f.user_id = e.user_id
                 WHERE e.user_id = ? AND e.date >= ? AND f.deleted_at IS NULL AND f.type <> \'ingredient\'
                   AND (CASE WHEN e.time_min < ? THEN e.time_min + 1440 ELSE e.time_min END) BETWEEN ? AND ?
                 GROUP BY f.id
                 ORDER BY hits DESC, f.usage_count DESC, f.name
                 LIMIT ' . max(1, min(20, $limit));

        return $this->fetchAll($sql, [
            $userId,
            $sinceDate,
            $dayBoundaryMin,
            $logicalMinute - $windowMin,
            $logicalMinute + $windowMin,
        ]);
    }

    public function findByBarcode(int $userId, string $barcode): ?Food
    {
        return $this->fetchOne(
            'SELECT ' . self::COLUMNS . ' FROM foods WHERE user_id = ? AND barcode = ? AND deleted_at IS NULL',
            [$userId, $barcode],
        );
    }

    /** Id of a soft-deleted food with this barcode (so it can be restored instead of duplicated). */
    public function deletedIdByBarcode(int $userId, string $barcode): ?int
    {
        $statement = $this->pdo->prepare(
            'SELECT id FROM foods WHERE user_id = ? AND barcode = ? AND deleted_at IS NOT NULL',
        );
        $statement->execute([$userId, $barcode]);
        $id = $statement->fetchColumn();

        return $id === false ? null : (int) $id;
    }

    /**
     * @param array{type: string, name: string, brand: string|null, barcode: string|null, category: string,
     *     basis: string, kcal: float, protein: float, carbs: float, sugar: float, fat: float,
     *     packageAmount: float|null, source: string} $food
     */
    public function update(int $userId, int $id, array $food, DateTimeImmutable $now): void
    {
        $this->pdo->prepare(
            'UPDATE foods SET type = ?, name = ?, brand = ?, barcode = ?, category = ?, basis = ?, kcal = ?,
                    protein = ?, carbs = ?, sugar = ?, fat = ?, package_amount = ?, deleted_at = NULL, updated_at = ?
              WHERE user_id = ? AND id = ?',
        )->execute([
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
            Db::dateTime($now),
            $userId,
            $id,
        ]);
    }

    public function softDelete(int $userId, int $id, DateTimeImmutable $now): void
    {
        $this->pdo->prepare('UPDATE foods SET deleted_at = ? WHERE user_id = ? AND id = ? AND deleted_at IS NULL')
            ->execute([Db::dateTime($now), $userId, $id]);
    }

    public function recordUse(int $userId, int $foodId, float $amount, string $unit, DateTimeImmutable $now): void
    {
        $this->pdo->prepare(
            'UPDATE foods SET usage_count = usage_count + 1, last_amount = ?, last_unit = ?, updated_at = ?
              WHERE user_id = ? AND id = ?',
        )->execute([$amount, $unit, Db::dateTime($now), $userId, $foodId]);
    }

    /**
     * @return array<string, true> names of all foods of the user (including deleted)
     */
    public function namesOf(int $userId): array
    {
        $statement = $this->pdo->prepare('SELECT name FROM foods WHERE user_id = ?');
        $statement->execute([$userId]);
        $names = [];
        foreach ($statement->fetchAll(PDO::FETCH_COLUMN) as $name) {
            if (is_string($name)) {
                $names[$name] = true;
            }
        }

        return $names;
    }

    /** Links the seeded milks and protein powder to the shake settings where not set yet (D-040). */
    public function linkShakeDefaults(int $userId): void
    {
        $this->pdo->prepare(
            "UPDATE user_settings s
                SET s.protein_powder_food_id = COALESCE(s.protein_powder_food_id, (SELECT f.id FROM foods f
                        WHERE f.user_id = s.user_id AND f.barcode = '4250519647234' AND f.deleted_at IS NULL LIMIT 1)),
                    s.shake_milk_low_food_id = COALESCE(s.shake_milk_low_food_id, (SELECT f.id FROM foods f
                        WHERE f.user_id = s.user_id AND f.name = 'Milch 1,5 %' AND f.deleted_at IS NULL LIMIT 1)),
                    s.shake_milk_high_food_id = COALESCE(s.shake_milk_high_food_id, (SELECT f.id FROM foods f
                        WHERE f.user_id = s.user_id AND f.name = 'Milch 3,5 %' AND f.deleted_at IS NULL LIMIT 1))
              WHERE s.user_id = ?",
        )->execute([$userId]);
    }

    public function hasAny(int $userId): bool
    {
        $statement = $this->pdo->prepare('SELECT 1 FROM foods WHERE user_id = ? LIMIT 1');
        $statement->execute([$userId]);

        return $statement->fetchColumn() !== false;
    }

    /**
     * @param list<int|string> $params
     * @return list<Food>
     */
    private function fetchAll(string $sql, array $params): array
    {
        $statement = $this->pdo->prepare($sql);
        $statement->execute($params);
        $foods = [];
        foreach ($statement->fetchAll() as $row) {
            if (is_array($row)) {
                $foods[] = self::hydrate($row);
            }
        }

        return $foods;
    }

    private static function prefixed(string $alias): string
    {
        $columns = array_map('trim', explode(',', self::COLUMNS));

        return implode(', ', array_map(static fn (string $c): string => $alias . '.' . $c, $columns));
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

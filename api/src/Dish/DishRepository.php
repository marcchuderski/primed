<?php

declare(strict_types=1);

namespace Primed\Dish;

use DateTimeImmutable;
use PDO;
use Primed\Support\Db;
use Primed\Support\Row;

final class DishRepository
{
    private const SELECT = 'SELECT d.id, d.name, d.cooked_on, d.portions_total, d.kcal, d.protein, d.carbs, d.sugar,
            d.fat, d.discarded_at, d.based_on_dish_id,
            COALESCE((SELECT SUM(e.amount) FROM entries e
                       WHERE e.dish_id = d.id AND e.user_id = d.user_id AND e.kind = \'dish\'), 0) AS eaten
          FROM dishes d';

    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * @return list<Dish> newest first
     */
    public function all(int $userId): array
    {
        $statement = $this->pdo->prepare(self::SELECT . ' WHERE d.user_id = ? ORDER BY d.cooked_on DESC, d.id DESC');
        $statement->execute([$userId]);
        $dishes = [];
        foreach ($statement->fetchAll() as $row) {
            if (is_array($row)) {
                $dishes[] = self::hydrate($row, []);
            }
        }

        return $dishes;
    }

    public function find(int $userId, int $id, bool $withIngredients = false): ?Dish
    {
        $statement = $this->pdo->prepare(self::SELECT . ' WHERE d.user_id = ? AND d.id = ?');
        $statement->execute([$userId, $id]);
        $row = $statement->fetch();
        if (!is_array($row)) {
            return null;
        }

        return self::hydrate($row, $withIngredients ? $this->ingredients($id) : []);
    }

    /**
     * @param list<DishIngredient> $ingredients
     * @param array{kcal: float, protein: float, carbs: float, sugar: float, fat: float} $totals
     */
    public function create(
        int $userId,
        string $name,
        string $cookedOn,
        float $portions,
        array $totals,
        array $ingredients,
        ?int $basedOn,
        DateTimeImmutable $now,
    ): int {
        $this->pdo->prepare(
            'INSERT INTO dishes (user_id, name, cooked_on, portions_total, kcal, protein, carbs, sugar, fat,
                                 based_on_dish_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        )->execute([
            $userId,
            $name,
            $cookedOn,
            $portions,
            $totals['kcal'],
            $totals['protein'],
            $totals['carbs'],
            $totals['sugar'],
            $totals['fat'],
            $basedOn,
            Db::dateTime($now),
            Db::dateTime($now),
        ]);
        $id = (int) $this->pdo->lastInsertId();
        $this->insertIngredients($id, $ingredients);

        return $id;
    }

    /**
     * @param list<DishIngredient> $ingredients
     * @param array{kcal: float, protein: float, carbs: float, sugar: float, fat: float} $totals
     */
    public function update(
        int $userId,
        int $id,
        string $name,
        float $portions,
        array $totals,
        array $ingredients,
        DateTimeImmutable $now,
    ): void {
        $this->pdo->prepare(
            'UPDATE dishes SET name = ?, portions_total = ?, kcal = ?, protein = ?, carbs = ?, sugar = ?, fat = ?,
                    updated_at = ?
              WHERE user_id = ? AND id = ?',
        )->execute([
            $name,
            $portions,
            $totals['kcal'],
            $totals['protein'],
            $totals['carbs'],
            $totals['sugar'],
            $totals['fat'],
            Db::dateTime($now),
            $userId,
            $id,
        ]);
        $this->pdo->prepare('DELETE FROM dish_ingredients WHERE dish_id = ?')->execute([$id]);
        $this->insertIngredients($id, $ingredients);
    }

    public function discard(int $userId, int $id, DateTimeImmutable $now): void
    {
        $this->pdo->prepare('UPDATE dishes SET discarded_at = ? WHERE user_id = ? AND id = ? AND discarded_at IS NULL')
            ->execute([Db::dateTime($now), $userId, $id]);
    }

    /**
     * @param list<DishIngredient> $ingredients
     */
    private function insertIngredients(int $dishId, array $ingredients): void
    {
        $insert = $this->pdo->prepare(
            'INSERT INTO dish_ingredients (dish_id, food_id, sort, name_snapshot, food_type, amount, unit, quantity,
                                           kcal, protein, carbs, sugar, fat)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        );
        foreach ($ingredients as $sort => $i) {
            $insert->execute([
                $dishId,
                $i->foodId,
                $sort,
                $i->name,
                $i->foodType,
                $i->amount,
                $i->unit,
                $i->quantity,
                $i->nutrients['kcal'],
                $i->nutrients['protein'],
                $i->nutrients['carbs'],
                $i->nutrients['sugar'],
                $i->nutrients['fat'],
            ]);
        }
    }

    /**
     * @return list<DishIngredient>
     */
    private function ingredients(int $dishId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT i.food_id, i.name_snapshot, i.food_type, i.amount, i.unit, i.quantity, i.kcal, i.protein,
                    i.carbs, i.sugar, i.fat, f.basis
               FROM dish_ingredients i LEFT JOIN foods f ON f.id = i.food_id
              WHERE i.dish_id = ? ORDER BY i.sort',
        );
        $statement->execute([$dishId]);
        $list = [];
        foreach ($statement->fetchAll() as $row) {
            if (!is_array($row)) {
                continue;
            }
            $list[] = new DishIngredient(
                ($row['food_id'] ?? null) === null ? null : Row::int($row, 'food_id'),
                Row::string($row, 'name_snapshot'),
                Row::string($row, 'food_type'),
                Row::float($row, 'amount'),
                Row::string($row, 'unit'),
                Row::float($row, 'quantity'),
                self::nutrients($row),
                Row::nullableString($row, 'basis'),
            );
        }

        return $list;
    }

    /**
     * @param array<mixed> $row
     * @return array{kcal: float, protein: float, carbs: float, sugar: float, fat: float}
     */
    private static function nutrients(array $row): array
    {
        return [
            'kcal' => Row::float($row, 'kcal'),
            'protein' => Row::float($row, 'protein'),
            'carbs' => Row::float($row, 'carbs'),
            'sugar' => Row::float($row, 'sugar'),
            'fat' => Row::float($row, 'fat'),
        ];
    }

    /**
     * @param array<mixed> $row
     * @param list<DishIngredient> $ingredients
     */
    private static function hydrate(array $row, array $ingredients): Dish
    {
        return new Dish(
            Row::int($row, 'id'),
            Row::string($row, 'name'),
            Row::string($row, 'cooked_on'),
            Row::float($row, 'portions_total'),
            Row::float($row, 'eaten'),
            self::nutrients($row),
            ($row['discarded_at'] ?? null) !== null,
            ($row['based_on_dish_id'] ?? null) === null ? null : Row::int($row, 'based_on_dish_id'),
            $ingredients,
        );
    }
}

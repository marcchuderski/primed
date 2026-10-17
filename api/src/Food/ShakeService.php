<?php

declare(strict_types=1);

namespace Primed\Food;

use PDO;
use Primed\Http\HttpException;
use Primed\Support\Row;

/**
 * The three quick shakes (BRIEFING §9, D-040): milk + current protein powder, computed from library foods.
 */
final class ShakeService
{
    public const SHAKES = [
        'big' => ['name' => 'Shake Groß', 'label' => 'Groß', 'milk' => 'low', 'size' => 'big'],
        'small_low' => ['name' => 'Shake Klein 1,5 %', 'label' => 'Klein 1,5 %', 'milk' => 'low', 'size' => 'small'],
        'small_high' => ['name' => 'Shake Klein 3,5 %', 'label' => 'Klein 3,5 %', 'milk' => 'high', 'size' => 'small'],
    ];

    public function __construct(private readonly PDO $pdo, private readonly FoodRepository $foods)
    {
    }

    /**
     * @return list<array{id: string, name: string, label: string, nutrients: array{kcal: float, protein: float,
     *     carbs: float, sugar: float, fat: float}}>
     */
    public function all(int $userId): array
    {
        $config = $this->config($userId);
        $shakes = [];
        foreach (self::SHAKES as $id => $shake) {
            $nutrients = $this->compute($userId, $config, $id);
            if ($nutrients !== null) {
                $shakes[] = [
                    'id' => $id,
                    'name' => $shake['name'],
                    'label' => $shake['label'],
                    'nutrients' => $nutrients,
                ];
            }
        }

        return $shakes;
    }

    /**
     * @return array{name: string,
     *     nutrients: array{kcal: float, protein: float, carbs: float, sugar: float, fat: float}}
     */
    public function get(int $userId, string $id): array
    {
        $shake = self::SHAKES[$id] ?? throw HttpException::notFound();
        $nutrients = $this->compute($userId, $this->config($userId), $id)
            ?? throw new HttpException(
                409,
                'shake_unavailable',
                'Für diesen Shake fehlt Milch oder Proteinpulver in deinen Einstellungen.',
            );

        return ['name' => $shake['name'], 'nutrients' => $nutrients];
    }

    /**
     * @param array{powder: int|null, low: int|null, high: int|null, big: int, small: int, grams: int} $config
     * @return array{kcal: float, protein: float, carbs: float, sugar: float, fat: float}|null
     */
    private function compute(int $userId, array $config, string $id): ?array
    {
        $shake = self::SHAKES[$id];
        $milkId = $shake['milk'] === 'low' ? $config['low'] : $config['high'];
        $milk = $milkId === null ? null : $this->foods->find($userId, $milkId);
        $powder = $config['powder'] === null ? null : $this->foods->find($userId, $config['powder']);
        if ($milk === null || $powder === null || $milk->basis === 'per_unit' || $powder->basis === 'per_unit') {
            return null;
        }
        $ml = $shake['size'] === 'big' ? $config['big'] : $config['small'];
        $a = Units::nutrients($milk->basis, $milk->perBasis(), $ml);
        $b = Units::nutrients($powder->basis, $powder->perBasis(), $config['grams']);

        return [
            'kcal' => round($a['kcal'] + $b['kcal'], 1),
            'protein' => round($a['protein'] + $b['protein'], 1),
            'carbs' => round($a['carbs'] + $b['carbs'], 1),
            'sugar' => round($a['sugar'] + $b['sugar'], 1),
            'fat' => round($a['fat'] + $b['fat'], 1),
        ];
    }

    /**
     * @return array{powder: int|null, low: int|null, high: int|null, big: int, small: int, grams: int}
     */
    private function config(int $userId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT protein_powder_food_id, shake_milk_low_food_id, shake_milk_high_food_id,
                    shake_big_ml, shake_small_ml, shake_powder_g
               FROM user_settings WHERE user_id = ?',
        );
        $statement->execute([$userId]);
        $row = $statement->fetch();
        if (!is_array($row)) {
            throw HttpException::notFound();
        }
        $id = static fn (string $c): ?int => ($row[$c] ?? null) === null ? null : Row::int($row, $c);

        return [
            'powder' => $id('protein_powder_food_id'),
            'low' => $id('shake_milk_low_food_id'),
            'high' => $id('shake_milk_high_food_id'),
            'big' => Row::int($row, 'shake_big_ml'),
            'small' => Row::int($row, 'shake_small_ml'),
            'grams' => Row::int($row, 'shake_powder_g'),
        ];
    }
}

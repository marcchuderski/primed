<?php

declare(strict_types=1);

namespace Primed\Food;

use PDO;
use Primed\Http\HttpException;
use Primed\Support\Row;

/**
 * Quick shakes (BRIEFING §9, D-139): fixed sizes, liquid from fixed reference values, current protein powder
 * from the library. Variants exist for every liquid the user selected.
 */
final class ShakeService
{
    /** Millilitres per size. */
    public const SIZES = ['big' => 400, 'small' => 200];

    /**
     * Per 100 ml (BLS-based values as in the seed, docs/DEFAULTS.md); water has no energy.
     */
    public const LIQUIDS = [
        'milk_low' => [
            'label' => 'Milch 1,5 %',
            'column' => 'shake_liquid_milk_low',
            'per100' => ['kcal' => 47.0, 'protein' => 3.4, 'carbs' => 4.8, 'sugar' => 4.8, 'fat' => 1.5],
        ],
        'milk_high' => [
            'label' => 'Milch 3,5 %',
            'column' => 'shake_liquid_milk_high',
            'per100' => ['kcal' => 64.0, 'protein' => 3.3, 'carbs' => 4.7, 'sugar' => 4.7, 'fat' => 3.5],
        ],
        'water' => [
            'label' => 'Wasser',
            'column' => 'shake_liquid_water',
            'per100' => ['kcal' => 0.0, 'protein' => 0.0, 'carbs' => 0.0, 'sugar' => 0.0, 'fat' => 0.0],
        ],
    ];

    public function __construct(private readonly PDO $pdo, private readonly FoodRepository $foods)
    {
    }

    /**
     * All possible shake ids, e.g. "big_milk_low", "small_water".
     *
     * @return list<string>
     */
    public static function ids(): array
    {
        $ids = [];
        foreach (array_keys(self::SIZES) as $size) {
            foreach (array_keys(self::LIQUIDS) as $liquid) {
                $ids[] = $size . '_' . $liquid;
            }
        }

        return $ids;
    }

    /**
     * @return list<array{id: string, size: string, liquid: string, name: string, label: string,
     *     nutrients: array{kcal: float, protein: float, carbs: float, sugar: float, fat: float}}>
     */
    public function all(int $userId): array
    {
        $config = $this->config($userId);
        $powder = $this->powder($userId, $config['powder']);
        if ($powder === null) {
            return [];
        }
        $shakes = [];
        foreach (array_keys(self::SIZES) as $size) {
            foreach (array_keys(self::LIQUIDS) as $liquid) {
                if ($config['liquids'][$liquid]) {
                    $shakes[] = $this->shake($size, $liquid, $powder, $config['grams']);
                }
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
        [$size, $liquid] = self::split($id) ?? throw HttpException::notFound();
        $config = $this->config($userId);
        $powder = $this->powder($userId, $config['powder']);
        if ($powder === null || !$config['liquids'][$liquid]) {
            throw new HttpException(
                409,
                'shake_unavailable',
                'Dieser Shake ist in deinen Einstellungen nicht verfügbar (Proteinpulver oder Flüssigkeit fehlt).',
            );
        }
        $shake = $this->shake($size, $liquid, $powder, $config['grams']);

        return ['name' => $shake['name'], 'nutrients' => $shake['nutrients']];
    }

    /**
     * @return array{0: string, 1: string}|null
     */
    private static function split(string $id): ?array
    {
        foreach (array_keys(self::SIZES) as $size) {
            foreach (array_keys(self::LIQUIDS) as $liquid) {
                if ($id === $size . '_' . $liquid) {
                    return [$size, $liquid];
                }
            }
        }

        return null;
    }

    private function powder(int $userId, ?int $powderId): ?Food
    {
        $powder = $powderId === null ? null : $this->foods->find($userId, $powderId);

        return $powder === null || $powder->basis === 'per_unit' ? null : $powder;
    }

    /**
     * @return array{id: string, size: string, liquid: string, name: string, label: string,
     *     nutrients: array{kcal: float, protein: float, carbs: float, sugar: float, fat: float}}
     */
    private function shake(string $size, string $liquid, Food $powder, int $grams): array
    {
        $ml = self::SIZES[$size];
        $per100 = self::LIQUIDS[$liquid]['per100'];
        $b = Units::nutrients($powder->basis, $powder->perBasis(), $grams);
        $sizeLabel = $size === 'big' ? 'Groß' : 'Klein';
        $liquidLabel = self::LIQUIDS[$liquid]['label'];
        $nutrients = [];
        foreach (['kcal', 'protein', 'carbs', 'sugar', 'fat'] as $key) {
            $nutrients[$key] = round($per100[$key] * $ml / 100 + $b[$key], 1);
        }

        return [
            'id' => $size . '_' . $liquid,
            'size' => $size,
            'liquid' => $liquid,
            'name' => "Shake {$sizeLabel} · {$liquidLabel}",
            'label' => "{$sizeLabel} · {$liquidLabel}",
            'nutrients' => $nutrients,
        ];
    }

    /**
     * @return array{powder: int|null, grams: int, liquids: array<string, bool>}
     */
    private function config(int $userId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT protein_powder_food_id, shake_powder_g,
                    shake_liquid_milk_low, shake_liquid_milk_high, shake_liquid_water
               FROM user_settings WHERE user_id = ?',
        );
        $statement->execute([$userId]);
        $row = $statement->fetch();
        if (!is_array($row)) {
            throw HttpException::notFound();
        }
        $liquids = [];
        foreach (self::LIQUIDS as $key => $liquid) {
            $liquids[$key] = Row::int($row, $liquid['column']) === 1;
        }

        return [
            'powder' => ($row['protein_powder_food_id'] ?? null) === null
                ? null : Row::int($row, 'protein_powder_food_id'),
            'grams' => Row::int($row, 'shake_powder_g'),
            'liquids' => $liquids,
        ];
    }
}

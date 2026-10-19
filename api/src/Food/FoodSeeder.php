<?php

declare(strict_types=1);

namespace Primed\Food;

use DateTimeImmutable;

/**
 * Start library (docs/DEFAULTS.md, D-041, D-080, D-159): everyone gets the two milks (kept for shakes, shown in the
 * library only while shakes are on) and the default protein powder. The BLS reference values and the owner's
 * former start products were removed in migration 012.
 */
final class FoodSeeder
{
    /**
     * name, type, category, basis, kcal, protein, carbs, sugar, fat, package, source, barcode, system key
     *
     * @var list<array{string, string, string, string, int|float, float, float, float, float, int, string,
     *     string|null, string|null}>
     */
    private const SHARED = [
        ['Milch 1,5 %', 'reference', 'drinks', 'per_100ml', 47, 3.4, 4.8, 4.8, 1.5, 1000, 'seed', null, 'milk_low'],
        ['Milch 3,5 %', 'reference', 'drinks', 'per_100ml', 64, 3.3, 4.7, 4.7, 3.5, 1000, 'seed', null, 'milk_high'],
        [
            'ESN Designer Whey Milk Chocolate', 'product', 'drinks', 'per_100g', 374, 72.0, 5.9, 5.2, 5.3, 908, 'seed',
            '4250519647234', null,
        ],
    ];

    public function __construct(private readonly FoodRepository $foods)
    {
    }

    /**
     * Idempotent: adds every default that the user does not have yet (by name). $ownerDefaults no longer
     * changes the library (it still selects the personal week template in UserSeeder).
     */
    public function seed(int $userId, bool $ownerDefaults, DateTimeImmutable $now): void
    {
        unset($ownerDefaults);
        $existing = $this->foods->namesOf($userId);
        foreach (self::SHARED as $row) {
            [$name, $type, $category, $basis, $kcal, $protein, $carbs, $sugar, $fat, $package, $source] = $row;
            if (isset($existing[$name])) {
                continue;
            }
            $this->foods->create($userId, [
                'type' => $type,
                'name' => $name,
                'brand' => null,
                'barcode' => $row[11],
                'category' => $category,
                'basis' => $basis,
                'kcal' => (float) $kcal,
                'protein' => $protein,
                'carbs' => $carbs,
                'sugar' => $sugar,
                'fat' => $fat,
                'packageAmount' => (float) $package,
                'source' => $source,
                'systemKey' => $row[12],
            ], $now);
        }
        $this->foods->linkShakeDefaults($userId);
    }
}

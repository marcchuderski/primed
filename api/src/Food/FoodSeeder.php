<?php

declare(strict_types=1);

namespace Primed\Food;

use DateTimeImmutable;

/**
 * Start library (docs/DEFAULTS.md, D-041, D-080): everyone gets the two milks (shakes);
 * the owner additionally gets the six products from the former nutrition plan.
 * BLS reference values and the protein powder follow in phase 3 after confirmation.
 */
final class FoodSeeder
{
    /** @var list<array{string, string, string, string, int|float, float, float, float, float, int|null}> */
    private const MILK = [
        // name, type, category, basis, kcal, protein, carbs, sugar, fat, package
        ['Milch 1,5 %', 'reference', 'drinks', 'per_100ml', 47, 3.4, 4.8, 4.8, 1.5, 1000],
        ['Milch 3,5 %', 'reference', 'drinks', 'per_100ml', 64, 3.3, 4.7, 4.7, 3.5, 1000],
    ];

    /** @var list<array{string, string, string, string, int|float, float, float, float, float, int|null}> */
    private const OWNER_PRODUCTS = [
        ['REWE Quarkcreme', 'product', 'dairy', 'per_100g', 67, 12.4, 3.2, 2.6, 0.5, 200],
        ['REWE Dinkelbrötchen', 'product', 'bread', 'per_100g', 246, 10.0, 46.0, 2.7, 1.8, null],
        ['Lidl körniger Frischkäse', 'product', 'dairy', 'per_100g', 97, 19.0, 4.0, 4.0, 0.5, null],
        ['DM Proteinriegel', 'product', 'snacks', 'per_unit', 163, 23.0, 12.0, 1.2, 4.6, null],
        ['Lidl Müsli-Riegel', 'product', 'snacks', 'per_unit', 87, 1.9, 17.0, 0.4, 2.3, null],
        ['Lidl Chicken Nuggets', 'product', 'snacks', 'per_100g', 315, 25.2, 23.3, 1.1, 13.2, null],
    ];

    public function __construct(private readonly FoodRepository $foods)
    {
    }

    public function seed(int $userId, bool $ownerDefaults, DateTimeImmutable $now): void
    {
        if ($this->foods->hasAny($userId)) {
            return;
        }
        $rows = $ownerDefaults ? [...self::MILK, ...self::OWNER_PRODUCTS] : self::MILK;
        foreach ($rows as [$name, $type, $category, $basis, $kcal, $protein, $carbs, $sugar, $fat, $package]) {
            $this->foods->create($userId, [
                'type' => $type,
                'name' => $name,
                'brand' => null,
                'barcode' => null,
                'category' => $category,
                'basis' => $basis,
                'kcal' => (float) $kcal,
                'protein' => $protein,
                'carbs' => $carbs,
                'sugar' => $sugar,
                'fat' => $fat,
                'packageAmount' => $package === null ? null : (float) $package,
                'source' => 'seed',
            ], $now);
        }
    }
}

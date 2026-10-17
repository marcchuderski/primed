<?php

declare(strict_types=1);

namespace Primed\Food;

use DateTimeImmutable;

/**
 * Start library (docs/DEFAULTS.md, D-041, D-080, D-110):
 * everyone gets milk, the default protein powder and the BLS reference values;
 * the owner additionally gets the six products from the former nutrition plan.
 * Reference values: Max Rubner-Institut (2025), BLS 4.0, CC BY 4.0, DOI 10.25826/Data20251217-134202-0 (rounded).
 */
final class FoodSeeder
{
    /**
     * name, type, category, basis, kcal, protein, carbs, sugar, fat, package, source, barcode
     *
     * @var list<array{string, string, string, string, int|float, float, float, float, float, int|null, string,
     *     string|null}>
     */
    private const SHARED = [
        ['Milch 1,5 %', 'reference', 'drinks', 'per_100ml', 47, 3.4, 4.8, 4.8, 1.5, 1000, 'seed', null],
        ['Milch 3,5 %', 'reference', 'drinks', 'per_100ml', 64, 3.3, 4.7, 4.7, 3.5, 1000, 'seed', null],
        [
            'ESN Designer Whey Milk Chocolate', 'product', 'drinks', 'per_100g', 374, 72.0, 5.9, 5.2, 5.3, 908, 'seed',
            '4250519647234',
        ],
        ['Bäckerbrötchen (Weizen)', 'reference', 'bread', 'per_100g', 280, 10.1, 54.0, 3.1, 1.8, null, 'bls', null],
        ['Magerquark', 'reference', 'dairy', 'per_100g', 66, 11.9, 3.7, 3.7, 0.2, null, 'bls', null],
        ['Skyr natur', 'reference', 'dairy', 'per_100g', 64, 10.4, 3.2, 3.1, 0.8, null, 'bls', null],
        ['Hähnchenbrust, roh', 'reference', 'basics', 'per_100g', 109, 23.3, 0.0, 0.0, 1.8, null, 'bls', null],
        ['Reis, roh', 'reference', 'basics', 'per_100g', 351, 7.9, 77.1, 0.3, 0.6, null, 'bls', null],
        ['Nudeln, roh', 'reference', 'basics', 'per_100g', 346, 12.4, 68.8, 2.0, 1.6, null, 'bls', null],
        ['Haferflocken', 'reference', 'basics', 'per_100g', 348, 13.2, 53.3, 0.7, 6.7, null, 'bls', null],
        ['Banane', 'reference', 'produce', 'per_100g', 79, 1.3, 15.9, 13.9, 0.4, null, 'bls', null],
        ['Apfel', 'reference', 'produce', 'per_100g', 58, 0.4, 11.7, 10.5, 0.5, null, 'bls', null],
        ['Zwiebel', 'reference', 'produce', 'per_100g', 34, 1.2, 6.0, 6.0, 0.2, null, 'bls', null],
        ['Paprika, rot', 'reference', 'produce', 'per_100g', 36, 1.0, 6.2, 6.2, 0.2, null, 'bls', null],
        ['Olivenöl', 'reference', 'basics', 'per_100g', 899, 0.0, 0.0, 0.0, 99.9, null, 'bls', null],
        ['Butter', 'reference', 'basics', 'per_100g', 747, 0.6, 0.6, 0.6, 82.5, null, 'bls', null],
        ['Ei (Hühnerei), roh', 'reference', 'basics', 'per_100g', 135, 13.2, 0.3, 0.3, 9.0, null, 'bls', null],
    ];

    /**
     * @var list<array{string, string, string, string, int|float, float, float, float, float, int|null, string,
     *     string|null}>
     */
    private const OWNER_PRODUCTS = [
        ['REWE Quarkcreme', 'product', 'dairy', 'per_100g', 67, 12.4, 3.2, 2.6, 0.5, 200, 'seed', null],
        ['REWE Dinkelbrötchen', 'product', 'bread', 'per_100g', 246, 10.0, 46.0, 2.7, 1.8, null, 'seed', null],
        ['Lidl körniger Frischkäse', 'product', 'dairy', 'per_100g', 97, 19.0, 4.0, 4.0, 0.5, null, 'seed', null],
        ['DM Proteinriegel', 'product', 'snacks', 'per_unit', 163, 23.0, 12.0, 1.2, 4.6, null, 'seed', null],
        ['Lidl Müsli-Riegel', 'product', 'snacks', 'per_unit', 87, 1.9, 17.0, 0.4, 2.3, null, 'seed', null],
        ['Lidl Chicken Nuggets', 'product', 'snacks', 'per_100g', 315, 25.2, 23.3, 1.1, 13.2, null, 'seed', null],
    ];

    public function __construct(private readonly FoodRepository $foods)
    {
    }

    /**
     * Idempotent: adds every default that the user does not have yet (by name), so existing users
     * receive later additions; owner products only on the very first seed.
     */
    public function seed(int $userId, bool $ownerDefaults, DateTimeImmutable $now): void
    {
        $firstSeed = !$this->foods->hasAny($userId);
        $rows = $ownerDefaults && $firstSeed ? [...self::SHARED, ...self::OWNER_PRODUCTS] : self::SHARED;
        $existing = $this->foods->namesOf($userId);
        foreach ($rows as $row) {
            [$name, $type, $category, $basis, $kcal, $protein, $carbs, $sugar, $fat, $package, $source] = $row;
            $barcode = $row[11];
            if (isset($existing[$name])) {
                continue;
            }
            $this->foods->create($userId, [
                'type' => $type,
                'name' => $name,
                'brand' => null,
                'barcode' => $barcode,
                'category' => $category,
                'basis' => $basis,
                'kcal' => (float) $kcal,
                'protein' => $protein,
                'carbs' => $carbs,
                'sugar' => $sugar,
                'fat' => $fat,
                'packageAmount' => $package === null ? null : (float) $package,
                'source' => $source,
            ], $now);
        }
    }
}

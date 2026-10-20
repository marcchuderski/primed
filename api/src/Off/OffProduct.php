<?php

declare(strict_types=1);

namespace Primed\Off;

/**
 * A product from Open Food Facts, normalized to Primed's food fields (values per 100 g or per 100 ml).
 */
final class OffProduct
{
    public function __construct(
        public readonly string $barcode,
        public readonly string $name,
        public readonly ?string $brand,
        public readonly string $category,
        public readonly string $basis,
        public readonly float $kcal,
        public readonly float $protein,
        public readonly float $carbs,
        public readonly float $sugar,
        public readonly float $fat,
        public readonly ?float $packageAmount,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'barcode' => $this->barcode,
            'name' => $this->name,
            'brand' => $this->brand,
            'category' => $this->category,
            'basis' => $this->basis,
            'nutrients' => [
                'kcal' => $this->kcal,
                'protein' => $this->protein,
                'carbs' => $this->carbs,
                'sugar' => $this->sugar,
                'fat' => $this->fat,
            ],
            'packageAmount' => $this->packageAmount,
        ];
    }

    /**
     * Validates and normalizes one raw OFF product; returns null if essential data is missing or implausible.
     *
     * @param array<mixed> $p
     */
    public static function fromOff(array $p): ?self
    {
        $code = $p['code'] ?? null;
        $nutriments = $p['nutriments'] ?? null;
        if (!is_string($code) || preg_match('/^\d{8,14}$/', $code) !== 1 || !is_array($nutriments)) {
            return null;
        }

        $name = self::text($p['product_name_de'] ?? null) ?? self::text($p['product_name'] ?? null);
        if ($name === null) {
            return null;
        }
        $rawBrands = $p['brands'] ?? null;
        $brands = self::text(is_array($rawBrands) ? implode(',', array_filter($rawBrands, 'is_string')) : $rawBrands);
        $brand = $brands === null ? null : self::clip(trim(explode(',', $brands)[0]), 80);

        $kcal = self::number($nutriments['energy-kcal_100g'] ?? null);
        if ($kcal === null) {
            $kj = self::number($nutriments['energy_100g'] ?? null);
            $kcal = $kj === null ? null : $kj / 4.184;
        }
        $protein = self::number($nutriments['proteins_100g'] ?? null);
        $carbs = self::number($nutriments['carbohydrates_100g'] ?? null);
        $fat = self::number($nutriments['fat_100g'] ?? null);
        if ($kcal === null || $protein === null || $carbs === null || $fat === null) {
            return null;
        }
        $sugar = min(self::number($nutriments['sugars_100g'] ?? null) ?? 0.0, $carbs);
        if ($kcal > 900 || $protein > 100 || $carbs > 100 || $fat > 100) {
            return null;
        }

        $unit = is_string($p['product_quantity_unit'] ?? null) ? strtolower($p['product_quantity_unit']) : 'g';
        $quantity = self::number($p['product_quantity'] ?? null);

        return new self(
            $code,
            self::clip($name, 120),
            $brand === '' ? null : $brand,
            self::category($p['categories_tags'] ?? null),
            $unit === 'ml' ? 'per_100ml' : 'per_100g',
            round($kcal, 1),
            round($protein, 1),
            round($carbs, 1),
            round($sugar, 1),
            round($fat, 1),
            $quantity !== null && $quantity > 0 && $quantity <= 100000 ? round($quantity, 1) : null,
        );
    }

    private static function category(mixed $tags): string
    {
        $tags = is_array($tags) ? array_filter($tags, 'is_string') : [];
        $map = [
            'supplements' => ['en:dietary-supplements', 'en:bodybuilding-supplements', 'en:protein-powders'],
            'meals' => ['en:meals', 'en:prepared-meals', 'en:frozen-ready-meals', 'en:pizzas'],
            'drinks' => ['en:beverages', 'en:milks', 'en:plant-based-beverages'],
            'sauces' => [
                'en:sauces', 'en:condiments', 'en:dressings', 'en:mayonnaises', 'en:ketchup', 'en:fats',
                'en:vegetable-oils', 'en:olive-oils',
            ],
            'dairy' => ['en:dairies', 'en:cheeses', 'en:yogurts', 'en:quarks', 'en:fresh-cheeses'],
            'bread' => ['en:breads', 'en:bakery-products', 'en:pastries'],
            'produce' => ['en:fruits', 'en:vegetables', 'en:fruits-and-vegetables-based-foods'],
        ];
        foreach ($map as $category => $needles) {
            if (array_intersect($needles, $tags) !== []) {
                return $category;
            }
        }

        return 'snacks';
    }

    private static function text(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }
        $clean = trim((string) preg_replace('/[\p{C}]+/u', ' ', $value));

        return $clean === '' || !mb_check_encoding($clean, 'UTF-8') ? null : $clean;
    }

    private static function clip(string $value, int $length): string
    {
        return mb_substr($value, 0, $length, 'UTF-8');
    }

    private static function number(mixed $value): ?float
    {
        if (is_int($value) || is_float($value)) {
            $number = (float) $value;
        } elseif (is_string($value) && is_numeric($value)) {
            $number = (float) $value;
        } else {
            return null;
        }

        return is_finite($number) && $number >= 0 ? $number : null;
    }
}

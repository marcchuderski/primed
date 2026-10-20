<?php

declare(strict_types=1);

namespace Primed\Food;

use Primed\Http\Input;

/**
 * Unit conversion (D-073). Household measures are fixed: 1 EL = 15 g/ml, 1 TL = 5 g/ml.
 * Mirrors frontend/src/domain/units.ts; both are tested against the same cases.
 */
final class Units
{
    public const EL = 15;
    public const TL = 5;

    /** @var array<string, list<string>> */
    private const ALLOWED = [
        'per_100g' => ['g', 'el', 'tl', 'packung'],
        'per_100ml' => ['ml', 'el', 'tl', 'packung'],
        'per_unit' => ['stueck', 'packung'],
    ];

    /**
     * @return list<string>
     */
    public static function allowedFor(string $basis): array
    {
        return self::ALLOWED[$basis] ?? [];
    }

    /**
     * Converts the entered amount to the basis quantity: grams, millilitres or pieces. Stück on a g/ml basis
     * needs a piece weight (D-170).
     */
    public static function toQuantity(
        string $basis,
        string $unit,
        float $amount,
        ?float $packageAmount,
        ?float $pieceWeight = null,
    ): float {
        if ($unit === 'stueck' && $basis !== 'per_unit' && $pieceWeight !== null && $pieceWeight > 0) {
            return $amount * $pieceWeight;
        }
        if (!in_array($unit, self::allowedFor($basis), true)) {
            throw Input::invalid('Diese Einheit passt nicht zum Produkt.');
        }

        return match ($unit) {
            'el' => $amount * self::EL,
            'tl' => $amount * self::TL,
            'packung' => $packageAmount !== null && $packageAmount > 0
                ? $amount * $packageAmount
                : throw Input::invalid('Für dieses Produkt ist keine Packungsgröße hinterlegt.'),
            default => $amount,
        };
    }

    /**
     * Nutrients for a quantity of the basis, rounded to 0.1.
     *
     * @param array{kcal: float, protein: float, carbs: float, sugar: float, fat: float} $perBasis
     * @return array{kcal: float, protein: float, carbs: float, sugar: float, fat: float}
     */
    public static function nutrients(string $basis, array $perBasis, float $quantity): array
    {
        $factor = $basis === 'per_unit' ? $quantity : $quantity / 100;

        return [
            'kcal' => round($perBasis['kcal'] * $factor, 1),
            'protein' => round($perBasis['protein'] * $factor, 1),
            'carbs' => round($perBasis['carbs'] * $factor, 1),
            'sugar' => round($perBasis['sugar'] * $factor, 1),
            'fat' => round($perBasis['fat'] * $factor, 1),
        ];
    }
}

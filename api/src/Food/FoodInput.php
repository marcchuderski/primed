<?php

declare(strict_types=1);

namespace Primed\Food;

use Primed\Http\Input;

/**
 * Validated food data for create/update (library, "Produkt anlegen", D-073).
 */
final class FoodInput
{
    public const TYPES = ['product', 'reference', 'ingredient'];
    public const CATEGORIES = [
        'meat', 'dairy', 'grains', 'produce', 'sauces', 'snacks', 'drinks', 'meals', 'supplements', 'other',
    ];
    public const BASES = ['per_100g', 'per_100ml', 'per_unit'];

    private function __construct(
        public readonly string $type,
        public readonly string $name,
        public readonly ?string $brand,
        public readonly ?string $barcode,
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

    public static function from(Input $input): self
    {
        $basis = $input->enum('basis', self::BASES, 'Basis');
        $perUnit = $basis === 'per_unit';
        $maxKcal = $perUnit ? 3000 : 900;
        $maxGrams = $perUnit ? 500 : 100;

        $barcode = $input->has('barcode') && $input->nullableText('barcode') !== null
            ? $input->text('barcode', 8, 14, 'Barcode')
            : null;
        if ($barcode !== null && !Barcode::isValid($barcode)) {
            throw Input::invalid('Der Barcode ist ungültig.');
        }
        $brand = $input->has('brand') ? $input->nullableText('brand') : null;
        if ($brand !== null) {
            $brand = $input->text('brand', 1, 80, 'Marke');
        }

        $self = new self(
            $input->enum('type', self::TYPES, 'Typ'),
            $input->text('name', 1, 120, 'Name'),
            $brand,
            $barcode,
            $input->enum('category', self::CATEGORIES, 'Kategorie'),
            $basis,
            round($input->number('kcal', 0, $maxKcal, 'Kalorien'), 1),
            round($input->number('protein', 0, $maxGrams, 'Protein'), 1),
            round($input->number('carbs', 0, $maxGrams, 'Kohlenhydrate'), 1),
            round($input->number('sugar', 0, $maxGrams, 'Zucker'), 1),
            round($input->number('fat', 0, $maxGrams, 'Fett'), 1),
            ($input->has('packageAmount') && !$input->isNull('packageAmount'))
                ? round($input->number('packageAmount', 0.1, 100000, 'Packungsgröße'), 1)
                : null,
        );
        if ($self->sugar > $self->carbs) {
            throw Input::invalid('Zucker kann nicht mehr sein als Kohlenhydrate.');
        }
        if (!$perUnit && $self->protein + $self->carbs + $self->fat > 100.5) {
            throw Input::invalid('Protein, Kohlenhydrate und Fett ergeben mehr als 100 g pro 100 g.');
        }

        return $self;
    }

    /**
     * @return array{type: string, name: string, brand: string|null, barcode: string|null, category: string,
     *     basis: string, kcal: float, protein: float, carbs: float, sugar: float, fat: float,
     *     packageAmount: float|null, source: string}
     */
    public function toRow(string $source): array
    {
        return [
            'type' => $this->type,
            'name' => $this->name,
            'brand' => $this->brand,
            'barcode' => $this->barcode,
            'category' => $this->category,
            'basis' => $this->basis,
            'kcal' => $this->kcal,
            'protein' => $this->protein,
            'carbs' => $this->carbs,
            'sugar' => $this->sugar,
            'fat' => $this->fat,
            'packageAmount' => $this->packageAmount,
            'source' => $source,
        ];
    }
}

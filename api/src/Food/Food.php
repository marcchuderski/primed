<?php

declare(strict_types=1);

namespace Primed\Food;

final class Food
{
    public function __construct(
        public readonly int $id,
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
        public readonly int $usageCount,
        public readonly ?float $lastAmount,
        public readonly ?string $lastUnit,
    ) {
    }

    /**
     * @return array{kcal: float, protein: float, carbs: float, sugar: float, fat: float}
     */
    public function perBasis(): array
    {
        return [
            'kcal' => $this->kcal,
            'protein' => $this->protein,
            'carbs' => $this->carbs,
            'sugar' => $this->sugar,
            'fat' => $this->fat,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toPublic(): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'name' => $this->name,
            'brand' => $this->brand,
            'barcode' => $this->barcode,
            'category' => $this->category,
            'basis' => $this->basis,
            'nutrients' => $this->perBasis(),
            'packageAmount' => $this->packageAmount,
            'usageCount' => $this->usageCount,
            'lastAmount' => $this->lastAmount,
            'lastUnit' => $this->lastUnit,
        ];
    }
}

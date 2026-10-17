<?php

declare(strict_types=1);

namespace Primed\Dish;

final class DishIngredient
{
    /**
     * @param array{kcal: float, protein: float, carbs: float, sugar: float, fat: float} $nutrients
     */
    public function __construct(
        public readonly ?int $foodId,
        public readonly string $name,
        public readonly string $foodType,
        public readonly float $amount,
        public readonly string $unit,
        public readonly float $quantity,
        public readonly array $nutrients,
        public readonly ?string $basis = null,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function toPublic(): array
    {
        return [
            'foodId' => $this->foodId,
            'name' => $this->name,
            'foodType' => $this->foodType,
            'amount' => $this->amount,
            'unit' => $this->unit,
            'quantity' => $this->quantity,
            'basis' => $this->basis,
            'nutrients' => $this->nutrients,
        ];
    }
}

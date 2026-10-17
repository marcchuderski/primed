<?php

declare(strict_types=1);

namespace Primed\Dish;

final class Dish
{
    /**
     * @param array{kcal: float, protein: float, carbs: float, sugar: float, fat: float} $totals whole dish
     * @param list<DishIngredient> $ingredients empty in list views
     */
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly string $cookedOn,
        public readonly float $portionsTotal,
        public readonly float $portionsEaten,
        public readonly array $totals,
        public readonly bool $discarded,
        public readonly ?int $basedOnDishId,
        public readonly array $ingredients = [],
    ) {
    }

    public function portionsLeft(): float
    {
        return $this->discarded ? 0.0 : max(0.0, round($this->portionsTotal - $this->portionsEaten, 1));
    }

    /** active (portions left), archived (eaten up) or discarded ("Rest entsorgen"). */
    public function status(): string
    {
        return $this->discarded ? 'discarded' : ($this->portionsLeft() > 0 ? 'active' : 'archived');
    }

    /**
     * @return array{kcal: float, protein: float, carbs: float, sugar: float, fat: float}
     */
    public function perPortion(): array
    {
        return array_map(fn (float $v): float => round($v / $this->portionsTotal, 1), $this->totals);
    }

    /**
     * @return array<string, mixed>
     */
    public function toPublic(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'cookedOn' => $this->cookedOn,
            'portionsTotal' => $this->portionsTotal,
            'portionsLeft' => $this->portionsLeft(),
            'status' => $this->status(),
            'totals' => $this->totals,
            'perPortion' => $this->perPortion(),
            'basedOnDishId' => $this->basedOnDishId,
            'ingredients' => array_map(static fn (DishIngredient $i): array => $i->toPublic(), $this->ingredients),
        ];
    }
}

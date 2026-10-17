<?php

declare(strict_types=1);

namespace Primed\Entry;

final class Entry
{
    /**
     * @param array{kcal: float, protein: float, carbs: float, sugar: float, fat: float} $nutrients
     */
    public function __construct(
        public readonly int $id,
        public readonly string $date,
        public readonly int $timeMin,
        /** food, dish or shake */
        public readonly string $kind,
        public readonly ?int $foodId,
        public readonly ?int $dishId,
        public readonly string $name,
        public readonly float $amount,
        public readonly string $unit,
        public readonly float $quantity,
        public readonly array $nutrients,
        /** Basis and package size of the food (current values), for unit changes when editing. */
        public readonly ?string $basis = null,
        public readonly ?float $packageAmount = null,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function toPublic(): array
    {
        return [
            'id' => $this->id,
            'date' => $this->date,
            'timeMin' => $this->timeMin,
            'kind' => $this->kind,
            'foodId' => $this->foodId,
            'dishId' => $this->dishId,
            'name' => $this->name,
            'amount' => $this->amount,
            'unit' => $this->unit,
            'quantity' => $this->quantity,
            'nutrients' => $this->nutrients,
            'basis' => $this->basis,
            'packageAmount' => $this->packageAmount,
        ];
    }
}

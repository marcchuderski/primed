<?php

declare(strict_types=1);

namespace Primed\Food;

use Primed\Support\Row;

/**
 * Shared, read-only reference value (unpackaged food, D-170). Users get their own copy on first use.
 */
final class ReferenceFood
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly string $category,
        public readonly string $basis,
        public readonly float $kcal,
        public readonly float $protein,
        public readonly float $carbs,
        public readonly float $sugar,
        public readonly float $fat,
        public readonly ?float $pieceWeight,
    ) {
    }

    /**
     * @param array<mixed> $row
     */
    public static function hydrate(array $row): self
    {
        return new self(
            Row::int($row, 'id'),
            Row::string($row, 'name'),
            Row::string($row, 'category'),
            Row::string($row, 'basis'),
            Row::float($row, 'kcal'),
            Row::float($row, 'protein'),
            Row::float($row, 'carbs'),
            Row::float($row, 'sugar'),
            Row::float($row, 'fat'),
            Row::nullableFloat($row, 'piece_weight'),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toPublic(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'category' => $this->category,
            'basis' => $this->basis,
            'nutrients' => [
                'kcal' => $this->kcal,
                'protein' => $this->protein,
                'carbs' => $this->carbs,
                'sugar' => $this->sugar,
                'fat' => $this->fat,
            ],
            'pieceWeight' => $this->pieceWeight,
        ];
    }
}

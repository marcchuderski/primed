<?php

declare(strict_types=1);

namespace Primed\Day;

final class DayType
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly int $kcal,
        /** null = use the protein default from the settings */
        public readonly ?int $protein,
        public readonly int $carbs,
        public readonly int $sugarRef,
        public readonly bool $isTraining,
        public readonly int $sort,
        /** The fixed rest day type (D-106): cannot be deleted, renamed or turned into a training day. */
        public readonly bool $isRest = false,
    ) {
    }

    public function effectiveProtein(int $proteinDefault): int
    {
        return $this->protein ?? $proteinDefault;
    }

    /**
     * @return array<string, mixed>
     */
    public function toPublic(int $proteinDefault): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'kcal' => $this->kcal,
            'protein' => $this->protein,
            'effectiveProtein' => $this->effectiveProtein($proteinDefault),
            'carbs' => $this->carbs,
            'sugarRef' => $this->sugarRef,
            'isTraining' => $this->isTraining,
            'sort' => $this->sort,
            'isRest' => $this->isRest,
        ];
    }
}

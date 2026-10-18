<?php

declare(strict_types=1);

namespace Primed\Day;

final class UserSettings
{
    public function __construct(
        public readonly string $theme,
        public readonly int $proteinDefault,
        public readonly int $defaultDurationMin,
        public readonly int $earliestTrainingMin,
        public readonly int $checkpointOffsetMin,
        public readonly int $checkpointPct,
        public readonly int $earliestCheckpointMin,
        public readonly int $dayBoundaryMin,
        public readonly ?int $proteinPowderFoodId = null,
        public readonly int $shakePowderG = 30,
        /** @var array{milkLow: bool, milkHigh: bool, water: bool} */
        public readonly array $shakeLiquids = ['milkLow' => true, 'milkHigh' => true, 'water' => true],
        public readonly int $tolerancePct = 5,
        /** @var array<string, int> */
        public readonly array $thresholds = [],
        public readonly bool $shakesEnabled = true,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function toPublic(): array
    {
        return [
            'theme' => $this->theme,
            'proteinDefault' => $this->proteinDefault,
            'defaultDurationMin' => $this->defaultDurationMin,
            'earliestTrainingMin' => $this->earliestTrainingMin,
            'checkpoint' => [
                'offsetMin' => $this->checkpointOffsetMin,
                'pct' => $this->checkpointPct,
                'earliestMin' => $this->earliestCheckpointMin,
            ],
            'dayBoundaryMin' => $this->dayBoundaryMin,
            'shakeFoods' => ['proteinPowder' => $this->proteinPowderFoodId],
            'shakePowderG' => $this->shakePowderG,
            'shakeLiquids' => $this->shakeLiquids,
            'tolerancePct' => $this->tolerancePct,
            'shakesEnabled' => $this->shakesEnabled,
            'thresholds' => $this->thresholds,
        ];
    }
}

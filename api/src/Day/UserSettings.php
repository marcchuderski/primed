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
        public readonly ?int $shakeMilkLowFoodId = null,
        public readonly ?int $shakeMilkHighFoodId = null,
        /** @var array{bigMl: int, smallMl: int, powderG: int} */
        public readonly array $shakeAmounts = ['bigMl' => 400, 'smallMl' => 200, 'powderG' => 30],
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
            'shakeFoods' => [
                'proteinPowder' => $this->proteinPowderFoodId,
                'milkLow' => $this->shakeMilkLowFoodId,
                'milkHigh' => $this->shakeMilkHighFoodId,
            ],
            'shakeAmounts' => $this->shakeAmounts,
            'tolerancePct' => $this->tolerancePct,
            'shakesEnabled' => $this->shakesEnabled,
            'thresholds' => $this->thresholds,
        ];
    }
}

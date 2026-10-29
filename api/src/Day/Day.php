<?php

declare(strict_types=1);

namespace Primed\Day;

final class Day
{
    public function __construct(
        public readonly string $date,
        public readonly ?int $dayTypeId,
        public readonly string $dayTypeName,
        public readonly bool $isTraining,
        public readonly ?int $trainingStart,
        public readonly ?int $durationMin,
        public readonly int $targetKcal,
        public readonly int $targetProtein,
        public readonly int $targetCarbs,
        public readonly int $targetSugar,
        /** 'template' (from the week template) or 'manual' (chosen for this day) */
        public readonly string $source,
        /** Left out of the history statistics (D-180); stored separately, never by save(). */
        public readonly bool $statsExcluded = false,
    ) {
    }

    public function withStatsExcluded(bool $excluded): self
    {
        return new self(
            $this->date,
            $this->dayTypeId,
            $this->dayTypeName,
            $this->isTraining,
            $this->trainingStart,
            $this->durationMin,
            $this->targetKcal,
            $this->targetProtein,
            $this->targetCarbs,
            $this->targetSugar,
            $this->source,
            $excluded,
        );
    }

    public static function fromType(
        string $date,
        DayType $type,
        int $proteinDefault,
        ?int $trainingStart,
        ?int $durationMin,
        string $source,
    ): self {
        return new self(
            $date,
            $type->id,
            $type->name,
            $type->isTraining,
            $type->isTraining ? $trainingStart : null,
            $type->isTraining ? $durationMin : null,
            $type->kcal,
            $type->effectiveProtein($proteinDefault),
            $type->carbs,
            $type->sugarRef,
            $source,
        );
    }

    public function equals(self $other): bool
    {
        return $this->toPublic(false) === $other->toPublic(false);
    }

    /**
     * @return array<string, mixed>
     */
    public function toPublic(bool $isToday, bool $editable = true): array
    {
        return [
            'date' => $this->date,
            'isToday' => $isToday,
            'editable' => $editable,
            'dayTypeId' => $this->dayTypeId,
            'dayTypeName' => $this->dayTypeName,
            'isTraining' => $this->isTraining,
            'trainingStart' => $this->trainingStart,
            'durationMin' => $this->durationMin,
            'source' => $this->source,
            'statsExcluded' => $this->statsExcluded,
            'targets' => [
                'kcal' => $this->targetKcal,
                'protein' => $this->targetProtein,
                'carbs' => $this->targetCarbs,
                'sugar' => $this->targetSugar,
            ],
        ];
    }
}

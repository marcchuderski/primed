<?php

declare(strict_types=1);

namespace Primed\Day;

/**
 * One weekday of the week template.
 */
final class TemplateDay
{
    public function __construct(
        /** 1 = Monday … 7 = Sunday */
        public readonly int $weekday,
        public readonly int $dayTypeId,
        public readonly ?int $trainingStart,
        public readonly ?int $durationMin,
    ) {
    }

    /**
     * @return array{weekday: int, dayTypeId: int, trainingStart: int|null, durationMin: int|null}
     */
    public function toPublic(): array
    {
        return [
            'weekday' => $this->weekday,
            'dayTypeId' => $this->dayTypeId,
            'trainingStart' => $this->trainingStart,
            'durationMin' => $this->durationMin,
        ];
    }
}

<?php

declare(strict_types=1);

namespace Primed\Day;

use Primed\Http\Input;

/**
 * Validated values for creating or updating a day type.
 */
final class DayTypeInput
{
    private function __construct(
        public readonly string $name,
        public readonly int $kcal,
        public readonly ?int $protein,
        public readonly int $carbs,
        public readonly int $sugarRef,
        public readonly bool $isTraining,
    ) {
    }

    public static function from(Input $input): self
    {
        $self = new self(
            $input->text('name', 1, 40, 'Name'),
            $input->int('kcal', 800, 6000, 'Kalorien'),
            $input->nullableInt('protein', 0, 400, 'Protein'),
            $input->int('carbs', 0, 1000, 'Kohlenhydrate'),
            $input->int('sugarRef', 0, 300, 'Zucker-Richtwert'),
            $input->bool('isTraining', 'Trainingstag'),
        );
        $protein = $self->protein ?? 0;
        if (($protein + $self->carbs) * 4 > $self->kcal) {
            throw Input::invalid('Protein und Kohlenhydrate ergeben mehr Kalorien als das Kalorien-Soll.');
        }

        return $self;
    }

    public static function of(string $name, int $kcal, ?int $protein, int $carbs, int $sugarRef, bool $isTraining): self
    {
        return new self($name, $kcal, $protein, $carbs, $sugarRef, $isTraining);
    }
}

<?php

declare(strict_types=1);

namespace Primed\Day;

use DateTimeImmutable;
use Primed\Food\FoodSeeder;

/**
 * Start data for new users (docs/DEFAULTS.md, D-080).
 * Every user gets the five default day types and an all-rest-day template;
 * the owner profile additionally gets the personal week template (Tue/Thu basketball 20:00).
 */
final class UserSeeder
{
    /** @var list<array{string, int, int, int, bool}> name, kcal, carbs, sugarRef, isTraining */
    private const DAY_TYPES = [
        ['Ruhetag', 2000, 200, 50, false],
        ['Leichtes Training', 2300, 250, 50, true],
        ['Normal · Fitness', 2600, 300, 50, true],
        ['Normal · Basketball', 2600, 350, 50, true],
        ['Intensiv / Spiel', 2800, 400, 50, true],
    ];

    public function __construct(
        private readonly DayTypeRepository $dayTypes,
        private readonly WeekTemplateRepository $template,
        private readonly ?FoodSeeder $foods = null,
    ) {
    }

    public function seed(int $userId, bool $ownerDefaults, DateTimeImmutable $now): void
    {
        $this->foods?->seed($userId, $ownerDefaults, $now);
        if ($this->dayTypes->all($userId) !== []) {
            return;
        }

        $ids = [];
        foreach (self::DAY_TYPES as [$name, $kcal, $carbs, $sugar, $training]) {
            $ids[] = $this->dayTypes->create($userId, $name, $kcal, null, $carbs, $sugar, $training, $now);
        }
        [$restDay, , , $basketballDay] = $ids;

        $days = [];
        for ($weekday = 1; $weekday <= 7; $weekday++) {
            $basketball = $ownerDefaults && ($weekday === 2 || $weekday === 4);
            $days[] = $basketball
                ? new TemplateDay($weekday, $basketballDay, 20 * 60, 90)
                : new TemplateDay($weekday, $restDay, null, null);
        }
        $this->template->replace($userId, $days);
    }
}

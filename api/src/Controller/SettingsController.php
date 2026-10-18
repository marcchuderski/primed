<?php

declare(strict_types=1);

namespace Primed\Controller;

use Primed\Container;
use Primed\Day\SettingsRepository;
use Primed\Food\FoodRepository;
use Primed\Http\HttpException;
use Primed\Http\Input;
use Primed\Http\Request;
use Primed\Http\Response;

final class SettingsController
{
    /** Allowed ranges per threshold: [min, max, step]. */
    private const THRESHOLD_RANGES = [
        'minProteinGap' => [10, 60, 1],
        'bigShakeProtein' => [20, 80, 1],
        'bigShakeKcal' => [200, 1500, 10],
        'lightMealKcal' => [300, 2000, 10],
        'restShakeFrom' => [960, 1380, 15],
        'richMilkKcal' => [100, 1000, 10],
        'overKcalProtein' => [10, 80, 1],
    ];

    public function __construct(private readonly Container $c)
    {
    }

    /**
     * @param array<string, string> $params
     */
    public function show(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;

        return Response::json(['settings' => $this->c->settings()->get($user->id)->toPublic()]);
    }

    /**
     * Partial update; only the given groups are validated and changed.
     *
     * @param array<string, string> $params
     */
    public function update(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $input = Input::fromRequest($request);
        $now = $this->c->clock->now();
        $settings = $this->c->settings();
        $values = [];

        if ($input->has('theme')) {
            $settings->updateTheme($user->id, $input->enum('theme', ['system', 'light', 'dark'], 'Darstellung'), $now);
        }
        if ($input->has('checkpoint')) {
            $cp = $input->object('checkpoint', 'Checkpoints');
            $values['checkpoint_offset_min'] = self::stepped($cp->int('offsetMin', 60, 300, 'Abstand'), 15, 'Abstand');
            $values['checkpoint_pct'] = self::stepped($cp->int('pct', 50, 95, 'Anteil'), 5, 'Anteil');
            $values['earliest_checkpoint_min'] = self::stepped(
                $cp->int('earliestMin', 240, 600, 'Frühester Checkpoint'),
                15,
                'Frühester Checkpoint',
            );
        }
        if ($input->has('earliestTrainingMin')) {
            $values['earliest_training_min'] = self::stepped(
                $input->int('earliestTrainingMin', 300, 720, 'Frühester Trainingsbeginn'),
                15,
                'Frühester Trainingsbeginn',
            );
        }
        if ($input->has('shakesEnabled')) {
            $values['shakes_enabled'] = $input->bool('shakesEnabled', 'Shakes') ? 1 : 0;
        }
        if ($input->has('tolerancePct')) {
            $values['tolerance_pct'] = $input->int('tolerancePct', 1, 15, 'Toleranz');
        }
        if ($input->has('thresholds')) {
            $t = $input->object('thresholds', 'Schwellen')->only(...array_keys(self::THRESHOLD_RANGES));
            foreach (self::THRESHOLD_RANGES as $name => [$min, $max, $step]) {
                if (!$t->has($name)) {
                    continue;
                }
                $value = self::stepped($t->int($name, $min, $max, 'Schwelle'), $step, 'Schwelle');
                $values[SettingsRepository::THRESHOLDS[$name]] = $value;
            }
        }
        if ($input->has('shake')) {
            $shake = $input->object('shake', 'Shakes')
                ->only('proteinPowderFoodId', 'milkLowFoodId', 'milkHighFoodId', 'bigMl', 'smallMl', 'powderG');
            $foods = new FoodRepository($this->c->pdo());
            foreach (
                ['proteinPowderFoodId' => 'protein_powder_food_id', 'milkLowFoodId' => 'shake_milk_low_food_id',
                'milkHighFoodId' => 'shake_milk_high_food_id'] as $field => $column
            ) {
                if (!$shake->has($field)) {
                    continue;
                }
                $id = $shake->nullableInt($field, 1, PHP_INT_MAX, 'Shake-Zutat');
                if ($id !== null) {
                    $food = $foods->find($user->id, $id) ?? throw HttpException::notFound();
                    if ($food->basis === 'per_unit') {
                        throw Input::invalid('Für Shakes brauchst du ein Produkt mit Angaben pro 100 g oder 100 ml.');
                    }
                }
                $values[$column] = $id;
            }
            if ($shake->has('bigMl')) {
                $big = $shake->int('bigMl', 100, 1000, 'Milch groß');
                $values['shake_big_ml'] = self::stepped($big, 10, 'Milch groß');
            }
            if ($shake->has('smallMl')) {
                $small = $shake->int('smallMl', 50, 600, 'Milch klein');
                $values['shake_small_ml'] = self::stepped($small, 10, 'Milch klein');
            }
            if ($shake->has('powderG')) {
                $values['shake_powder_g'] = $shake->int('powderG', 10, 80, 'Proteinpulver');
            }
        }
        $settings->update($user->id, $values, $now);

        if ($input->has('proteinDefault')) {
            $protein = $input->int('proteinDefault', 20, 400, 'Protein-Standard');
            $this->c->days()->updateProteinDefault($user->id, $protein);
        }

        return Response::json(['settings' => $settings->get($user->id)->toPublic()]);
    }

    private static function stepped(int $value, int $step, string $label): int
    {
        if ($value % $step !== 0) {
            throw Input::invalid(sprintf('%s muss in Schritten von %d angegeben werden.', $label, $step));
        }

        return $value;
    }
}

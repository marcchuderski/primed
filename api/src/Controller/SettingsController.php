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
            $shake = $input->object('shake', 'Shakes')->only('proteinPowderFoodId', 'powderG', 'liquids');
            if ($shake->has('proteinPowderFoodId')) {
                $id = $shake->nullableInt('proteinPowderFoodId', 1, PHP_INT_MAX, 'Proteinpulver');
                if ($id !== null) {
                    $food = (new FoodRepository($this->c->pdo()))->find($user->id, $id)
                        ?? throw HttpException::notFound();
                    if ($food->basis === 'per_unit') {
                        throw Input::invalid('Für Shakes brauchst du ein Produkt mit Angaben pro 100 g oder 100 ml.');
                    }
                }
                $values['protein_powder_food_id'] = $id;
            }
            if ($shake->has('powderG')) {
                $values['shake_powder_g'] = $shake->int('powderG', 10, 80, 'Proteinpulver');
            }
            if ($shake->has('liquids')) {
                $liquids = $shake->object('liquids', 'Flüssigkeiten')->only('milkLow', 'milkHigh', 'water');
                $current = $settings->get($user->id)->shakeLiquids;
                foreach (
                    ['milkLow' => 'shake_liquid_milk_low', 'milkHigh' => 'shake_liquid_milk_high',
                    'water' => 'shake_liquid_water'] as $field => $column
                ) {
                    if ($liquids->has($field)) {
                        $current[$field] = $liquids->bool($field, 'Flüssigkeit');
                        $values[$column] = $current[$field] ? 1 : 0;
                    }
                }
                if (!in_array(true, $current, true)) {
                    throw Input::invalid('Wähle mindestens eine Flüssigkeit für deine Shakes.');
                }
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

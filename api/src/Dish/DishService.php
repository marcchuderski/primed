<?php

declare(strict_types=1);

namespace Primed\Dish;

use Primed\Day\DayService;
use Primed\Food\FoodRepository;
use Primed\Food\Units;
use Primed\Http\HttpException;
use Primed\Http\Input;
use Primed\Support\Clock;

/**
 * Meal prep (BRIEFING §8, D-046, D-118): ingredients are snapshotted when the dish is saved; portions are split evenly;
 * portions left are derived from the logged entries; dishes stay editable; archived dishes can be cooked again.
 */
final class DishService
{
    public const MAX_INGREDIENTS = 40;

    public function __construct(
        private readonly DishRepository $dishes,
        private readonly FoodRepository $foods,
        private readonly DayService $days,
        private readonly Clock $clock,
    ) {
    }

    /**
     * @return list<Dish>
     */
    public function list(int $userId, string $status): array
    {
        return array_values(array_filter(
            $this->dishes->all($userId),
            static fn (Dish $d): bool => $status === 'active' ? $d->status() === 'active' : $d->status() !== 'active',
        ));
    }

    public function get(int $userId, int $id): Dish
    {
        return $this->dishes->find($userId, $id, true) ?? throw HttpException::notFound();
    }

    /**
     * @param list<array{foodId: int, amount: float, unit: string}> $ingredients
     */
    public function create(int $userId, string $name, float $portions, array $ingredients, ?int $basedOn): Dish
    {
        self::assertPortions($portions);
        if ($basedOn !== null) {
            $this->get($userId, $basedOn);
        }
        [$list, $totals] = $this->resolve($userId, $ingredients);
        $id = $this->dishes->create(
            $userId,
            $name,
            $this->days->today($userId),
            $portions,
            $totals,
            $list,
            $basedOn,
            $this->clock->now(),
        );

        return $this->get($userId, $id);
    }

    /**
     * Dishes stay editable (D-046), e.g. when portions are given away. Logged entries keep their snapshots.
     *
     * @param list<array{foodId: int, amount: float, unit: string}> $ingredients
     */
    public function update(int $userId, int $id, string $name, float $portions, array $ingredients): Dish
    {
        $dish = $this->get($userId, $id);
        self::assertPortions($portions);
        if ($portions < $dish->portionsEaten) {
            throw Input::invalid(sprintf(
                'Es wurden schon %s Portionen eingetragen. Weniger geht nicht.',
                str_replace('.', ',', (string) $dish->portionsEaten),
            ));
        }
        [$list, $totals] = $this->resolve($userId, $ingredients);
        $this->dishes->update($userId, $id, $name, $portions, $totals, $list, $this->clock->now());

        return $this->get($userId, $id);
    }

    /** "Rest entsorgen": moves the dish to the archive without entries. */
    public function discard(int $userId, int $id): Dish
    {
        $this->get($userId, $id);
        $this->dishes->discard($userId, $id, $this->clock->now());

        return $this->get($userId, $id);
    }

    /**
     * Nutrients for logging portions; checks that enough portions are left.
     *
     * @return array{dish: Dish, nutrients: array{kcal: float, protein: float, carbs: float, sugar: float, fat: float}}
     */
    public function portions(int $userId, int $dishId, float $portions, float $alreadyLoggedByEntry = 0.0): array
    {
        $dish = $this->dishes->find($userId, $dishId) ?? throw HttpException::notFound();
        if (!self::isHalfStep($portions) || $portions <= 0) {
            throw Input::invalid('Portionen gehen in Schritten von 0,5.');
        }
        if ($dish->discarded || $portions > $dish->portionsLeft() + $alreadyLoggedByEntry + 0.001) {
            throw Input::invalid('So viele Portionen sind nicht mehr übrig.');
        }

        return [
            'dish' => $dish,
            // From the totals (not the rounded per-portion values) to avoid double rounding.
            'nutrients' => array_map(
                static fn (float $v): float => round($v * $portions / $dish->portionsTotal, 1),
                $dish->totals,
            ),
        ];
    }

    /**
     * @param list<array{foodId: int, amount: float, unit: string}> $items
     * @return array{0: list<DishIngredient>,
     *     1: array{kcal: float, protein: float, carbs: float, sugar: float, fat: float}}
     */
    private function resolve(int $userId, array $items): array
    {
        if ($items === [] || count($items) > self::MAX_INGREDIENTS) {
            throw Input::invalid(sprintf('Ein Gericht braucht 1 bis %d Zutaten.', self::MAX_INGREDIENTS));
        }
        $list = [];
        $totals = ['kcal' => 0.0, 'protein' => 0.0, 'carbs' => 0.0, 'sugar' => 0.0, 'fat' => 0.0];
        foreach ($items as $item) {
            $food = $this->foods->findAny($userId, $item['foodId']) ?? throw HttpException::notFound();
            $quantity = Units::toQuantity(
                $food->basis,
                $item['unit'],
                $item['amount'],
                $food->packageAmount,
                $food->pieceWeight,
            );
            $nutrients = Units::nutrients($food->basis, $food->perBasis(), $quantity);
            $list[] = new DishIngredient(
                $food->id,
                $food->name,
                $food->type,
                $item['amount'],
                $item['unit'],
                round($quantity, 2),
                $nutrients,
            );
            foreach ($totals as $key => $value) {
                $totals[$key] = round($value + $nutrients[$key], 1);
            }
        }

        return [$list, $totals];
    }

    private static function assertPortions(float $portions): void
    {
        if ($portions < 0.5 || $portions > 50 || !self::isHalfStep($portions)) {
            throw Input::invalid('Portionen: 0,5 bis 50 in Schritten von 0,5.');
        }
    }

    private static function isHalfStep(float $value): bool
    {
        return abs($value * 2 - round($value * 2)) < 0.0001;
    }
}

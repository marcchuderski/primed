<?php

declare(strict_types=1);

namespace Primed\Controller;

use Primed\Container;
use Primed\Dish\Dish;
use Primed\Http\Input;
use Primed\Http\Request;
use Primed\Http\Response;

final class DishController
{
    private const UNITS = ['g', 'ml', 'el', 'tl', 'packung', 'stueck'];

    public function __construct(private readonly Container $c)
    {
    }

    /**
     * @param array<string, string> $params
     */
    public function index(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $status = ($request->query['status'] ?? 'active') === 'archived' ? 'archived' : 'active';

        $dishes = $this->c->dishes()->list($user->id, $status);

        return Response::json(['dishes' => array_map(static fn (Dish $d): array => $d->toPublic(), $dishes)]);
    }

    /**
     * @param array<string, string> $params
     */
    public function show(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;

        $dish = $this->c->dishes()->get($user->id, DayTypeController::id($params));

        return Response::json(['dish' => $dish->toPublic()]);
    }

    /**
     * @param array<string, string> $params
     */
    public function create(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $input = Input::fromRequest($request);
        $dish = $this->c->dishes()->create(
            $user->id,
            $input->text('name', 1, 120, 'Name'),
            $input->number('portions', 0.5, 50, 'Portionen'),
            self::ingredients($input),
            $input->has('basedOnDishId') && !$input->isNull('basedOnDishId')
                ? $input->int('basedOnDishId', 1, PHP_INT_MAX, 'Vorlage')
                : null,
        );

        return Response::json(['dish' => $dish->toPublic()], 201);
    }

    /**
     * @param array<string, string> $params
     */
    public function update(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $id = DayTypeController::id($params);
        $this->c->dishes()->get($user->id, $id); // 404 before validation
        $input = Input::fromRequest($request);
        $dish = $this->c->dishes()->update(
            $user->id,
            $id,
            $input->text('name', 1, 120, 'Name'),
            $input->number('portions', 0.5, 50, 'Portionen'),
            self::ingredients($input),
        );

        return Response::json(['dish' => $dish->toPublic()]);
    }

    /**
     * @param array<string, string> $params
     */
    public function discard(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $dish = $this->c->dishes()->discard($user->id, DayTypeController::id($params));

        return Response::json(['dish' => $dish->toPublic()]);
    }

    /**
     * @return list<array{foodId: int, amount: float, unit: string}>
     */
    private static function ingredients(Input $input): array
    {
        $items = [];
        foreach ($input->list('ingredients', 1, 40, 'Zutaten') as $item) {
            $items[] = [
                'foodId' => $item->int('foodId', 1, PHP_INT_MAX, 'Zutat'),
                'amount' => $item->number('amount', 0.01, 100000, 'Menge'),
                'unit' => $item->enum('unit', self::UNITS, 'Einheit'),
            ];
        }

        return $items;
    }
}

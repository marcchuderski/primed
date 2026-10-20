<?php

declare(strict_types=1);

namespace Primed\Controller;

use Primed\Container;
use Primed\Food\Food;
use Primed\Food\FoodInput;
use Primed\Food\ReferenceFood;
use Primed\Http\Input;
use Primed\Http\Request;
use Primed\Http\Response;
use Primed\Off\OffProduct;

final class FoodController
{
    public function __construct(private readonly Container $c)
    {
    }

    /**
     * @param array<string, string> $params
     */
    public function index(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $q = $request->query;
        $category = self::option($q['category'] ?? null, FoodInput::CATEGORIES);
        $type = self::option($q['type'] ?? null, FoodInput::TYPES);
        $foods = $this->c->foods()->search(
            $user->id,
            isset($q['q']) ? trim($q['q']) : null,
            $category,
            $type,
            ($q['context'] ?? '') === 'mealprep',
        );

        return self::list($foods);
    }

    /**
     * @param array<string, string> $params
     */
    public function frequent(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;

        return self::list($this->c->foods()->frequent($user->id));
    }

    /**
     * @param array<string, string> $params
     */
    public function show(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;

        $food = $this->c->foods()->get($user->id, DayTypeController::id($params));

        return Response::json(['food' => $food->toPublic()]);
    }

    /**
     * @param array<string, string> $params
     */
    public function create(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $input = Input::fromRequest($request);
        $source = $input->has('source') ? $input->enum('source', ['manual', 'off'], 'Quelle') : 'manual';
        $food = $this->c->foods()->create($user->id, FoodInput::from($input), $source);

        return Response::json(['food' => $food->toPublic()], 201);
    }

    /**
     * @param array<string, string> $params
     */
    public function update(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $id = DayTypeController::id($params);
        $this->c->foods()->get($user->id, $id); // 404 before validation
        $food = $this->c->foods()->update($user->id, $id, FoodInput::from(Input::fromRequest($request)));

        return Response::json(['food' => $food->toPublic()]);
    }

    /**
     * @param array<string, string> $params
     */
    public function delete(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $this->c->foods()->delete($user->id, DayTypeController::id($params));

        return Response::noContent();
    }

    /**
     * @param array<string, string> $params
     */
    public function barcode(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $result = $this->c->foods()->lookupBarcode($user->id, $params['ean'] ?? '');

        return Response::json($result['source'] === 'library'
            ? ['source' => 'library', 'food' => $result['food']->toPublic()]
            : ['source' => 'off', 'product' => $result['product']->toArray()]);
    }

    /**
     * @param array<string, string> $params
     */
    public function searchOnline(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $products = $this->c->foods()->searchOnline($user->id, $request->query['q'] ?? '');

        return Response::json([
            'products' => array_map(static fn (OffProduct $p): array => $p->toArray(), $products),
            'attribution' => 'Daten: Open Food Facts (ODbL)',
        ]);
    }

    /**
     * Shared reference values not yet in the user's library (D-170).
     *
     * @param array<string, string> $params
     */
    public function references(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $references = $this->c->foods()->references($user->id, $request->query['q'] ?? '');

        return Response::json([
            'references' => array_map(static fn (ReferenceFood $r): array => $r->toPublic(), $references),
        ]);
    }

    /**
     * @param array<string, string> $params
     */
    public function adopt(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $food = $this->c->foods()->adoptReference($user->id, DayTypeController::id($params));

        return Response::json(['food' => $food->toPublic()]);
    }

    /**
     * @param list<Food> $foods
     */
    private static function list(array $foods): Response
    {
        return Response::json(['foods' => array_map(static fn (Food $f): array => $f->toPublic(), $foods)]);
    }

    /**
     * @param list<string> $allowed
     */
    private static function option(?string $value, array $allowed): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (!in_array($value, $allowed, true)) {
            throw Input::invalid('Ungültiger Filter.');
        }

        return $value;
    }
}

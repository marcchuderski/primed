<?php

declare(strict_types=1);

namespace Primed\Controller;

use Primed\Container;
use Primed\Entry\Entry;
use Primed\Entry\EntryService;
use Primed\Food\ShakeService;
use Primed\Http\Input;
use Primed\Http\Request;
use Primed\Http\Response;

final class EntryController
{
    private const UNITS = ['g', 'ml', 'el', 'tl', 'packung', 'stueck', 'portion'];

    public function __construct(private readonly Container $c)
    {
    }

    /**
     * @param array<string, string> $params
     */
    public function index(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $entries = $this->c->entries()->forDate($user->id, $params['date'] ?? '');

        return Response::json(['entries' => array_map(static fn (Entry $e): array => $e->toPublic(), $entries)]);
    }

    /**
     * @param array<string, string> $params
     */
    public function create(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $input = Input::fromRequest($request);
        $entry = $this->c->entries()->create(
            $user->id,
            $input->text('date', 10, 10, 'Datum'),
            $input->int('timeMin', 0, 1439, 'Uhrzeit'),
            $input->int('foodId', 1, PHP_INT_MAX, 'Lebensmittel'),
            $input->number('amount', 0.01, EntryService::MAX_AMOUNT, 'Menge'),
            $input->enum('unit', self::UNITS, 'Einheit'),
        );

        return Response::json(['entry' => $entry->toPublic()], 201);
    }

    /**
     * @param array<string, string> $params
     */
    public function createShake(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $input = Input::fromRequest($request);
        $entry = $this->c->entries()->createShake(
            $user->id,
            $input->text('date', 10, 10, 'Datum'),
            $input->int('timeMin', 0, 1439, 'Uhrzeit'),
            $input->enum('shake', ShakeService::ids(), 'Shake'),
        );

        return Response::json(['entry' => $entry->toPublic()], 201);
    }

    /**
     * @param array<string, string> $params
     */
    public function createDish(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $input = Input::fromRequest($request);
        $entry = $this->c->entries()->createDishPortion(
            $user->id,
            $input->text('date', 10, 10, 'Datum'),
            $input->int('timeMin', 0, 1439, 'Uhrzeit'),
            $input->int('dishId', 1, PHP_INT_MAX, 'Gericht'),
            $input->number('portions', 0.5, 50, 'Portionen'),
        );

        return Response::json(['entry' => $entry->toPublic()], 201);
    }

    /**
     * @param array<string, string> $params
     */
    public function shakes(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $enabled = $this->c->settings()->get($user->id)->shakesEnabled;

        return Response::json(['shakes' => $enabled ? $this->c->shakes()->all($user->id) : []]);
    }

    /**
     * @param array<string, string> $params
     */
    public function update(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $id = DayTypeController::id($params);
        $input = Input::fromRequest($request);
        $entry = $this->c->entries()->update(
            $user->id,
            $id,
            $input->has('timeMin') ? $input->int('timeMin', 0, 1439, 'Uhrzeit') : null,
            $input->has('amount') ? $input->number('amount', 0.01, EntryService::MAX_AMOUNT, 'Menge') : null,
            $input->has('unit') ? $input->enum('unit', self::UNITS, 'Einheit') : null,
        );

        return Response::json(['entry' => $entry->toPublic()]);
    }

    /**
     * @param array<string, string> $params
     */
    public function delete(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $this->c->entries()->delete($user->id, DayTypeController::id($params));

        return Response::noContent();
    }
}

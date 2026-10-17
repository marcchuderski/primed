<?php

declare(strict_types=1);

namespace Primed\Controller;

use Primed\Container;
use Primed\Day\DayType;
use Primed\Day\DayTypeInput;
use Primed\Http\HttpException;
use Primed\Http\Input;
use Primed\Http\Request;
use Primed\Http\Response;

final class DayTypeController
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
        $proteinDefault = $this->c->settings()->get($user->id)->proteinDefault;

        return Response::json([
            'dayTypes' => array_map(
                static fn (DayType $type): array => $type->toPublic($proteinDefault),
                $this->c->dayTypes()->all($user->id),
            ),
        ]);
    }

    /**
     * @param array<string, string> $params
     */
    public function create(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $type = $this->c->days()->createDayType($user->id, DayTypeInput::from(Input::fromRequest($request)));

        return Response::json(['dayType' => $type->toPublic($this->proteinDefault($user->id))], 201);
    }

    /**
     * @param array<string, string> $params
     */
    public function update(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $id = self::id($params);
        // Existence (and ownership) first, so foreign or deleted ids always answer 404.
        if ($this->c->dayTypes()->find($user->id, $id) === null) {
            throw HttpException::notFound();
        }
        $type = $this->c->days()->updateDayType($user->id, $id, DayTypeInput::from(Input::fromRequest($request)));

        return Response::json(['dayType' => $type->toPublic($this->proteinDefault($user->id))]);
    }

    /**
     * @param array<string, string> $params
     */
    public function delete(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $this->c->days()->deleteDayType($user->id, self::id($params));

        return Response::noContent();
    }

    private function proteinDefault(int $userId): int
    {
        return $this->c->settings()->get($userId)->proteinDefault;
    }

    /**
     * @param array<string, string> $params
     */
    public static function id(array $params, string $key = 'id'): int
    {
        $raw = $params[$key] ?? '';
        if (preg_match('/^[1-9]\d{0,9}$/', $raw) !== 1) {
            throw HttpException::notFound();
        }

        return (int) $raw;
    }
}

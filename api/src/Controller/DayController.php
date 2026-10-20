<?php

declare(strict_types=1);

namespace Primed\Controller;

use Primed\Container;
use Primed\Http\Input;
use Primed\Http\Request;
use Primed\Http\Response;

final class DayController
{
    public function __construct(private readonly Container $c)
    {
    }

    /**
     * @param array<string, string> $params
     */
    public function today(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;

        return Response::json(['day' => $this->c->days()->refreshToday($user->id)->toPublic(true)]);
    }

    /**
     * @param array<string, string> $params
     */
    public function show(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $date = $params['date'] ?? '';
        $days = $this->c->days();
        $day = $days->getDay($user->id, $date);

        return Response::json([
            'day' => $day->toPublic($date === $days->today($user->id), $days->isEditable($user->id, $date)),
        ]);
    }

    /**
     * @param array<string, string> $params
     */
    public function update(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $date = $params['date'] ?? '';
        $input = Input::fromRequest($request);
        $day = $this->c->days()->setDay(
            $user->id,
            $date,
            $input->int('dayTypeId', 1, PHP_INT_MAX, 'Tagesart'),
            $input->nullableInt('trainingStart', 0, 1439, 'Trainingszeit'),
            $input->nullableInt('durationMin', 0, 600, 'Dauer'),
        );

        return Response::json(['day' => $day->toPublic($date === $this->c->days()->today($user->id))]);
    }
}

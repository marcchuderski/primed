<?php

declare(strict_types=1);

namespace Primed\Controller;

use Primed\Container;
use Primed\Day\TemplateDay;
use Primed\Http\Input;
use Primed\Http\Request;
use Primed\Http\Response;

final class WeekTemplateController
{
    public function __construct(private readonly Container $c)
    {
    }

    /**
     * @param array<string, string> $params
     */
    public function show(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;

        return $this->respond($user->id);
    }

    /**
     * @param array<string, string> $params
     */
    public function replace(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $days = [];
        foreach (Input::fromRequest($request)->list('days', 7, 7, 'Wochenvorlage') as $item) {
            $days[] = new TemplateDay(
                $item->int('weekday', 1, 7, 'Wochentag'),
                $item->int('dayTypeId', 1, PHP_INT_MAX, 'Tagesart'),
                $item->nullableInt('trainingStart', 0, 1439, 'Trainingszeit'),
                $item->nullableInt('durationMin', 0, 600, 'Dauer'),
            );
        }
        $this->c->days()->replaceWeekTemplate($user->id, $days);

        return $this->respond($user->id);
    }

    private function respond(int $userId): Response
    {
        return Response::json([
            'days' => array_values(array_map(
                static fn (TemplateDay $day): array => $day->toPublic(),
                $this->c->days()->weekTemplate($userId),
            )),
        ]);
    }
}

<?php

declare(strict_types=1);

namespace Primed\Controller;

use DateTimeImmutable;
use Primed\Container;
use Primed\Day\Day;
use Primed\Day\LogicalCalendar;
use Primed\Entry\EntryRepository;
use Primed\Http\Input;
use Primed\Http\Request;
use Primed\Http\Response;

/**
 * History (roadmap 6): targets and eaten sums per day. Rating and balances are computed in the client
 * (frontend/src/domain/history.ts) from these values.
 */
final class HistoryController
{
    /** A year view needs at most 366 days. */
    private const MAX_DAYS = 366;

    public function __construct(private readonly Container $c)
    {
    }

    /**
     * @param array<string, string> $params
     */
    public function index(Request $request, array $params): Response
    {
        $user = $this->c->authenticator()->require($request)->user;
        $from = $request->query['from'] ?? '';
        $to = $request->query['to'] ?? '';
        if (!LogicalCalendar::isValidDate($from) || !LogicalCalendar::isValidDate($to) || $from > $to) {
            throw Input::invalid('Ungültiger Zeitraum.');
        }
        $span = (new DateTimeImmutable($from))->diff(new DateTimeImmutable($to))->days;
        if ($span >= self::MAX_DAYS) {
            throw Input::invalid('Der Zeitraum ist zu lang.');
        }

        $result = $this->c->days()->history($user->id, $from, $to);
        $totals = (new EntryRepository($this->c->pdo()))->totalsByDate($user->id, $from, $to);
        $empty = ['kcal' => 0.0, 'protein' => 0.0, 'carbs' => 0.0, 'fat' => 0.0, 'sugar' => 0.0, 'count' => 0];

        return Response::json([
            'today' => $result['today'],
            'days' => array_map(static function (Day $day) use ($totals, $empty, $result): array {
                $t = $totals[$day->date] ?? $empty;
                $public = $day->toPublic($day->date === $result['today']);

                return [
                    'date' => $public['date'],
                    'isToday' => $public['isToday'],
                    'dayTypeName' => $public['dayTypeName'],
                    'isTraining' => $public['isTraining'],
                    'targets' => $public['targets'],
                    'eaten' => [
                        'kcal' => round($t['kcal'], 1),
                        'protein' => round($t['protein'], 1),
                        'carbs' => round($t['carbs'], 1),
                        'fat' => round($t['fat'], 1),
                        'sugar' => round($t['sugar'], 1),
                    ],
                    'entryCount' => $t['count'],
                    'statsExcluded' => $public['statsExcluded'],
                ];
            }, $result['days']),
        ]);
    }
}

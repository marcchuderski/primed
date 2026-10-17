<?php

declare(strict_types=1);

namespace Primed\Tests\Integration;

use Primed\Http\Request;

/**
 * History (roadmap 6): targets and sums per day, from the account start up to today.
 */
final class HistoryFlowTest extends ApiTestCase
{
    public function testReturnsDaysFromAccountStartToTodayWithSums(): void
    {
        foreach (['2026-10-18' => 'marcch', '2026-10-19' => 'freund'] as $date => $user) {
            $created = $this->call('POST', '/api/v1/entries/shake', [
                'date' => $date,
                'timeMin' => 600,
                'shake' => 'big',
            ], $user);
            self::assertSame(201, $created->status, $created->body);
        }

        $response = $this->call('GET', '/api/v1/history?from=2026-10-12&to=2026-10-25');
        self::assertSame(200, $response->status, $response->body);
        $body = self::json($response);
        self::assertSame('2026-10-20', $body['today']);
        $days = $body['days'];
        self::assertIsArray($days);
        $dates = array_map(static fn (mixed $d): mixed => is_array($d) ? $d['date'] : null, $days);
        self::assertSame(['2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20'], $dates);

        $byDate = array_combine($dates, $days);
        self::assertIsArray($byDate['2026-10-18']);
        self::assertSame(1, $byDate['2026-10-18']['entryCount']);
        self::assertIsArray($byDate['2026-10-18']['eaten']);
        self::assertGreaterThan(0, $byDate['2026-10-18']['eaten']['kcal']);
        self::assertIsArray($byDate['2026-10-18']['targets']);
        // The other user's entry is not counted.
        self::assertIsArray($byDate['2026-10-19']);
        self::assertSame(0, $byDate['2026-10-19']['entryCount']);
        self::assertIsArray($byDate['2026-10-20']);
        self::assertTrue($byDate['2026-10-20']['isToday']);
        self::assertFalse($byDate['2026-10-19']['isToday']);
    }

    public function testRejectsInvalidRanges(): void
    {
        foreach (
            [
                'from=2026-10-20&to=2026-10-19',
                'from=2026-02-30&to=2026-03-01',
                'from=2025-10-01&to=2026-10-02',
                'from=x&to=2026-10-02',
                'to=2026-10-02',
            ] as $query
        ) {
            self::assertSame(422, $this->call('GET', '/api/v1/history?' . $query)->status, $query);
        }
        self::assertSame(200, $this->call('GET', '/api/v1/history?from=2025-10-21&to=2026-10-20')->status);
    }

    public function testFutureAndPreAccountRangesAreEmpty(): void
    {
        $days = self::json($this->call('GET', '/api/v1/history?from=2026-11-01&to=2026-11-30'))['days'];
        self::assertSame([], $days);
        $days = self::json($this->call('GET', '/api/v1/history?from=2026-09-01&to=2026-09-30'))['days'];
        self::assertSame([], $days);
    }

    public function testNeedsSession(): void
    {
        $response = $this->app->handle(new Request('GET', '/api/v1/history', [], '', '203.0.113.7', [
            'from' => '2026-10-12',
            'to' => '2026-10-18',
        ]));
        self::assertSame(401, $response->status);
    }
}

<?php

declare(strict_types=1);

namespace Primed\Tests\Integration;

use Primed\Http\Response;

/**
 * Leaving days out of the statistics (D-180): only inside the edit window, kept when the day type changes,
 * delivered with the day and in the history. "Today" is Tue 2026-10-20, accounts start Thu 2026-10-15.
 */
final class StatsExclusionFlowTest extends ApiTestCase
{
    public function testDayCanBeExcludedAndCountedAgain(): void
    {
        $excluded = $this->call('PUT', '/api/v1/days/2026-10-18/stats', ['excluded' => true]);
        self::assertSame(200, $excluded->status, $excluded->body);
        self::assertTrue($this->day($excluded)['statsExcluded']);
        self::assertTrue($this->day($this->call('GET', '/api/v1/days/2026-10-18'))['statsExcluded']);
        self::assertSame(['2026-10-18' => true], $this->historyFlags());

        $counted = $this->call('PUT', '/api/v1/days/2026-10-18/stats', ['excluded' => false]);
        self::assertFalse($this->day($counted)['statsExcluded']);
        self::assertSame([], $this->historyFlags());
    }

    public function testTodayKeepsTheFlagWhenItIsRecalculated(): void
    {
        $this->call('PUT', '/api/v1/days/2026-10-20/stats', ['excluded' => true]);
        self::assertTrue($this->day($this->call('GET', '/api/v1/days/today'))['statsExcluded']);

        $rest = $this->pdo->query("SELECT id FROM day_types WHERE system_key = 'rest' AND user_id =
                                   (SELECT id FROM users WHERE username = 'marcch')");
        self::assertNotFalse($rest);
        $changed = $this->call('PUT', '/api/v1/days/2026-10-20', ['dayTypeId' => (int) $rest->fetchColumn()]);
        self::assertTrue($this->day($changed)['statsExcluded'], 'changing the day type keeps the flag');
        self::assertTrue($this->day($this->call('GET', '/api/v1/days/today'))['statsExcluded']);
    }

    public function testOnlyInsideTheEditWindow(): void
    {
        self::assertSame(422, $this->call('PUT', '/api/v1/days/2026-10-21/stats', ['excluded' => true])->status);
        self::assertSame(200, $this->call('PUT', '/api/v1/days/2026-10-15/stats', ['excluded' => true])->status);

        $this->clock->advance('+10 days'); // today 2026-10-30, window from 2026-10-23
        $tooOld = $this->call('PUT', '/api/v1/days/2026-10-15/stats', ['excluded' => false]);
        self::assertSame(422, $tooOld->status);
        self::assertStringContainsString('7 Tage', $tooOld->body);
    }

    public function testValidationAndIsolation(): void
    {
        self::assertSame(422, $this->call('PUT', '/api/v1/days/2026-10-19/stats', ['excluded' => 1])->status);
        self::assertSame(422, $this->call('PUT', '/api/v1/days/2026-10-19/stats', [])->status);
        self::assertSame(422, $this->call('PUT', '/api/v1/days/2026-02-30/stats', ['excluded' => true])->status);

        $this->call('PUT', '/api/v1/days/2026-10-19/stats', ['excluded' => true]);
        $friend = $this->call('GET', '/api/v1/days/2026-10-19', null, 'freund');
        self::assertFalse($this->day($friend)['statsExcluded'], 'the flag belongs to one user only');
    }

    /**
     * @return array<mixed>
     */
    private function day(Response $response): array
    {
        $day = self::json($response)['day'] ?? null;
        self::assertIsArray($day, $response->body);

        return $day;
    }

    /**
     * @return array<string, true> excluded dates of the history from account start to today
     */
    private function historyFlags(): array
    {
        $days = self::json($this->call('GET', '/api/v1/history?from=2026-10-15&to=2026-10-20'))['days'] ?? null;
        self::assertIsArray($days);
        $flags = [];
        foreach ($days as $day) {
            self::assertIsArray($day);
            self::assertIsBool($day['statsExcluded']);
            if ($day['statsExcluded'] && is_string($day['date'])) {
                $flags[$day['date']] = true;
            }
        }

        return $flags;
    }
}

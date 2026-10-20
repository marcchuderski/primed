<?php

declare(strict_types=1);

namespace Primed\Tests\Integration;

/**
 * Edit window (D-176): entries and the day type can be changed for today and 7 days back; older days are
 * read only and reading them creates nothing. "Today" is Tue 2026-10-20, accounts start Thu 2026-10-15.
 */
final class EditWindowFlowTest extends ApiTestCase
{
    public function testCreatingIsLimitedToTodayAndSevenDaysBack(): void
    {
        $quark = $this->foodId('REWE Quarkcreme');
        $entry = static fn (string $date): array => [
            'date' => $date, 'timeMin' => 600, 'foodId' => $quark, 'amount' => 1, 'unit' => 'packung',
        ];
        self::assertSame(201, $this->call('POST', '/api/v1/entries', $entry('2026-10-20'))->status);
        self::assertSame(201, $this->call('POST', '/api/v1/entries', $entry('2026-10-13'))->status);
        $tooOld = $this->call('POST', '/api/v1/entries', $entry('2026-10-12'));
        self::assertSame(422, $tooOld->status);
        self::assertStringContainsString('7 Tage', $tooOld->body);
        self::assertSame(422, $this->call('POST', '/api/v1/entries', $entry('2026-10-21'))->status);

        $shake = static fn (string $date): array => ['date' => $date, 'timeMin' => 600, 'shake' => 'big_milk_low'];
        self::assertSame(201, $this->call('POST', '/api/v1/entries/shake', $shake('2026-10-19'))->status);
        self::assertSame(422, $this->call('POST', '/api/v1/entries/shake', $shake('2026-10-12'))->status);

        // The window is checked before the dish is looked up.
        $dish = ['date' => '2026-10-12', 'timeMin' => 780, 'dishId' => 999999, 'portions' => 1];
        self::assertSame(422, $this->call('POST', '/api/v1/entries/dish', $dish)->status);
        self::assertSame(404, $this->call('POST', '/api/v1/entries/dish', ['date' => '2026-10-19'] + $dish)->status);
    }

    public function testDayTypeCanBeChangedInsideTheWindowOnly(): void
    {
        $rest = $this->pdo->query("SELECT id FROM day_types WHERE system_key = 'rest' AND user_id =
                                   (SELECT id FROM users WHERE username = 'marcch')");
        self::assertNotFalse($rest);
        $restId = (int) $rest->fetchColumn();
        $before = $this->templateRows();

        $ok = $this->call('PUT', '/api/v1/days/2026-10-13', ['dayTypeId' => $restId]);
        self::assertSame(200, $ok->status, $ok->body);
        $day = self::json($ok)['day'] ?? null;
        self::assertIsArray($day);
        self::assertSame('manual', $day['source']);
        self::assertTrue($day['editable']);
        self::assertSame($before, $this->templateRows(), 'the week template stays unchanged');

        self::assertSame(422, $this->call('PUT', '/api/v1/days/2026-10-12', ['dayTypeId' => $restId])->status);
    }

    public function testOlderDaysAreReadOnlyAndReadingCreatesNothing(): void
    {
        $quark = $this->foodId('REWE Quarkcreme');
        $created = $this->call('POST', '/api/v1/entries', [
            'date' => '2026-10-20', 'timeMin' => 600, 'foodId' => $quark, 'amount' => 1, 'unit' => 'packung',
        ]);
        $entry = self::json($created)['entry'] ?? null;
        self::assertIsArray($entry);
        self::assertIsInt($entry['id']);

        $this->clock->advance('+10 days'); // today 2026-10-30, window from 2026-10-23
        $old = self::json($this->call('GET', '/api/v1/days/2026-10-20'))['day'] ?? null;
        self::assertIsArray($old);
        self::assertFalse($old['editable']);
        $list = self::json($this->call('GET', '/api/v1/days/2026-10-20/entries'))['entries'] ?? null;
        self::assertIsArray($list);
        self::assertCount(1, $list);

        self::assertSame(422, $this->call('PATCH', '/api/v1/entries/' . $entry['id'], ['amount' => 2])->status);
        self::assertSame(422, $this->call('DELETE', '/api/v1/entries/' . $entry['id'])->status);
        $recent = self::json($this->call('GET', '/api/v1/days/2026-10-23'))['day'] ?? null;
        self::assertIsArray($recent);
        self::assertTrue($recent['editable']);

        $count = function (): int {
            $statement = $this->pdo->query("SELECT COUNT(*) FROM days WHERE date = '2026-10-10'");
            self::assertNotFalse($statement);

            return (int) $statement->fetchColumn();
        };
        self::assertSame(404, $this->call('GET', '/api/v1/days/2026-10-10')->status, 'before the account, no data');
        self::assertSame(404, $this->call('GET', '/api/v1/days/2026-10-10/entries')->status);
        self::assertSame(0, $count(), 'reading an old day creates no row from the current template');
    }

    /**
     * @return list<array<mixed>>
     */
    private function templateRows(): array
    {
        $rows = $this->pdo->query('SELECT * FROM week_template ORDER BY user_id, weekday');
        self::assertNotFalse($rows);

        return array_values(array_filter($rows->fetchAll(), 'is_array'));
    }

    private function foodId(string $name): int
    {
        $statement = $this->pdo->prepare("SELECT id FROM foods WHERE name = ? AND user_id =
                                          (SELECT id FROM users WHERE username = 'marcch')");
        $statement->execute([$name]);

        return (int) $statement->fetchColumn();
    }
}

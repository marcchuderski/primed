<?php

declare(strict_types=1);

namespace Primed\Tests\Integration;

use Primed\Http\Response;

/**
 * Diary entries through the HTTP kernel (roadmap 2.5).
 */
final class EntriesFlowTest extends ApiTestCase
{
    public function testCreatesEntryWithServerComputedSnapshot(): void
    {
        $quark = $this->foodId('REWE Quarkcreme');
        $response = $this->call('POST', '/api/v1/entries', [
            'date' => '2026-10-20',
            'timeMin' => 630,
            'foodId' => $quark,
            'amount' => 1,
            'unit' => 'packung',
        ]);

        self::assertSame(201, $response->status, $response->body);
        $entry = $this->entry($response);
        self::assertSame('REWE Quarkcreme', $entry['name']);
        self::assertEquals(200, $entry['quantity']);
        $expected = ['kcal' => 134, 'protein' => 24.8, 'carbs' => 6.4, 'sugar' => 5.2, 'fat' => 1];
        self::assertEquals($expected, $entry['nutrients']);

        // Usage and last amount are remembered for prefilling (BRIEFING §5).
        $stmt = $this->pdo->prepare('SELECT usage_count, last_amount, last_unit FROM foods WHERE id = ?');
        $stmt->execute([$quark]);
        self::assertEquals(['usage_count' => 1, 'last_amount' => '1.00', 'last_unit' => 'packung'], $stmt->fetch());
    }

    public function testListIsChronologicalForTheLogicalDay(): void
    {
        $bar = $this->foodId('DM Proteinriegel');
        foreach ([[30, 1], [1260, 1], [480, 2]] as [$time, $amount]) {
            $this->create('2026-10-20', $time, $bar, $amount, 'stueck');
        }

        $list = self::json($this->call('GET', '/api/v1/days/2026-10-20/entries'))['entries'] ?? null;
        self::assertIsArray($list);
        // 00:30 belongs to the end of the day (D-048).
        $times = array_map(static fn (mixed $e): mixed => is_array($e) ? $e['timeMin'] : null, $list);
        self::assertSame([480, 1260, 30], $times);
    }

    public function testValidation(): void
    {
        $bread = $this->foodId('REWE Dinkelbrötchen');
        $milk = $this->foodId('Milch 1,5 %');
        $base = ['date' => '2026-10-20', 'timeMin' => 600, 'foodId' => $bread, 'amount' => 90, 'unit' => 'g'];

        foreach (
            [
                ['timeMin' => 610],
                ['timeMin' => 1440],
                ['amount' => 0],
                ['amount' => '90'],
                ['amount' => 100000],
                ['unit' => 'ml'],
                ['unit' => 'packung'], // no package size
                ['unit' => 'kg'],
                ['date' => '2026-10-21'], // future
                ['foodId' => $milk, 'unit' => 'g'],
            ] as $override
        ) {
            $status = $this->call('POST', '/api/v1/entries', $override + $base)->status;
            self::assertSame(422, $status, (string) json_encode($override));
        }
    }

    public function testEditingScalesTheSnapshotEvenIfTheFoodChangedLater(): void
    {
        $bread = $this->foodId('REWE Dinkelbrötchen');
        $id = $this->entry($this->create('2026-10-20', 480, $bread, 90, 'g'))['id'];
        self::assertIsInt($id);

        // The product values change afterwards …
        $this->pdo->prepare('UPDATE foods SET kcal = 999 WHERE id = ?')->execute([$bread]);

        // … but doubling the amount doubles the original snapshot.
        $updated = $this->entry($this->call('PATCH', '/api/v1/entries/' . $id, ['amount' => 180, 'timeMin' => 495]));
        self::assertIsArray($updated['nutrients']);
        self::assertEquals(442.8, $updated['nutrients']['kcal']);
        self::assertSame(495, $updated['timeMin']);
    }

    public function testDeleteAndOwnership(): void
    {
        $bar = $this->foodId('DM Proteinriegel');
        $id = $this->entry($this->create('2026-10-20', 600, $bar, 1, 'stueck'))['id'];
        self::assertIsInt($id);

        // The friend can neither see, change nor delete it, and cannot use the owner's foods.
        self::assertSame(404, $this->call('PATCH', '/api/v1/entries/' . $id, ['amount' => 2], 'freund')->status);
        self::assertSame(404, $this->call('DELETE', '/api/v1/entries/' . $id, null, 'freund')->status);
        $foreignFood = $this->call('POST', '/api/v1/entries', [
            'date' => '2026-10-20',
            'timeMin' => 600,
            'foodId' => $bar,
            'amount' => 1,
            'unit' => 'stueck',
        ], 'freund');
        self::assertSame(404, $foreignFood->status);
        $friendList = self::json($this->call('GET', '/api/v1/days/2026-10-20/entries', null, 'freund'))['entries'];
        self::assertSame([], $friendList);

        self::assertSame(204, $this->call('DELETE', '/api/v1/entries/' . $id)->status);
        self::assertSame(404, $this->call('DELETE', '/api/v1/entries/' . $id)->status);
    }

    public function testFriendsGetSharedDefaultsButNotTheOwnersProducts(): void
    {
        $count = $this->pdo->query(
            "SELECT COUNT(*) FROM foods f JOIN users u ON u.id = f.user_id WHERE u.username = 'freund'",
        );
        self::assertNotFalse($count);
        self::assertSame(17, (int) $count->fetchColumn()); // 2 milks, protein powder, 14 BLS references
    }

    private function create(string $date, int $time, int $foodId, float $amount, string $unit): Response
    {
        $response = $this->call('POST', '/api/v1/entries', [
            'date' => $date,
            'timeMin' => $time,
            'foodId' => $foodId,
            'amount' => $amount,
            'unit' => $unit,
        ]);
        self::assertSame(201, $response->status, $response->body);

        return $response;
    }

    private function foodId(string $name): int
    {
        $stmt = $this->pdo->prepare(
            "SELECT f.id FROM foods f JOIN users u ON u.id = f.user_id WHERE u.username = 'marcch' AND f.name = ?",
        );
        $stmt->execute([$name]);
        $id = $stmt->fetchColumn();
        self::assertNotFalse($id, $name);

        return (int) $id;
    }

    /**
     * @return array<string, mixed>
     */
    private function entry(Response $response): array
    {
        $entry = self::json($response)['entry'] ?? null;
        self::assertIsArray($entry, $response->body);

        /** @var array<string, mixed> $entry */
        return $entry;
    }
}

<?php

declare(strict_types=1);

namespace Primed\Tests\Integration;

use Primed\Food\FoodRepository;
use Primed\Food\FoodSeeder;

/**
 * Shared reference values (D-170): search, copy on first use, unit Stück with a piece weight.
 */
final class ReferencesFlowTest extends ApiTestCase
{
    private function reference(string $name, string $basis, float $kcal, ?float $pieceWeight): int
    {
        $existing = $this->pdo->prepare('SELECT id FROM reference_foods WHERE name = ?');
        $existing->execute([$name]);
        $id = $existing->fetchColumn();
        if ($id !== false) {
            return (int) $id;
        }
        $this->pdo->prepare(
            "INSERT INTO reference_foods (name, category, basis, kcal, protein, carbs, sugar, fat, piece_weight,
                                          source, sort)
             VALUES (?, 'bread', ?, ?, 10, 50, 2, 2, ?, 'Test', 9999)",
        )->execute([$name, $basis, $kcal, $pieceWeight]);

        return (int) $this->pdo->lastInsertId();
    }

    /**
     * @return list<array<mixed>>
     */
    private function search(string $q, string $user = 'marcch'): array
    {
        $json = self::json($this->call('GET', '/api/v1/references?q=' . rawurlencode($q), null, $user));
        $list = $json['references'] ?? null;
        self::assertIsArray($list);

        return array_values(array_filter($list, 'is_array'));
    }

    public function testAdoptCopiesOnceAndLogsPieces(): void
    {
        $id = $this->reference('Testbrötchen', 'per_100g', 250, 60);

        $hits = $this->search('testbrö');
        self::assertCount(1, $hits);
        self::assertSame(['id' => $id, 'name' => 'Testbrötchen', 'pieceWeight' => 60], [
            'id' => $hits[0]['id'] ?? null,
            'name' => $hits[0]['name'] ?? null,
            'pieceWeight' => $hits[0]['pieceWeight'] ?? null,
        ]);

        $adopted = $this->call('POST', '/api/v1/references/' . $id . '/adopt');
        self::assertSame(200, $adopted->status, $adopted->body);
        $food = self::json($adopted)['food'] ?? null;
        self::assertIsArray($food);
        self::assertSame('reference', $food['type']);
        self::assertEquals(60, $food['pieceWeight']);
        $again = self::json($this->call('POST', '/api/v1/references/' . $id . '/adopt'))['food'] ?? null;
        self::assertIsArray($again);
        self::assertSame($food['id'], $again['id'], 'adopting twice keeps one copy');

        self::assertSame([], $this->search('testbrö'), 'a visible copy hides the shared row');
        self::assertCount(1, $this->search('testbrö', 'freund'), 'other users are not affected');

        $entry = $this->call('POST', '/api/v1/entries', [
            'date' => '2026-10-19', 'timeMin' => 480, 'foodId' => $food['id'], 'amount' => 2, 'unit' => 'stueck',
        ]);
        self::assertSame(201, $entry->status, $entry->body);
        $logged = self::json($entry)['entry'] ?? null;
        self::assertIsArray($logged);
        self::assertEquals(120, $logged['quantity']);
        self::assertIsArray($logged['nutrients']);
        self::assertEquals(300, $logged['nutrients']['kcal']);
        self::assertEquals(60, $logged['pieceWeight']);

        self::assertIsInt($food['id']);
        self::assertSame(204, $this->call('DELETE', '/api/v1/foods/' . $food['id'])->status);
        self::assertCount(1, $this->search('testbrö'), 'deleted copy: shared row shows again');
        $restored = self::json($this->call('POST', '/api/v1/references/' . $id . '/adopt'))['food'] ?? null;
        self::assertIsArray($restored);
        self::assertSame($food['id'], $restored['id'], 'the deleted copy is restored, not duplicated');
    }

    public function testPiecesNeedAPieceWeight(): void
    {
        $id = $this->reference('Testgurke', 'per_100g', 15, null);
        $food = self::json($this->call('POST', '/api/v1/references/' . $id . '/adopt'))['food'] ?? null;
        self::assertIsArray($food);
        $entry = $this->call('POST', '/api/v1/entries', [
            'date' => '2026-10-19', 'timeMin' => 480, 'foodId' => $food['id'], 'amount' => 1, 'unit' => 'stueck',
        ]);
        self::assertSame(422, $entry->status);
    }

    public function testStartMilkIsLinkedAndOnlyListedWhileHidden(): void
    {
        $milk = $this->reference('Milch 1,5 %', 'per_100ml', 47, null);
        $users = $this->pdo->query("SELECT id FROM users WHERE username = 'marcch'");
        self::assertNotFalse($users);
        (new FoodSeeder(new FoodRepository($this->pdo)))->seed((int) $users->fetchColumn(), true, $this->clock->now());

        self::assertSame(200, $this->call('PATCH', '/api/v1/settings', ['shakesEnabled' => true])->status);
        self::assertSame([], $this->search('Milch 1,5'), 'shakes on: the own milk is visible, no duplicate');

        self::assertSame(200, $this->call('PATCH', '/api/v1/settings', ['shakesEnabled' => false])->status);
        self::assertCount(1, $this->search('Milch 1,5'), 'shakes off: milk stays findable as reference value');
        $food = self::json($this->call('POST', '/api/v1/references/' . $milk . '/adopt'))['food'] ?? null;
        self::assertIsArray($food);
        self::assertSame('Milch 1,5 %', $food['name']);
        $count = $this->pdo->query("SELECT COUNT(*) FROM foods WHERE name = 'Milch 1,5 %' AND deleted_at IS NULL");
        self::assertNotFalse($count);
        self::assertSame(2, (int) $count->fetchColumn(), 'one per user, no second copy');
    }

    public function testRejectsBadInput(): void
    {
        self::assertSame([], $this->search(''));
        self::assertSame(422, $this->call('GET', '/api/v1/references?q=' . str_repeat('a', 61))->status);
        self::assertSame(422, $this->call('GET', '/api/v1/references?q=' . rawurlencode("sky\xC3r"))->status);
        self::assertSame(404, $this->call('POST', '/api/v1/references/999999/adopt')->status);
        self::assertSame(404, $this->call('POST', '/api/v1/references/abc/adopt')->status);
    }
}

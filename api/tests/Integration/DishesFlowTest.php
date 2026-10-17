<?php

declare(strict_types=1);

namespace Primed\Tests\Integration;

use Primed\Http\Response;

/**
 * Meal prep dishes through the HTTP kernel (phase 4).
 */
final class DishesFlowTest extends ApiTestCase
{
    public function testCreateDishWithSnapshotsAndEvenPortions(): void
    {
        $dish = $this->createChili(4);

        self::assertSame('Chili', $dish['name']);
        self::assertSame('2026-10-20', $dish['cookedOn']);
        self::assertEquals(4, $dish['portionsLeft']);
        self::assertSame('active', $dish['status']);
        // 400 g rice (1404 kcal) + 2 EL olive oil = 30 g (269.7 kcal)
        self::assertIsArray($dish['totals']);
        self::assertEquals(1673.7, $dish['totals']['kcal']);
        self::assertIsArray($dish['perPortion']);
        self::assertEquals(418.4, $dish['perPortion']['kcal']);
        self::assertIsArray($dish['ingredients']);
        self::assertCount(2, $dish['ingredients']);
    }

    public function testLoggingPortionsCountsDownArchivesAndReactivates(): void
    {
        $id = self::id($this->createChili(2));

        $first = $this->logPortion($id, 1.5);
        self::assertSame(201, $first->status, $first->body);
        $entry = self::json($first)['entry'];
        self::assertIsArray($entry);
        self::assertSame('dish', $entry['kind']);
        self::assertSame('portion', $entry['unit']);
        self::assertIsArray($entry['nutrients']);
        self::assertEquals(1255.3, $entry['nutrients']['kcal']);

        self::assertSame(422, $this->logPortion($id, 1)->status, 'only 0.5 left');
        self::assertSame(422, $this->logPortion($id, 0.3)->status, 'half steps only');
        self::assertSame(201, $this->logPortion($id, 0.5)->status);

        self::assertSame([], $this->dishNames('active'));
        self::assertSame(['Chili'], $this->dishNames('archived'));

        // Deleting an entry brings the dish back from the archive.
        self::assertIsInt($entry['id']);
        $this->call('DELETE', '/api/v1/entries/' . $entry['id']);
        self::assertSame(['Chili'], $this->dishNames('active'));

        // Editing a portion entry respects what is left (0.5 left + 0 already in this entry).
        $last = $this->logPortion($id, 0.5);
        $lastEntry = self::json($last)['entry'];
        self::assertIsArray($lastEntry);
        self::assertIsInt($lastEntry['id']);
        $path = '/api/v1/entries/' . $lastEntry['id'];
        self::assertSame(422, $this->call('PATCH', $path, ['amount' => 2])->status);
        self::assertSame(200, $this->call('PATCH', $path, ['amount' => 1])->status);
    }

    public function testDiscardMovesToArchiveWithoutEntries(): void
    {
        $id = self::id($this->createChili(4));
        $this->logPortion($id, 1);

        $discarded = self::json($this->call('POST', '/api/v1/dishes/' . $id . '/discard'))['dish'];
        self::assertIsArray($discarded);
        self::assertSame('discarded', $discarded['status']);
        self::assertEquals(0, $discarded['portionsLeft']);
        self::assertSame(422, $this->logPortion($id, 0.5)->status);
        self::assertSame(['Chili'], $this->dishNames('archived'));
    }

    public function testDishesStayEditableButNotBelowEatenPortions(): void
    {
        $dish = $this->createChili(4);
        $id = self::id($dish);
        $this->logPortion($id, 2);

        $tooFew = $this->call('PUT', '/api/v1/dishes/' . $id, $this->payload('Chili', 1.5));
        self::assertSame(422, $tooFew->status);

        $updated = self::json($this->call('PUT', '/api/v1/dishes/' . $id, $this->payload('Chili scharf', 3)))['dish'];
        self::assertIsArray($updated);
        self::assertSame('Chili scharf', $updated['name']);
        self::assertEquals(1, $updated['portionsLeft']);
    }

    public function testCookAgainCreatesANewDishFromTheOldOne(): void
    {
        $old = self::id($this->createChili(2));
        $response = $this->call('POST', '/api/v1/dishes', ['basedOnDishId' => $old] + $this->payload('Chili', 3, 300));
        self::assertSame(201, $response->status, $response->body);
        $new = self::json($response)['dish'];
        self::assertIsArray($new);
        self::assertSame($old, $new['basedOnDishId']);
        self::assertNotSame($old, $new['id']);
    }

    public function testValidationAndOwnership(): void
    {
        $id = self::id($this->createChili(2));
        $rice = $this->foodId('Reis, roh');

        $grams = [['foodId' => $rice, 'amount' => 100, 'unit' => 'g']];
        $millilitres = [['foodId' => $rice, 'amount' => 100, 'unit' => 'ml']];
        foreach (
            [
                ['name' => '', 'portions' => 2, 'ingredients' => $grams],
                ['name' => 'X', 'portions' => 2.3, 'ingredients' => $grams],
                ['name' => 'X', 'portions' => 2, 'ingredients' => []],
                ['name' => 'X', 'portions' => 2, 'ingredients' => $millilitres],
            ] as $payload
        ) {
            $status = $this->call('POST', '/api/v1/dishes', $payload)->status;
            self::assertSame(422, $status, (string) json_encode($payload));
        }

        self::assertSame(404, $this->call('GET', '/api/v1/dishes/' . $id, null, 'freund')->status);
        self::assertSame(404, $this->call('POST', '/api/v1/dishes/' . $id . '/discard', null, 'freund')->status);
        self::assertSame(404, $this->call('POST', '/api/v1/entries/dish', [
            'date' => '2026-10-20',
            'timeMin' => 780,
            'dishId' => $id,
            'portions' => 1,
        ], 'freund')->status);
        // The friend's own rice is a different food; foreign food ids are rejected.
        self::assertSame(404, $this->call('POST', '/api/v1/dishes', $this->payload('X', 2), 'freund')->status);
    }

    /**
     * @return array<string, mixed>
     */
    private function createChili(float $portions): array
    {
        $response = $this->call('POST', '/api/v1/dishes', $this->payload('Chili', $portions));
        self::assertSame(201, $response->status, $response->body);
        $dish = self::json($response)['dish'];
        self::assertIsArray($dish);

        /** @var array<string, mixed> $dish */
        return $dish;
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(string $name, float $portions, float $rice = 400): array
    {
        return [
            'name' => $name,
            'portions' => $portions,
            'ingredients' => [
                ['foodId' => $this->foodId('Reis, roh'), 'amount' => $rice, 'unit' => 'g'],
                ['foodId' => $this->foodId('Olivenöl'), 'amount' => 2, 'unit' => 'el'],
            ],
        ];
    }

    private function logPortion(int $dishId, float $portions): Response
    {
        return $this->call('POST', '/api/v1/entries/dish', [
            'date' => '2026-10-20',
            'timeMin' => 780,
            'dishId' => $dishId,
            'portions' => $portions,
        ]);
    }

    /**
     * @return list<string>
     */
    private function dishNames(string $status): array
    {
        $dishes = self::json($this->call('GET', '/api/v1/dishes?status=' . $status))['dishes'];
        self::assertIsArray($dishes);
        $names = [];
        foreach ($dishes as $dish) {
            if (is_array($dish) && is_string($dish['name'])) {
                $names[] = $dish['name'];
            }
        }

        return $names;
    }

    /**
     * @param array<string, mixed> $dish
     */
    private static function id(array $dish): int
    {
        self::assertIsInt($dish['id']);

        return $dish['id'];
    }

    private function foodId(string $name): int
    {
        $stmt = $this->pdo->prepare(
            "SELECT f.id FROM foods f JOIN users u ON u.id = f.user_id WHERE u.username = 'marcch' AND f.name = ?",
        );
        $stmt->execute([$name]);

        return (int) $stmt->fetchColumn();
    }
}

<?php

declare(strict_types=1);

namespace Primed\Tests\Integration;

use PDO;

/**
 * Library and Open Food Facts proxy through the HTTP kernel (roadmap 3.1, 3.4, 3.6, 3.7).
 */
final class FoodsFlowTest extends ApiTestCase
{
    private const SKYR = [
        'type' => 'product',
        'name' => 'Skyr Natur',
        'brand' => 'Arla',
        'barcode' => '4006381333931',
        'category' => 'dairy',
        'basis' => 'per_100g',
        'kcal' => 63,
        'protein' => 11,
        'carbs' => 4,
        'sugar' => 4,
        'fat' => 0.2,
        'packageAmount' => 450,
    ];

    public function testStartLibraryIsMilkAndWheyOnly(): void
    {
        $names = $this->names(self::json($this->call('GET', '/api/v1/foods', null, 'freund')));
        self::assertEqualsCanonicalizing(['Milch 1,5 %', 'Milch 3,5 %', 'ESN Designer Whey Milk Chocolate'], $names);

        $whey = $this->call('GET', '/api/v1/foods/barcode/4250519647234', null, 'freund');
        self::assertSame('library', self::json($whey)['source']);
    }

    public function testStartMilkIsOnlyVisibleWhileShakesAreOn(): void
    {
        self::assertContains('Milch 1,5 %', $this->names(self::json($this->call('GET', '/api/v1/foods?q=Milch'))));

        self::assertSame(200, $this->call('PATCH', '/api/v1/settings', ['shakesEnabled' => false])->status);
        $names = $this->names(self::json($this->call('GET', '/api/v1/foods')));
        self::assertNotContains('Milch 1,5 %', $names);
        self::assertNotContains('Milch 3,5 %', $names);
        self::assertContains('ESN Designer Whey Milk Chocolate', $names);

        self::assertSame(200, $this->call('PATCH', '/api/v1/settings', ['shakesEnabled' => true])->status);
        self::assertContains('Milch 3,5 %', $this->names(self::json($this->call('GET', '/api/v1/foods'))));
    }

    public function testCreateSearchUpdateDelete(): void
    {
        $created = $this->call('POST', '/api/v1/foods', self::SKYR);
        self::assertSame(201, $created->status, $created->body);
        $food = self::json($created)['food'];
        self::assertIsArray($food);
        $id = $food['id'];
        self::assertIsInt($id);

        self::assertContains('Skyr Natur', $this->names(self::json($this->call('GET', '/api/v1/foods?q=skyr'))));
        self::assertContains('Skyr Natur', $this->names(self::json($this->call('GET', '/api/v1/foods?q=arla'))));
        // LIKE wildcards are escaped: "__" matches only a literal "__".
        self::assertSame([], $this->names(self::json($this->call('GET', '/api/v1/foods?q=__'))));

        // Duplicate barcode → 409; the friend has their own library.
        self::assertSame(409, $this->call('POST', '/api/v1/foods', self::SKYR)->status);
        self::assertSame(201, $this->call('POST', '/api/v1/foods', self::SKYR, 'freund')->status);
        self::assertSame(404, $this->call('PATCH', '/api/v1/foods/' . $id, self::SKYR, 'freund')->status);

        $updated = $this->call('PATCH', '/api/v1/foods/' . $id, ['kcal' => 65] + self::SKYR);
        self::assertSame(200, $updated->status);

        self::assertSame(204, $this->call('DELETE', '/api/v1/foods/' . $id)->status);
        self::assertNotContains('Skyr Natur', $this->names(self::json($this->call('GET', '/api/v1/foods?q=skyr'))));

        // Re-adding the same barcode restores the deleted food instead of creating a duplicate.
        $again = self::json($this->call('POST', '/api/v1/foods', self::SKYR))['food'];
        self::assertIsArray($again);
        self::assertSame($id, $again['id']);
    }

    public function testValidation(): void
    {
        foreach (
            [
                ['barcode' => '4006381333932'],
                ['sugar' => 5, 'carbs' => 4],
                ['protein' => 60, 'carbs' => 30, 'fat' => 20],
                ['kcal' => 1000],
                ['category' => 'meat'],
                ['basis' => 'per_kg'],
                ['name' => ''],
                ['kcal' => '63'],
            ] as $override
        ) {
            $status = $this->call('POST', '/api/v1/foods', $override + self::SKYR)->status;
            self::assertSame(422, $status, (string) json_encode($override));
        }
    }

    public function testIngredientsAreHiddenOutsideMealPrep(): void
    {
        $bean = ['type' => 'ingredient', 'barcode' => null, 'name' => 'Kidneybohnen'] + self::SKYR;
        $this->call('POST', '/api/v1/foods', $bean);

        self::assertNotContains('Kidneybohnen', $this->names(self::json($this->call('GET', '/api/v1/foods?q=kidney'))));
        $mealPrep = self::json($this->call('GET', '/api/v1/foods?q=kidney&context=mealprep'));
        self::assertContains('Kidneybohnen', $this->names($mealPrep));
    }

    public function testFrequentAroundNow(): void
    {
        $bar = $this->foodId('DM Proteinriegel');
        $quark = $this->foodId('REWE Quarkcreme');
        // now = 12:00 Berlin; within ±90 min: 11:00, 13:15 · outside: 08:00
        $logged = [['2026-10-19', 660, $bar], ['2026-10-18', 795, $bar], ['2026-10-19', 480, $quark]];
        foreach ($logged as [$date, $time, $food]) {
            $this->call('POST', '/api/v1/entries', [
                'date' => $date,
                'timeMin' => $time,
                'foodId' => $food,
                'amount' => 1,
                'unit' => $food === $bar ? 'stueck' : 'packung',
            ]);
        }

        self::assertSame(['DM Proteinriegel'], $this->names(self::json($this->call('GET', '/api/v1/foods/frequent'))));
    }

    public function testBarcodeLookupUsesOpenFoodFactsAndCaches(): void
    {
        $this->offFetcher->responses['/api/v2/product/4006381333931.json'] = (string) json_encode([
            'status' => 1,
            'product' => [
                'code' => '4006381333931',
                'product_name_de' => 'Skyr Natur',
                'brands' => 'Arla, Milsani',
                'product_quantity' => '450',
                'product_quantity_unit' => 'g',
                'categories_tags' => ['en:dairies'],
                'nutriments' => [
                    'energy-kcal_100g' => 63,
                    'proteins_100g' => 11,
                    'carbohydrates_100g' => 4,
                    'sugars_100g' => 4,
                    'fat_100g' => 0.2,
                ],
            ],
        ]);

        $first = self::json($this->call('GET', '/api/v1/foods/barcode/4006381333931'));
        self::assertSame('off', $first['source']);
        self::assertIsArray($first['product']);
        self::assertSame('Arla', $first['product']['brand']);
        self::assertSame('dairy', $first['product']['category']);
        self::assertEquals(450, $first['product']['packageAmount']);

        $this->call('GET', '/api/v1/foods/barcode/4006381333931');
        self::assertCount(1, $this->offFetcher->requests, 'second lookup must come from the cache');
        self::assertStringStartsWith('https://world.openfoodfacts.org/', $this->offFetcher->requests[0]);
    }

    public function testOffCacheIsPurgedOnWrite(): void
    {
        $this->pdo->exec("INSERT INTO off_cache (cache_key, payload, fetched_at) VALUES
            ('barcode:old', NULL, '2026-09-01 00:00:00'), ('barcode:recent', NULL, '2026-10-01 00:00:00')");
        $this->offFetcher->responses['search.openfoodfacts.org'] = (string) json_encode(['hits' => []]);

        self::assertSame(200, $this->call('GET', '/api/v1/off/search?q=skyr')->status);

        $statement = $this->pdo->query("SELECT cache_key FROM off_cache WHERE cache_key LIKE 'barcode:%'");
        self::assertNotFalse($statement);
        $keys = $statement->fetchAll(PDO::FETCH_COLUMN);
        self::assertSame(['barcode:recent'], $keys, 'rows older than the longest TTL (30 days) are removed');
    }

    public function testSearchRejectsInvalidUtf8(): void
    {
        self::assertSame(422, $this->call('GET', '/api/v1/off/search?q=' . rawurlencode("sky\xC3r"))->status);
        self::assertSame(422, $this->call('GET', '/api/v1/foods?q=' . rawurlencode("sky\xC3r"))->status);
    }

    public function testSaucesCategoryForOwnAndOnlineFoods(): void
    {
        $created = $this->call('POST', '/api/v1/foods', [...self::SKYR, 'name' => 'Olivenöl nativ', 'barcode' => null,
            'category' => 'sauces']);
        self::assertSame(201, $created->status, $created->body);
        $sauces = $this->names(self::json($this->call('GET', '/api/v1/foods?category=sauces')));
        self::assertSame(['Olivenöl nativ'], $sauces);

        $this->offFetcher->responses['/api/v2/product/4006381333931.json'] = (string) json_encode([
            'status' => 1,
            'product' => [
                'code' => '4006381333931',
                'product_name_de' => 'Rapsöl',
                'categories_tags' => ['en:plant-based-foods', 'en:fats', 'en:vegetable-oils'],
                'nutriments' => ['energy-kcal_100g' => 828, 'proteins_100g' => 0, 'carbohydrates_100g' => 0,
                    'sugars_100g' => 0, 'fat_100g' => 92],
            ],
        ]);
        $online = self::json($this->call('GET', '/api/v1/foods/barcode/4006381333931'));
        self::assertIsArray($online['product']);
        self::assertSame('sauces', $online['product']['category']);
    }

    public function testBarcodeErrors(): void
    {
        self::assertSame(422, $this->call('GET', '/api/v1/foods/barcode/4006381333932')->status);
        self::assertSame(404, $this->call('GET', '/api/v1/foods/barcode/96385074')->status);

        $this->offFetcher->down = true;
        self::assertSame(503, $this->call('GET', '/api/v1/foods/barcode/036000291452')->status);
    }

    public function testImplausibleOffDataIsRejected(): void
    {
        $this->offFetcher->responses['4260173787214'] = (string) json_encode([
            'status' => 1,
            'product' => ['code' => '4260173787214', 'product_name' => '<script>x</script>', 'nutriments' => [
                'energy-kcal_100g' => 5000, 'proteins_100g' => 1, 'carbohydrates_100g' => 1, 'fat_100g' => 1,
            ]],
        ]);

        $response = $this->call('GET', '/api/v1/foods/barcode/4260173787214');
        self::assertSame(404, $response->status, (string) json_encode($this->logger->records));
    }

    public function testOnlineSearchStripsQuerySyntax(): void
    {
        $this->offFetcher->responses['search.openfoodfacts.org'] = (string) json_encode(['hits' => []]);
        $this->call('GET', '/api/v1/off/search?q=' . rawurlencode('skyr" OR brands:*x* -natur'));

        $url = urldecode($this->offFetcher->requests[0] ?? '');
        self::assertStringContainsString('q=skyr or brands x natur countries_tags:"en:germany"', $url);
    }

    public function testOnlineSearchIsValidatedAndRateLimited(): void
    {
        $this->offFetcher->responses['search.openfoodfacts.org'] = (string) json_encode(['hits' => []]);

        self::assertSame(422, $this->call('GET', '/api/v1/off/search?q=a')->status);
        for ($i = 0; $i < 10; $i++) {
            self::assertSame(200, $this->call('GET', '/api/v1/off/search?q=skyr' . $i)->status);
        }
        self::assertSame(429, $this->call('GET', '/api/v1/off/search?q=skyr-more')->status);
        $first = urldecode($this->offFetcher->requests[0] ?? '');
        self::assertStringContainsString('skyr0 countries_tags:"en:germany"', $first);
    }

    /**
     * @param array<string, mixed> $json
     * @return list<string>
     */
    private function names(array $json): array
    {
        $foods = $json['foods'] ?? [];
        self::assertIsArray($foods);
        $names = [];
        foreach ($foods as $food) {
            if (is_array($food) && is_string($food['name'] ?? null)) {
                $names[] = $food['name'];
            }
        }

        return $names;
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

<?php

declare(strict_types=1);

namespace Primed\Tests\Integration;

/**
 * Quick shakes (BRIEFING §9): milk + current protein powder from the library.
 */
final class ShakesFlowTest extends ApiTestCase
{
    public function testShakeVariantsComeFromLiquidsAndPowder(): void
    {
        $shakes = self::json($this->call('GET', '/api/v1/shakes'))['shakes'];
        self::assertIsArray($shakes);
        $ids = array_map(static fn (mixed $s): mixed => is_array($s) ? $s['id'] : null, $shakes);
        self::assertSame(
            ['big_milk_low', 'big_milk_high', 'big_water', 'small_milk_low', 'small_milk_high', 'small_water'],
            $ids,
        );
        $big = $shakes[0];
        self::assertIsArray($big);
        self::assertSame('Shake Groß · Milch 1,5 %', $big['name']);
        // 400 ml Milch 1,5 % (188 kcal, 13,6 P) + 30 g ESN Whey (112,2 kcal, 21,6 P)
        $expected = ['kcal' => 300.2, 'protein' => 35.2, 'carbs' => 21, 'sugar' => 20.8, 'fat' => 7.6];
        self::assertEquals($expected, $big['nutrients']);
        $water = $shakes[5];
        self::assertIsArray($water);
        self::assertSame('Shake Klein · Wasser', $water['name']);
        self::assertIsArray($water['nutrients']);
        self::assertEquals(112.2, $water['nutrients']['kcal']);
    }

    public function testLiquidSelectionLimitsTheVariants(): void
    {
        $ok = self::json($this->call('PATCH', '/api/v1/settings', [
            'shake' => ['liquids' => ['milkLow' => false, 'milkHigh' => false], 'powderG' => 40],
        ]))['settings'];
        self::assertIsArray($ok);
        self::assertSame(['milkLow' => false, 'milkHigh' => false, 'water' => true], $ok['shakeLiquids']);
        self::assertSame(40, $ok['shakePowderG']);
        $shakes = self::json($this->call('GET', '/api/v1/shakes'))['shakes'];
        self::assertIsArray($shakes);
        self::assertCount(2, $shakes);
        self::assertSame(409, $this->call('POST', '/api/v1/entries/shake', [
            'date' => '2026-10-20',
            'timeMin' => 600,
            'shake' => 'big_milk_low',
        ])->status);
        // At least one liquid stays selected.
        self::assertSame(422, $this->call('PATCH', '/api/v1/settings', [
            'shake' => ['liquids' => ['water' => false]],
        ])->status);
        self::assertSame(422, $this->call('PATCH', '/api/v1/settings', [
            'shake' => ['liquids' => ['juice' => true]],
        ])->status);
    }

    public function testLoggingAShakeCreatesAShakeEntry(): void
    {
        $response = $this->call('POST', '/api/v1/entries/shake', [
            'date' => '2026-10-20',
            'timeMin' => 1320,
            'shake' => 'small_milk_high',
        ]);
        self::assertSame(201, $response->status, $response->body);
        $entry = self::json($response)['entry'];
        self::assertIsArray($entry);
        self::assertSame('shake', $entry['kind']);
        self::assertSame('Shake Klein · Milch 3,5 %', $entry['name']);
        self::assertNull($entry['foodId']);

        self::assertSame(422, $this->call('POST', '/api/v1/entries/shake', [
            'date' => '2026-10-20',
            'timeMin' => 1320,
            'shake' => 'huge',
        ])->status);
    }

    public function testShakesDisappearWhenThePowderIsDeleted(): void
    {
        $whey = self::json($this->call('GET', '/api/v1/foods/barcode/4250519647234'))['food'];
        self::assertIsArray($whey);
        self::assertIsInt($whey['id']);
        $this->call('DELETE', '/api/v1/foods/' . $whey['id']);

        self::assertSame([], self::json($this->call('GET', '/api/v1/shakes'))['shakes']);
        self::assertSame(409, $this->call('POST', '/api/v1/entries/shake', [
            'date' => '2026-10-20',
            'timeMin' => 1320,
            'shake' => 'big_milk_low',
        ])->status);
    }

    public function testShakesCanBeSwitchedOff(): void
    {
        $off = self::json($this->call('PATCH', '/api/v1/settings', ['shakesEnabled' => false]))['settings'];
        self::assertIsArray($off);
        self::assertFalse($off['shakesEnabled']);
        self::assertSame([], self::json($this->call('GET', '/api/v1/shakes'))['shakes']);
        $response = $this->call('POST', '/api/v1/entries/shake', [
            'date' => '2026-10-20',
            'timeMin' => 600,
            'shake' => 'big_milk_low',
        ]);
        self::assertSame(409, $response->status);
        self::assertSame(422, $this->call('PATCH', '/api/v1/settings', ['shakesEnabled' => 'nein'])->status);

        $this->call('PATCH', '/api/v1/settings', ['shakesEnabled' => true]);
        $shakes = self::json($this->call('GET', '/api/v1/shakes'))['shakes'];
        self::assertIsArray($shakes);
        self::assertCount(6, $shakes);
    }
}

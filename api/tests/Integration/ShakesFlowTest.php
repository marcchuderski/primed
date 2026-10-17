<?php

declare(strict_types=1);

namespace Primed\Tests\Integration;

/**
 * Quick shakes (BRIEFING §9): milk + current protein powder from the library.
 */
final class ShakesFlowTest extends ApiTestCase
{
    public function testShakeValuesComeFromMilkAndPowder(): void
    {
        $shakes = self::json($this->call('GET', '/api/v1/shakes'))['shakes'];
        self::assertIsArray($shakes);
        self::assertCount(3, $shakes);
        $big = $shakes[0];
        self::assertIsArray($big);
        self::assertSame('Shake Groß', $big['name']);
        // 400 ml Milch 1,5 % (188 kcal, 13,6 P) + 30 g ESN Whey (112,2 kcal, 21,6 P)
        $expected = ['kcal' => 300.2, 'protein' => 35.2, 'carbs' => 21, 'sugar' => 20.8, 'fat' => 7.6];
        self::assertEquals($expected, $big['nutrients']);
    }

    public function testLoggingAShakeCreatesAShakeEntry(): void
    {
        $response = $this->call('POST', '/api/v1/entries/shake', [
            'date' => '2026-10-20',
            'timeMin' => 1320,
            'shake' => 'small_high',
        ]);
        self::assertSame(201, $response->status, $response->body);
        $entry = self::json($response)['entry'];
        self::assertIsArray($entry);
        self::assertSame('shake', $entry['kind']);
        self::assertSame('Shake Klein 3,5 %', $entry['name']);
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
            'shake' => 'big',
        ])->status);
    }
}

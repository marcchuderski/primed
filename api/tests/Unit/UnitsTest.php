<?php

declare(strict_types=1);

namespace Primed\Tests\Unit;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Primed\Food\Units;
use Primed\Http\HttpException;

final class UnitsTest extends TestCase
{
    /**
     * Shared cases: frontend/src/domain/units.cases.json (same file is used by the frontend tests).
     *
     * @return iterable<string, array{string, string, float, float|null, float|null, float}>
     */
    public static function cases(): iterable
    {
        $json = file_get_contents(__DIR__ . '/../../../frontend/src/domain/units.cases.json');
        self::assertIsString($json);
        $cases = json_decode($json, true, 8, JSON_THROW_ON_ERROR);
        self::assertIsArray($cases);
        foreach ($cases as $case) {
            self::assertIsArray($case);
            /** @var array{name: string, basis: string, unit: string, amount: float|int,
             *     packageAmount: float|int|null, pieceWeight: float|int|null, quantity: float|int} $case */
            yield $case['name'] => [
                $case['basis'],
                $case['unit'],
                (float) $case['amount'],
                $case['packageAmount'] === null ? null : (float) $case['packageAmount'],
                $case['pieceWeight'] === null ? null : (float) $case['pieceWeight'],
                (float) $case['quantity'],
            ];
        }
    }

    #[DataProvider('cases')]
    public function testConvertsLikeTheFrontend(
        string $basis,
        string $unit,
        float $amount,
        ?float $package,
        ?float $pieceWeight,
        float $expected,
    ): void {
        self::assertEqualsWithDelta(
            $expected,
            Units::toQuantity($basis, $unit, $amount, $package, $pieceWeight),
            0.001,
        );
    }

    public function testRejectsUnitsThatDoNotFitTheBasis(): void
    {
        $mismatches = [['per_100g', 'ml'], ['per_100ml', 'g'], ['per_unit', 'el'], ['per_100g', 'stueck']];
        foreach ($mismatches as [$basis, $unit]) {
            try {
                Units::toQuantity($basis, $unit, 1, null);
                self::fail("$basis/$unit accepted");
            } catch (HttpException $e) {
                self::assertSame(422, $e->status);
            }
        }
    }

    public function testPackageNeedsAPackageSize(): void
    {
        $this->expectException(HttpException::class);
        Units::toQuantity('per_100g', 'packung', 1, null);
    }

    public function testNutrientsPer100gAndPerPiece(): void
    {
        $quarkcreme = ['kcal' => 67.0, 'protein' => 12.4, 'carbs' => 3.2, 'sugar' => 2.6, 'fat' => 0.5];
        self::assertSame(
            ['kcal' => 134.0, 'protein' => 24.8, 'carbs' => 6.4, 'sugar' => 5.2, 'fat' => 1.0],
            Units::nutrients('per_100g', $quarkcreme, 200),
        );

        $bar = ['kcal' => 163.0, 'protein' => 23.0, 'carbs' => 12.0, 'sugar' => 1.2, 'fat' => 4.6];
        self::assertSame(
            ['kcal' => 326.0, 'protein' => 46.0, 'carbs' => 24.0, 'sugar' => 2.4, 'fat' => 9.2],
            Units::nutrients('per_unit', $bar, 2),
        );
    }
}

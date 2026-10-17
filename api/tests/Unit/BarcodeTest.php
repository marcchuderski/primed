<?php

declare(strict_types=1);

namespace Primed\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Primed\Food\Barcode;

final class BarcodeTest extends TestCase
{
    public function testValidCodes(): void
    {
        foreach (['4006381333931', '96385074', '036000291452', '4260173787214'] as $code) {
            self::assertTrue(Barcode::isValid($code), $code);
        }
    }

    public function testInvalidCodes(): void
    {
        $invalid = ['4006381333932', '123', 'abcdefghijklm', '4006381333931 ', "40063813\n33931", '1234567890'];
        foreach ($invalid as $code) {
            self::assertFalse(Barcode::isValid($code), $code);
        }
    }
}

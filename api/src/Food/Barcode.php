<?php

declare(strict_types=1);

namespace Primed\Food;

/**
 * GTIN validation (EAN-8, UPC-A, EAN-13, GTIN-14) including the check digit.
 */
final class Barcode
{
    public static function isValid(string $code): bool
    {
        if (preg_match('/^\d{8}$|^\d{12,14}$/', $code) !== 1) {
            return false;
        }
        $digits = array_map('intval', str_split($code));
        $check = array_pop($digits);
        $sum = 0;
        foreach (array_reverse($digits) as $i => $digit) {
            $sum += $digit * ($i % 2 === 0 ? 3 : 1);
        }

        return (10 - $sum % 10) % 10 === $check;
    }
}

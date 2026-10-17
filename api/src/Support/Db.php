<?php

declare(strict_types=1);

namespace Primed\Support;

use DateTimeImmutable;
use DateTimeZone;

/**
 * Conversions between PHP values and MariaDB DATETIME columns (always UTC).
 */
final class Db
{
    public static function dateTime(DateTimeImmutable $time): string
    {
        return $time->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s');
    }

    public static function dateTimeMs(DateTimeImmutable $time): string
    {
        return $time->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d H:i:s.v');
    }

    public static function parse(string $value): DateTimeImmutable
    {
        $parsed = new DateTimeImmutable($value, new DateTimeZone('UTC'));

        return $parsed;
    }
}

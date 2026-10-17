<?php

declare(strict_types=1);

namespace Primed\Day;

use DateTimeImmutable;
use DateTimeZone;
use Primed\Support\Clock;

/**
 * Maps wall-clock time (Europe/Berlin) to the logical day, which ends at the day boundary (default 02:00).
 */
final class LogicalCalendar
{
    public const TIMEZONE = 'Europe/Berlin';

    public function __construct(private readonly Clock $clock)
    {
    }

    /** Logical date (Y-m-d) for "now". */
    public function today(int $dayBoundaryMin): string
    {
        return self::logicalDate($this->clock->now(), $dayBoundaryMin);
    }

    public static function logicalDate(DateTimeImmutable $instant, int $dayBoundaryMin): string
    {
        return $instant
            ->setTimezone(new DateTimeZone(self::TIMEZONE))
            ->modify('-' . $dayBoundaryMin . ' minutes')
            ->format('Y-m-d');
    }

    public static function isValidDate(string $date): bool
    {
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) !== 1) {
            return false;
        }
        [$y, $m, $d] = array_map('intval', explode('-', $date));

        return checkdate($m, $d, $y) && $y >= 2000 && $y <= 2100;
    }

    /** ISO weekday 1 (Monday) … 7 (Sunday). */
    public static function weekday(string $date): int
    {
        return (int) (new DateTimeImmutable($date, new DateTimeZone(self::TIMEZONE)))->format('N');
    }
}

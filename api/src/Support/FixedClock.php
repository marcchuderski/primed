<?php

declare(strict_types=1);

namespace Primed\Support;

use DateTimeImmutable;
use DateTimeZone;

/**
 * Controllable clock for tests.
 */
final class FixedClock implements Clock
{
    private DateTimeImmutable $now;

    public function __construct(string $time = '2026-10-17 12:00:00')
    {
        $this->now = new DateTimeImmutable($time, new DateTimeZone('UTC'));
    }

    public function now(): DateTimeImmutable
    {
        return $this->now;
    }

    public function advance(string $modifier): void
    {
        $this->now = $this->now->modify($modifier);
    }
}

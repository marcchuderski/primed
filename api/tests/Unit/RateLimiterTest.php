<?php

declare(strict_types=1);

namespace Primed\Tests\Unit;

use DateTimeImmutable;
use DateTimeZone;
use PHPUnit\Framework\TestCase;
use Primed\Auth\LoginAttempt;
use Primed\Auth\RateLimiter;

final class RateLimiterTest extends TestCase
{
    private DateTimeImmutable $now;

    protected function setUp(): void
    {
        $this->now = new DateTimeImmutable('2026-10-17 12:00:00', new DateTimeZone('UTC'));
    }

    public function testAllowsWithoutHistory(): void
    {
        self::assertNull(RateLimiter::evaluate([], [], [], $this->now));
    }

    public function testFourPairFailuresAreAllowed(): void
    {
        $failures = $this->failures(4, secondsAgo: 60);
        self::assertNull(RateLimiter::evaluate($failures, $failures, $failures, $this->now));
    }

    public function testFifthPairFailureLocksForFifteenMinutesAfterLastFailure(): void
    {
        $failures = $this->failures(5, secondsAgo: 60);

        self::assertSame(900 - 60, RateLimiter::evaluate($failures, $failures, $failures, $this->now));
    }

    public function testSuccessResetsPairFailures(): void
    {
        $attempts = [...$this->failures(4, secondsAgo: 300), $this->attempt(200, true), ...$this->failures(4, 100)];

        self::assertNull(RateLimiter::evaluate($attempts, $attempts, $attempts, $this->now));
    }

    public function testUsernameFailuresFromManyIpsCauseGrowingDelayNotLock(): void
    {
        // 10 failures across different IPs: 1 s delay after the last one.
        $tenFailures = $this->failures(10, secondsAgo: 0);
        self::assertSame(1, RateLimiter::evaluate([], $tenFailures, [], $this->now));

        // 14 failures: 16 s delay; once it has passed the owner may try again.
        $fourteen = $this->failures(14, secondsAgo: 10);
        self::assertSame(6, RateLimiter::evaluate([], $fourteen, [], $this->now));
        $old = $this->failures(14, secondsAgo: 16);
        self::assertNull(RateLimiter::evaluate([], $old, [], $this->now));
    }

    public function testUsernameDelayIsCapped(): void
    {
        self::assertSame(60, RateLimiter::evaluate([], $this->failures(40, secondsAgo: 0), [], $this->now));
    }

    public function testIpLimitOfThirtyAttemptsPerHour(): void
    {
        $ip = [];
        for ($i = 29; $i >= 0; $i--) {
            $ip[] = $this->attempt(60 * ($i + 1), $i % 2 === 0);
        }
        // Oldest attempt was 30 min ago → window frees in 30 min.
        self::assertSame(1800, RateLimiter::evaluate([], [], $ip, $this->now));
        self::assertNull(RateLimiter::evaluate([], [], array_slice($ip, 1), $this->now));
    }

    /**
     * @return list<LoginAttempt>
     */
    private function failures(int $count, int $secondsAgo): array
    {
        $result = [];
        for ($i = $count - 1; $i >= 0; $i--) {
            $result[] = $this->attempt($secondsAgo + $i, false);
        }

        return $result;
    }

    private function attempt(int $secondsAgo, bool $success): LoginAttempt
    {
        return new LoginAttempt($this->now->modify("-{$secondsAgo} seconds"), $success);
    }
}

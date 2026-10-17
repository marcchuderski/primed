<?php

declare(strict_types=1);

namespace Primed\Auth;

use DateTimeImmutable;

/**
 * Login throttling (D-061). Pure decision logic over recorded attempts:
 *  - IP + username: 5 failures within 15 min (since the last success) → locked for 15 min after the last failure.
 *  - Username (all IPs): from 10 failures within 15 min, an increasing delay (1 s, 2 s, 4 s … max 60 s)
 *    instead of a hard lock, so nobody can lock the owner out.
 *  - IP: at most 30 attempts per hour.
 */
final class RateLimiter
{
    public const PAIR_WINDOW_SECONDS = 900;
    public const PAIR_MAX_FAILURES = 5;
    public const PAIR_LOCK_SECONDS = 900;
    public const USER_WINDOW_SECONDS = 900;
    public const USER_DELAY_FROM_FAILURES = 10;
    public const USER_MAX_DELAY_SECONDS = 60;
    public const IP_WINDOW_SECONDS = 3600;
    public const IP_MAX_ATTEMPTS = 30;

    public function __construct(private readonly LoginAttemptStore $store)
    {
    }

    /**
     * @return int|null seconds to wait, or null if the attempt is allowed
     */
    public function retryAfter(string $username, string $ipHash, DateTimeImmutable $now): ?int
    {
        return self::evaluate(
            $this->store->forPair($username, $ipHash, $now->modify('-' . self::PAIR_WINDOW_SECONDS . ' seconds')),
            $this->store->forUsername($username, $now->modify('-' . self::USER_WINDOW_SECONDS . ' seconds')),
            $this->store->forIp($ipHash, $now->modify('-' . self::IP_WINDOW_SECONDS . ' seconds')),
            $now,
        );
    }

    /**
     * @param list<LoginAttempt> $pair attempts for IP + username within the pair window, ascending
     * @param list<LoginAttempt> $user attempts for the username within the user window, ascending
     * @param list<LoginAttempt> $ip attempts for the IP within the IP window, ascending
     */
    public static function evaluate(array $pair, array $user, array $ip, DateTimeImmutable $now): ?int
    {
        $waits = [];

        $pairFailures = self::failuresSinceLastSuccess($pair);
        if (count($pairFailures) >= self::PAIR_MAX_FAILURES) {
            $waits[] = self::secondsUntil(end($pairFailures)->at, self::PAIR_LOCK_SECONDS, $now);
        }

        $userFailures = self::failuresSinceLastSuccess($user);
        $count = count($userFailures);
        if ($count >= self::USER_DELAY_FROM_FAILURES) {
            $delay = min(2 ** min($count - self::USER_DELAY_FROM_FAILURES, 10), self::USER_MAX_DELAY_SECONDS);
            $waits[] = self::secondsUntil(end($userFailures)->at, $delay, $now);
        }

        $ipCount = count($ip);
        if ($ipCount >= self::IP_MAX_ATTEMPTS) {
            // The window frees up when the oldest attempt that keeps us at the limit drops out.
            $blocking = $ip[$ipCount - self::IP_MAX_ATTEMPTS];
            $waits[] = self::secondsUntil($blocking->at, self::IP_WINDOW_SECONDS, $now);
        }

        $wait = $waits === [] ? 0 : max($waits);

        return $wait > 0 ? $wait : null;
    }

    /**
     * @param list<LoginAttempt> $attempts
     * @return list<LoginAttempt>
     */
    private static function failuresSinceLastSuccess(array $attempts): array
    {
        $failures = [];
        foreach ($attempts as $attempt) {
            $failures = $attempt->success ? [] : [...$failures, $attempt];
        }

        return $failures;
    }

    private static function secondsUntil(DateTimeImmutable $from, int $seconds, DateTimeImmutable $now): int
    {
        $until = $from->getTimestamp() + $seconds;

        return max(0, $until - $now->getTimestamp());
    }
}

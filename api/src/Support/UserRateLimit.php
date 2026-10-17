<?php

declare(strict_types=1);

namespace Primed\Support;

use PDO;
use Primed\Http\HttpException;

/**
 * Fixed-window rate limit per user and bucket (e.g. Open Food Facts lookups), stored in the database
 * so it holds across PHP workers.
 */
final class UserRateLimit
{
    public function __construct(private readonly PDO $pdo, private readonly Clock $clock)
    {
    }

    public function hit(int $userId, string $bucket, int $max, int $windowSeconds): void
    {
        $now = $this->clock->now();
        $windowStart = Db::dateTime($now->modify('-' . $windowSeconds . ' seconds'));
        $this->pdo->prepare(
            'INSERT INTO rate_limits (user_id, bucket, window_start, hits) VALUES (?, ?, ?, 1)
             ON DUPLICATE KEY UPDATE
                 hits = IF(window_start < ?, 1, hits + 1),
                 window_start = IF(window_start < ?, VALUES(window_start), window_start)',
        )->execute([$userId, $bucket, Db::dateTime($now), $windowStart, $windowStart]);

        $statement = $this->pdo->prepare('SELECT hits FROM rate_limits WHERE user_id = ? AND bucket = ?');
        $statement->execute([$userId, $bucket]);
        if ((int) $statement->fetchColumn() > $max) {
            throw new HttpException(
                429,
                'too_many_requests',
                'Zu viele Anfragen in kurzer Zeit. Bitte warte einen Moment.',
                ['Retry-After' => (string) $windowSeconds],
            );
        }
    }
}

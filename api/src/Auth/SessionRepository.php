<?php

declare(strict_types=1);

namespace Primed\Auth;

use DateTimeImmutable;
use PDO;
use Primed\Support\Db;
use Primed\Support\Row;

final class SessionRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function create(
        int $userId,
        string $tokenHash,
        DateTimeImmutable $now,
        DateTimeImmutable $expiresAt,
        DateTimeImmutable $absoluteExpiresAt,
    ): int {
        $this->pdo->prepare(
            'INSERT INTO sessions (user_id, token_hash, created_at, last_seen_at, expires_at, absolute_expires_at)
             VALUES (?, ?, ?, ?, ?, ?)',
        )->execute([
            $userId,
            $tokenHash,
            Db::dateTime($now),
            Db::dateTime($now),
            Db::dateTime($expiresAt),
            Db::dateTime($absoluteExpiresAt),
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    /**
     * Returns the session only if it is neither revoked nor expired (idle or absolute).
     */
    public function findActive(string $tokenHash, DateTimeImmutable $now): ?Session
    {
        $statement = $this->pdo->prepare(
            'SELECT id, user_id, token_hash, last_seen_at, expires_at, absolute_expires_at
               FROM sessions
              WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ? AND absolute_expires_at > ?',
        );
        $nowDb = Db::dateTime($now);
        $statement->execute([$tokenHash, $nowDb, $nowDb]);
        $row = $statement->fetch();
        if (!is_array($row)) {
            return null;
        }

        return new Session(
            Row::int($row, 'id'),
            Row::int($row, 'user_id'),
            Row::string($row, 'token_hash'),
            Db::parse(Row::string($row, 'last_seen_at')),
            Db::parse(Row::string($row, 'expires_at')),
            Db::parse(Row::string($row, 'absolute_expires_at')),
        );
    }

    public function touch(int $sessionId, DateTimeImmutable $now, DateTimeImmutable $expiresAt): void
    {
        $this->pdo->prepare('UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE id = ?')
            ->execute([Db::dateTime($now), Db::dateTime($expiresAt), $sessionId]);
    }

    public function revoke(int $sessionId, DateTimeImmutable $now): void
    {
        $this->pdo->prepare('UPDATE sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL')
            ->execute([Db::dateTime($now), $sessionId]);
    }

    public function revokeAllForUser(int $userId, DateTimeImmutable $now, ?int $exceptSessionId = null): void
    {
        $this->pdo->prepare(
            'UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL AND id <> ?',
        )->execute([Db::dateTime($now), $userId, $exceptSessionId ?? 0]);
    }

    /** Deletes sessions that ended (expired or revoked) before $before (retention, SECURITY.md). */
    public function purgeEndedBefore(DateTimeImmutable $before): void
    {
        $limit = Db::dateTime($before);
        $this->pdo->prepare(
            'DELETE FROM sessions WHERE expires_at < ? OR absolute_expires_at < ? OR revoked_at < ?',
        )->execute([$limit, $limit, $limit]);
    }
}

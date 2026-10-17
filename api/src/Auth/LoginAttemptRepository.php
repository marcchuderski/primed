<?php

declare(strict_types=1);

namespace Primed\Auth;

use DateTimeImmutable;
use PDO;
use Primed\Support\Db;
use Primed\Support\Row;

final class LoginAttemptRepository implements LoginAttemptStore
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function record(string $username, string $ipHash, bool $success, DateTimeImmutable $at): void
    {
        $this->pdo->prepare(
            'INSERT INTO login_attempts (username, ip_hash, attempted_at, success) VALUES (?, ?, ?, ?)',
        )->execute([mb_substr($username, 0, 64, 'UTF-8'), $ipHash, Db::dateTimeMs($at), $success ? 1 : 0]);
    }

    public function forPair(string $username, string $ipHash, DateTimeImmutable $since): array
    {
        return $this->fetch(
            'SELECT attempted_at, success FROM login_attempts
              WHERE username = ? AND ip_hash = ? AND attempted_at >= ? ORDER BY attempted_at, id',
            [$username, $ipHash, Db::dateTimeMs($since)],
        );
    }

    public function forUsername(string $username, DateTimeImmutable $since): array
    {
        return $this->fetch(
            'SELECT attempted_at, success FROM login_attempts
              WHERE username = ? AND attempted_at >= ? ORDER BY attempted_at, id',
            [$username, Db::dateTimeMs($since)],
        );
    }

    public function forIp(string $ipHash, DateTimeImmutable $since): array
    {
        return $this->fetch(
            'SELECT attempted_at, success FROM login_attempts
              WHERE ip_hash = ? AND attempted_at >= ? ORDER BY attempted_at, id',
            [$ipHash, Db::dateTimeMs($since)],
        );
    }

    public function purgeBefore(DateTimeImmutable $before): void
    {
        $this->pdo->prepare('DELETE FROM login_attempts WHERE attempted_at < ?')->execute([Db::dateTimeMs($before)]);
    }

    /**
     * @param list<string> $params
     * @return list<LoginAttempt>
     */
    private function fetch(string $sql, array $params): array
    {
        $statement = $this->pdo->prepare($sql);
        $statement->execute($params);

        $attempts = [];
        foreach ($statement->fetchAll() as $row) {
            if (is_array($row)) {
                $attempts[] = new LoginAttempt(
                    Db::parse(Row::string($row, 'attempted_at')),
                    Row::int($row, 'success') === 1,
                );
            }
        }

        return $attempts;
    }
}

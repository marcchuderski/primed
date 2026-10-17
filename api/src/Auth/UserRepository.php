<?php

declare(strict_types=1);

namespace Primed\Auth;

use DateTimeImmutable;
use PDO;
use Primed\Support\Db;
use Primed\Support\Row;

final class UserRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function findByUsername(string $normalizedUsername): ?User
    {
        $statement = $this->pdo->prepare(
            'SELECT id, username, display_name, password_hash FROM users WHERE username = ?',
        );
        $statement->execute([$normalizedUsername]);

        return self::hydrate($statement->fetch());
    }

    public function findById(int $id): ?User
    {
        $statement = $this->pdo->prepare('SELECT id, username, display_name, password_hash FROM users WHERE id = ?');
        $statement->execute([$id]);

        return self::hydrate($statement->fetch());
    }

    public function create(string $username, string $displayName, string $passwordHash, DateTimeImmutable $now): int
    {
        $this->pdo->prepare(
            'INSERT INTO users (username, display_name, password_hash, password_changed_at, created_at)
             VALUES (?, ?, ?, ?, ?)',
        )->execute([$username, $displayName, $passwordHash, Db::dateTime($now), Db::dateTime($now)]);
        $id = (int) $this->pdo->lastInsertId();

        $this->pdo->prepare('INSERT INTO user_settings (user_id, updated_at) VALUES (?, ?)')
            ->execute([$id, Db::dateTime($now)]);

        return $id;
    }

    public function updatePasswordHash(int $userId, string $passwordHash, ?DateTimeImmutable $changedAt): void
    {
        if ($changedAt === null) {
            // Transparent rehash: the password itself did not change.
            $this->pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$passwordHash, $userId]);

            return;
        }

        $this->pdo->prepare('UPDATE users SET password_hash = ?, password_changed_at = ? WHERE id = ?')
            ->execute([$passwordHash, Db::dateTime($changedAt), $userId]);
    }

    public function updateProfile(int $userId, string $displayName, string $username): void
    {
        $this->pdo->prepare('UPDATE users SET display_name = ?, username = ? WHERE id = ?')
            ->execute([$displayName, $username, $userId]);
    }

    /**
     * Deletes the user and, via ON DELETE CASCADE, all their data. The week template goes first
     * because it restricts deleting day types, which would otherwise abort the cascade.
     */
    public function delete(int $userId): void
    {
        $this->pdo->beginTransaction();
        try {
            $this->pdo->prepare('DELETE FROM week_template WHERE user_id = ?')->execute([$userId]);
            $this->pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$userId]);
            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    private static function hydrate(mixed $row): ?User
    {
        if (!is_array($row)) {
            return null;
        }

        return new User(
            Row::int($row, 'id'),
            Row::string($row, 'username'),
            Row::string($row, 'display_name'),
            Row::string($row, 'password_hash'),
        );
    }
}

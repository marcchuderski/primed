<?php

declare(strict_types=1);

namespace Primed\Tests\Integration;

use PDO;
use PDOException;
use Primed\Database\Migrator;

final class MigratorTest extends DatabaseTestCase
{
    public function testMigratesFreshDatabaseAndIsIdempotent(): void
    {
        $pdo = self::freshDatabase();
        $migrator = new Migrator($pdo, __DIR__ . '/../../migrations');

        $applied = $migrator->migrate();
        self::assertContains('001_init', $applied);
        self::assertSame([], $migrator->migrate());
        self::assertSame(array_keys($migrator->availableVersions()), $migrator->appliedVersions());
    }

    public function testSchemaConstraints(): void
    {
        $pdo = self::freshDatabase();
        (new Migrator($pdo, __DIR__ . '/../../migrations'))->migrate();

        $insertUser = $pdo->prepare(
            'INSERT INTO users (username, display_name, password_hash, password_changed_at, created_at)
             VALUES (?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())',
        );
        $insertUser->execute(['marcch', 'Marc', 'hash']);
        $userId = (int) $pdo->lastInsertId();

        // Username is unique.
        try {
            $insertUser->execute(['marcch', 'Other', 'hash']);
            self::fail('Duplicate username accepted');
        } catch (PDOException $e) {
            self::assertSame('23000', $e->getCode());
        }

        // Sessions and settings are removed with the user.
        $pdo->prepare(
            'INSERT INTO sessions (user_id, token_hash, created_at, last_seen_at, expires_at, absolute_expires_at)
             VALUES (?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP(), UTC_TIMESTAMP(), UTC_TIMESTAMP())',
        )->execute([$userId, random_bytes(32)]);
        $pdo->prepare('INSERT INTO user_settings (user_id, updated_at) VALUES (?, UTC_TIMESTAMP())')
            ->execute([$userId]);

        $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$userId]);

        self::assertSame(0, self::rowCount($pdo, 'sessions'));
        self::assertSame(0, self::rowCount($pdo, 'user_settings'));
    }

    private static function rowCount(PDO $pdo, string $table): int
    {
        $statement = $pdo->query('SELECT COUNT(*) FROM ' . $table);
        self::assertNotFalse($statement);

        return (int) $statement->fetchColumn();
    }
}

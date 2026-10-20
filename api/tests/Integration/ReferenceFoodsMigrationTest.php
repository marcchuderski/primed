<?php

declare(strict_types=1);

namespace Primed\Tests\Integration;

use PDO;
use Primed\Database\Migrator;

/**
 * Migration 015 (D-170) on a database in the state before it: the shared list is filled, the start milks are
 * linked to their reference values, every other row stays as it was.
 */
final class ReferenceFoodsMigrationTest extends DatabaseTestCase
{
    public function testFillsTheListAndOnlyLinksTheStartMilk(): void
    {
        $pdo = self::freshDatabase();
        $before = sys_get_temp_dir() . '/primed-migrations-' . bin2hex(random_bytes(4));
        mkdir($before);
        $files = glob(__DIR__ . '/../../migrations/0*.sql');
        self::assertNotFalse($files);
        foreach ($files as $file) {
            if (basename($file) < '015') {
                copy($file, $before . '/' . basename($file));
            }
        }
        (new Migrator($pdo, $before))->migrate();
        $copies = glob($before . '/*.sql');
        self::assertNotFalse($copies);
        array_map('unlink', $copies);
        rmdir($before);

        $pdo->exec("INSERT INTO users (username, display_name, password_hash, password_changed_at, created_at)
                    VALUES ('marcch', 'Marc', 'x', UTC_TIMESTAMP(), UTC_TIMESTAMP())");
        $userId = (int) $pdo->lastInsertId();
        $food = $pdo->prepare(
            "INSERT INTO foods (user_id, type, name, category, basis, kcal, protein, carbs, sugar, fat, source,
                                system_key, created_at, updated_at)
             VALUES (?, ?, ?, 'drinks', 'per_100ml', 1, 1, 1, 1, 1, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())",
        );
        $food->execute([$userId, 'reference', 'Milch 1,5 %', 'seed', 'milk_low']);
        $food->execute([$userId, 'product', 'Banane', 'manual', null]); // own food with a reference name
        $snapshot = static function () use ($pdo): array {
            // Category left out: later migrations (016) re-sort categories.
            $rows = $pdo->query('SELECT id, type, name, basis, kcal, source, deleted_at FROM foods ORDER BY id');
            self::assertNotFalse($rows);

            return $rows->fetchAll(PDO::FETCH_ASSOC);
        };
        $beforeRows = $snapshot();

        $applied = (new Migrator($pdo, __DIR__ . '/../../migrations'))->migrate();
        self::assertSame('015_reference_foods', $applied[0] ?? null);

        self::assertSame($beforeRows, $snapshot(), 'no food row changes apart from the link');
        $links = $pdo->query('SELECT f.name, r.name AS ref FROM foods f
                              LEFT JOIN reference_foods r ON r.id = f.reference_food_id ORDER BY f.id');
        self::assertNotFalse($links);
        self::assertSame([['Milch 1,5 %', 'Milch 1,5 %'], ['Banane', null]], $links->fetchAll(PDO::FETCH_NUM));

        $count = $pdo->query('SELECT COUNT(*) FROM reference_foods');
        self::assertNotFalse($count);
        self::assertSame(110, (int) $count->fetchColumn());
        $bad = $pdo->query('SELECT COUNT(*) FROM reference_foods WHERE sugar > carbs OR kcal <= 0
                            OR (piece_weight IS NOT NULL AND piece_weight <= 0)');
        self::assertNotFalse($bad);
        self::assertSame(0, (int) $bad->fetchColumn());
    }
}

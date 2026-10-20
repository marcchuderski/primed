<?php

declare(strict_types=1);

namespace Primed\Tests\Integration;

use Primed\Database\Migrator;

/**
 * Migration 014 (D-165) on a database in the state before it: only the start protein powder still in "drinks"
 * moves to Supplements; nothing else changes and no row is lost.
 */
final class SupplementsMigrationTest extends DatabaseTestCase
{
    public function testMovesOnlyTheUntouchedStartPowder(): void
    {
        $pdo = self::freshDatabase();
        $before = sys_get_temp_dir() . '/primed-migrations-' . bin2hex(random_bytes(4));
        mkdir($before);
        $files = glob(__DIR__ . '/../../migrations/0*.sql');
        self::assertNotFalse($files);
        foreach ($files as $file) {
            if (basename($file) < '014') {
                copy($file, $before . '/' . basename($file));
            }
        }
        (new Migrator($pdo, $before))->migrate();
        $copies = glob($before . '/*.sql');
        self::assertNotFalse($copies);
        array_map('unlink', $copies);
        rmdir($before);

        $user = $pdo->prepare("INSERT INTO users (username, display_name, password_hash, password_changed_at,
                                                  created_at)
                               VALUES (?, 'X', 'x', UTC_TIMESTAMP(), UTC_TIMESTAMP())");
        $food = $pdo->prepare(
            "INSERT INTO foods (user_id, type, name, barcode, category, basis, kcal, protein, carbs, sugar, fat,
                                source, created_at, updated_at)
             VALUES (?, 'product', ?, ?, ?, 'per_100g', 1, 1, 1, 1, 1, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())",
        );
        $rows = [
            // user, name, barcode, category, source
            ['a', 'ESN Designer Whey Milk Chocolate', '4250519647234', 'drinks', 'seed'],
            ['a', 'Skyr Drink', null, 'drinks', 'manual'],
            ['b', 'ESN Designer Whey Milk Chocolate', '4250519647234', 'snacks', 'seed'], // moved by the user
            ['c', 'Mein Whey', '4250519647234', 'drinks', 'off'],
        ];
        $users = [];
        foreach ($rows as [$name, $foodName, $barcode, $category, $source]) {
            if (!isset($users[$name])) {
                $user->execute([$name]);
                $users[$name] = (int) $pdo->lastInsertId();
            }
            $food->execute([$users[$name], $foodName, $barcode, $category, $source]);
        }

        $applied = (new Migrator($pdo, __DIR__ . '/../../migrations'))->migrate();
        self::assertSame('014_supplements_meals', $applied[0] ?? null);

        $result = $pdo->query('SELECT u.username, f.name, f.category FROM foods f JOIN users u ON u.id = f.user_id
                               ORDER BY u.username, f.name');
        self::assertNotFalse($result);
        self::assertSame([
            ['a', 'ESN Designer Whey Milk Chocolate', 'supplements'],
            ['a', 'Skyr Drink', 'drinks'],
            ['b', 'ESN Designer Whey Milk Chocolate', 'snacks'],
            ['c', 'Mein Whey', 'drinks'],
        ], $result->fetchAll(\PDO::FETCH_NUM));
    }
}

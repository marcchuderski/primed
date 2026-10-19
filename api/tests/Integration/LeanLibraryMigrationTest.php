<?php

declare(strict_types=1);

namespace Primed\Tests\Integration;

use PDO;
use Primed\Database\Migrator;

/**
 * Migration 012 (D-159) on a database in the state before it: standard foods go, own foods, milk and the chosen
 * protein powder stay; nothing is hard-deleted.
 */
final class LeanLibraryMigrationTest extends DatabaseTestCase
{
    public function testRemovesStandardFoodsAndKeepsOwnOnes(): void
    {
        $pdo = self::freshDatabase();
        $before = sys_get_temp_dir() . '/primed-migrations-' . bin2hex(random_bytes(4));
        mkdir($before);
        $files = glob(__DIR__ . '/../../migrations/0*.sql');
        self::assertNotFalse($files);
        foreach ($files as $file) {
            if (basename($file) < '012') {
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
                                created_at, updated_at)
             VALUES (?, ?, ?, 'basics', 'per_100g', 1, 1, 1, 1, 1, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())",
        );
        $rows = [
            'Milch 1,5 %' => ['reference', 'seed'],
            'Milch 3,5 %' => ['reference', 'seed'],
            'ESN Designer Whey Milk Chocolate' => ['product', 'seed'],
            'Zwiebel' => ['reference', 'bls'],
            'Banane' => ['reference', 'bls'],
            'Magerquark' => ['reference', 'bls'],
            'REWE Quarkcreme' => ['product', 'seed'],
            'Lidl Chicken Nuggets' => ['product', 'seed'],
            'Frites de Luxe' => ['product', 'manual'],
            'HighProtein Skyr Drink Erdbeere' => ['product', 'off'],
        ];
        $ids = [];
        foreach ($rows as $name => [$type, $source]) {
            $food->execute([$userId, $type, $name, $source]);
            $ids[$name] = (int) $pdo->lastInsertId();
        }
        $idOf = static fn (string $name): int => $ids[$name] ?? throw new \LogicException($name);
        // Someone chose Magerquark as protein powder: it must survive.
        $pdo->prepare('INSERT INTO user_settings (user_id, protein_powder_food_id, updated_at)
                       VALUES (?, ?, UTC_TIMESTAMP())')->execute([$userId, $idOf('Magerquark')]);
        // An entry with the banana keeps its snapshot.
        $pdo->prepare("INSERT INTO entries (user_id, date, time_min, kind, food_id, name_snapshot, amount, unit,
                              quantity, kcal, protein, carbs, sugar, fat, created_at, updated_at)
                       VALUES (?, '2026-10-19', 540, 'food', ?, 'Banane', 120, 'g', 120, 95, 2, 19, 17, 1,
                               UTC_TIMESTAMP(), UTC_TIMESTAMP())")->execute([$userId, $idOf('Banane')]);

        self::assertSame(['012_lean_library'], (new Migrator($pdo, __DIR__ . '/../../migrations'))->migrate());

        $active = $pdo->query('SELECT name FROM foods WHERE deleted_at IS NULL ORDER BY name');
        self::assertNotFalse($active);
        self::assertSame([
            'ESN Designer Whey Milk Chocolate',
            'Frites de Luxe',
            'HighProtein Skyr Drink Erdbeere',
            'Magerquark',
            'Milch 1,5 %',
            'Milch 3,5 %',
        ], $active->fetchAll(PDO::FETCH_COLUMN));
        $all = $pdo->query('SELECT COUNT(*) FROM foods');
        self::assertNotFalse($all);
        self::assertEquals(10, $all->fetchColumn(), 'soft delete only');

        $keys = $pdo->query("SELECT name, system_key FROM foods WHERE system_key IS NOT NULL ORDER BY name");
        self::assertNotFalse($keys);
        self::assertSame(
            ['Milch 1,5 %' => 'milk_low', 'Milch 3,5 %' => 'milk_high'],
            $keys->fetchAll(PDO::FETCH_KEY_PAIR),
        );

        $entry = $pdo->query('SELECT name_snapshot, kcal, food_id FROM entries');
        self::assertNotFalse($entry);
        $row = $entry->fetch(PDO::FETCH_ASSOC);
        self::assertIsArray($row);
        self::assertSame('Banane', $row['name_snapshot']);
        self::assertEquals($idOf('Banane'), $row['food_id']);
    }
}

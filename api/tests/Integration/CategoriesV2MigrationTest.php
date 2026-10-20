<?php

declare(strict_types=1);

namespace Primed\Tests\Integration;

use PDO;
use Primed\Database\Migrator;

/**
 * Migration 016 (D-172) on a database in the state before it: bread → grains, the former BLS start values move
 * by name, other basics → other, start milk → dairy; own rows keep their category, nothing is lost.
 */
final class CategoriesV2MigrationTest extends DatabaseTestCase
{
    public function testMovesCategoriesAndKeepsOwnChoices(): void
    {
        $pdo = self::freshDatabase();
        $before = sys_get_temp_dir() . '/primed-migrations-' . bin2hex(random_bytes(4));
        mkdir($before);
        $files = glob(__DIR__ . '/../../migrations/0*.sql');
        self::assertNotFalse($files);
        foreach ($files as $file) {
            if (basename($file) < '016') {
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
                                system_key, deleted_at, created_at, updated_at)
             VALUES (?, 'reference', ?, ?, 'per_100g', 1, 1, 1, 1, 1, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())",
        );
        $rows = [
            // name, category before, source, system key, deleted
            ['Hähnchenbrust, roh', 'basics', 'bls', null, true],
            ['Ei (Hühnerei), roh', 'basics', 'bls', null, true],
            ['Reis, roh', 'basics', 'bls', null, false],
            ['Olivenöl', 'basics', 'bls', null, false],
            ['Mein Müsli', 'basics', 'manual', null, false],
            ['Reis, roh', 'basics', 'manual', null, false], // own row with a start name
            ['Bäckerbrötchen (Weizen)', 'bread', 'bls', null, false],
            ['Dinkelbrötchen', 'bread', 'off', null, false],
            ['Milch 1,5 %', 'drinks', 'seed', 'milk_low', false],
            ['Milch 3,5 %', 'snacks', 'seed', 'milk_high', false], // moved by the user
            ['Hafermilch', 'drinks', 'manual', null, false],
        ];
        foreach ($rows as [$name, $category, $source, $key, $deleted]) {
            $food->execute([$userId, $name, $category, $source, $key, $deleted ? '2026-10-19 10:00:00' : null]);
        }
        $pdo->exec("INSERT INTO off_cache (cache_key, payload, fetched_at)
                    VALUES ('barcode:1', '{\"category\":\"bread\"}', UTC_TIMESTAMP())");

        $applied = (new Migrator($pdo, __DIR__ . '/../../migrations'))->migrate();
        self::assertSame('016_categories_v2', $applied[0] ?? null);

        $result = $pdo->query('SELECT name, source, category FROM foods ORDER BY id');
        self::assertNotFalse($result);
        self::assertSame([
            ['Hähnchenbrust, roh', 'bls', 'meat'],
            ['Ei (Hühnerei), roh', 'bls', 'meat'],
            ['Reis, roh', 'bls', 'grains'],
            ['Olivenöl', 'bls', 'sauces'],
            ['Mein Müsli', 'manual', 'other'],
            ['Reis, roh', 'manual', 'other'],
            ['Bäckerbrötchen (Weizen)', 'bls', 'grains'],
            ['Dinkelbrötchen', 'off', 'grains'],
            ['Milch 1,5 %', 'seed', 'dairy'],
            ['Milch 3,5 %', 'seed', 'snacks'],
            ['Hafermilch', 'manual', 'drinks'],
        ], $result->fetchAll(PDO::FETCH_NUM));

        $references = $pdo->query("SELECT name, category FROM reference_foods
                                   WHERE name IN ('Weizenbrötchen', 'Berliner', 'Ei', 'Milch 1,5 %', 'Kefir')
                                   ORDER BY name");
        self::assertNotFalse($references);
        self::assertSame([
            ['Berliner', 'snacks'],
            ['Ei', 'meat'],
            ['Kefir', 'dairy'],
            ['Milch 1,5 %', 'dairy'],
            ['Weizenbrötchen', 'grains'],
        ], $references->fetchAll(PDO::FETCH_NUM));
        $sweet = $pdo->query("SELECT COUNT(*) FROM reference_foods WHERE category = 'snacks'");
        self::assertNotFalse($sweet);
        self::assertSame(15, (int) $sweet->fetchColumn());

        $cache = $pdo->query('SELECT COUNT(*) FROM off_cache');
        self::assertNotFalse($cache);
        self::assertSame(0, (int) $cache->fetchColumn());
    }
}

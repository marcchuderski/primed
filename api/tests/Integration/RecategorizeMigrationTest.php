<?php

declare(strict_types=1);

namespace Primed\Tests\Integration;

use PDO;
use Primed\Database\Migrator;

/**
 * Migration 017 (D-173): moves only rows that still have the expected source and category.
 */
final class RecategorizeMigrationTest extends DatabaseTestCase
{
    public function testMovesOnlyMatchingRows(): void
    {
        $pdo = self::freshDatabase();
        $before = sys_get_temp_dir() . '/primed-migrations-' . bin2hex(random_bytes(4));
        mkdir($before);
        $files = glob(__DIR__ . '/../../migrations/0*.sql');
        self::assertNotFalse($files);
        foreach ($files as $file) {
            if (basename($file) < '017') {
                copy($file, $before . '/' . basename($file));
            }
        }
        (new Migrator($pdo, $before))->migrate();
        $copies = glob($before . '/*.sql');
        self::assertNotFalse($copies);
        array_map('unlink', $copies);
        rmdir($before);

        $pdo->exec("INSERT INTO users (username, display_name, password_hash, password_changed_at, created_at)
                    VALUES ('a', 'A', 'x', UTC_TIMESTAMP(), UTC_TIMESTAMP()), ('b', 'B', 'x', UTC_TIMESTAMP(),
                    UTC_TIMESTAMP())");
        $food = $pdo->prepare(
            "INSERT INTO foods (user_id, type, name, barcode, category, basis, kcal, protein, carbs, sugar, fat,
                                source, created_at, updated_at)
             VALUES (?, 'product', ?, ?, ?, 'per_100g', 1, 1, 1, 1, 1, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())",
        );
        $rows = [
            [1, 'Eier', '4061458234696', 'snacks', 'off'],
            [1, 'Mischbrot', '9010158009559', 'snacks', 'off'],
            [1, 'Sachsen Milch', '4025839043154', 'drinks', 'off'],
            [1, 'Gebratener Reis mit Hähnchenbrust', null, 'snacks', 'manual'],
            [2, 'Eier', '4061458234696', 'other', 'off'], // moved by the user: stays
            [2, 'Gebratener Reis mit Hähnchenbrust', null, 'snacks', 'off'], // other source: stays
            [2, 'Honigtorte', null, 'snacks', 'manual'],
        ];
        foreach ($rows as [$user, $name, $barcode, $category, $source]) {
            $food->execute([$user, $name, $barcode, $category, $source]);
        }

        $applied = (new Migrator($pdo, __DIR__ . '/../../migrations'))->migrate();
        self::assertSame('017_recategorize_library', $applied[0] ?? null);

        $result = $pdo->query('SELECT name, category FROM foods ORDER BY id');
        self::assertNotFalse($result);
        self::assertSame([
            ['Eier', 'meat'],
            ['Mischbrot', 'grains'],
            ['Sachsen Milch', 'dairy'],
            ['Gebratener Reis mit Hähnchenbrust', 'meals'],
            ['Eier', 'other'],
            ['Gebratener Reis mit Hähnchenbrust', 'snacks'],
            ['Honigtorte', 'snacks'],
        ], $result->fetchAll(PDO::FETCH_NUM));
    }
}

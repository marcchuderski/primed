<?php

declare(strict_types=1);

namespace Primed\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Primed\Database\Migrator;

final class MigratorStatementsTest extends TestCase
{
    public function testSplitsStatementsAndDropsCommentLines(): void
    {
        $sql = "-- header; with semicolon\nCREATE TABLE a (\n  id INT -- inline\n);\n\n"
            . "  -- note\nINSERT INTO a VALUES (1);";

        self::assertSame(
            ["CREATE TABLE a (\n  id INT -- inline\n)", 'INSERT INTO a VALUES (1)'],
            Migrator::statements($sql),
        );
    }

    public function testInitMigrationParsesIntoExpectedStatements(): void
    {
        $sql = (string) file_get_contents(__DIR__ . '/../../migrations/001_init.sql');
        $statements = Migrator::statements($sql);

        self::assertCount(6, $statements);
        self::assertStringStartsWith('INSERT INTO schema_migrations', $statements[5]);
    }
}

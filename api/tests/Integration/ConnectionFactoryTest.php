<?php

declare(strict_types=1);

namespace Primed\Tests\Integration;

use PDO;

final class ConnectionFactoryTest extends DatabaseTestCase
{
    public function testConnectionUsesSafeDefaults(): void
    {
        $pdo = self::connect();

        self::assertSame(PDO::ERRMODE_EXCEPTION, $pdo->getAttribute(PDO::ATTR_ERRMODE));
        self::assertFalse($pdo->getAttribute(PDO::ATTR_EMULATE_PREPARES));

        $statement = $pdo->query(
            'SELECT @@session.time_zone AS tz, @@session.sql_mode AS mode, @@character_set_connection AS cs',
        );
        self::assertNotFalse($statement);
        $row = $statement->fetch();
        self::assertIsArray($row);
        self::assertSame('+00:00', $row['tz']);
        self::assertIsString($row['mode']);
        self::assertStringContainsString('STRICT_ALL_TABLES', $row['mode']);
        self::assertSame('utf8mb4', $row['cs']);
    }

    public function testServerIsMariaDb1011(): void
    {
        $statement = self::connect()->query('SELECT VERSION()');
        self::assertNotFalse($statement);
        $version = $statement->fetchColumn();

        self::assertIsString($version);
        self::assertStringStartsWith('10.11.', $version);
        self::assertStringContainsString('MariaDB', $version);
    }
}

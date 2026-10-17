<?php

declare(strict_types=1);

namespace Primed\Tests\Integration;

use PDO;
use PDOException;
use PHPUnit\Framework\TestCase;
use Primed\Config\Config;
use Primed\Config\ConfigException;
use Primed\Database\ConnectionFactory;

/**
 * Base class for tests against the DDEV test database (DB_TEST_NAME). Skipped if unreachable.
 */
abstract class DatabaseTestCase extends TestCase
{
    protected static function connect(): PDO
    {
        try {
            // Outside DDEV an optional .env.testing (not committed) may point to another test DB.
            $testing = __DIR__ . '/../../.env.testing';
            $useTesting = getenv('IS_DDEV_PROJECT') !== 'true' && is_file($testing);
            $config = Config::fromEnvFile($useTesting ? $testing : __DIR__ . '/../../.env');
            $testDb = $config->string('DB_TEST_NAME');
            $pdo = ConnectionFactory::create($config, $testDb);
        } catch (ConfigException | PDOException) {
            self::markTestSkipped('Test database not reachable; run inside DDEV (ddev composer test).');
        }

        return $pdo;
    }

    /**
     * Drops every table in the test database and returns a connection to it.
     */
    protected static function freshDatabase(): PDO
    {
        $pdo = self::connect();
        $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
        $tables = $pdo->query('SHOW TABLES');
        self::assertNotFalse($tables);
        foreach ($tables->fetchAll(PDO::FETCH_COLUMN) as $table) {
            self::assertIsString($table);
            self::assertMatchesRegularExpression('/^[a-z_]+$/', $table);
            $pdo->exec('DROP TABLE `' . $table . '`');
        }
        $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');

        return $pdo;
    }
}

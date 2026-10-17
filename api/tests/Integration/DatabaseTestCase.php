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
 * Base class for tests against the DDEV test database (DB_TEST_NAME). Skipped outside DDEV.
 */
abstract class DatabaseTestCase extends TestCase
{
    protected static function connect(): PDO
    {
        try {
            $config = Config::fromEnvFile(__DIR__ . '/../../.env');
            $testDb = $config->string('DB_TEST_NAME');
            $pdo = ConnectionFactory::create($config, $testDb);
        } catch (ConfigException | PDOException) {
            self::markTestSkipped('Test database not reachable; run inside DDEV (ddev composer test).');
        }

        return $pdo;
    }
}

<?php

declare(strict_types=1);

namespace Primed\Database;

use PDO;
use Primed\Config\Config;

final class ConnectionFactory
{
    public static function create(Config $config, ?string $databaseName = null): PDO
    {
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            $config->string('DB_HOST'),
            $config->int('DB_PORT', 3306),
            $databaseName ?? $config->string('DB_NAME'),
        );

        $pdo = new PDO($dsn, $config->string('DB_USER'), $config->string('DB_PASS'), [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_STRINGIFY_FETCHES => false,
        ]);
        // All timestamps are stored in UTC; conversion to Europe/Berlin happens in the application.
        $pdo->exec(
            "SET time_zone = '+00:00', "
            . "sql_mode = 'STRICT_ALL_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'",
        );

        return $pdo;
    }
}

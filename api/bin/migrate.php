<?php

declare(strict_types=1);

// Applies pending migrations. Usage: php bin/migrate.php [--test]   (--test: use DB_TEST_NAME)

use Primed\Config\Config;
use Primed\Database\ConnectionFactory;
use Primed\Cli\Console;
use Primed\Database\Migrator;

if (PHP_SAPI !== 'cli') {
    exit(1);
}

require __DIR__ . '/../vendor/autoload.php';

$config = Config::fromEnvFile(__DIR__ . '/../.env');
$database = Console::hasFlag('--test') ? $config->string('DB_TEST_NAME') : null;
$migrator = new Migrator(ConnectionFactory::create($config, $database), __DIR__ . '/../migrations');

$applied = $migrator->migrate();
fwrite(STDOUT, $applied === [] ? "Nothing to migrate.\n" : 'Applied: ' . implode(', ', $applied) . "\n");

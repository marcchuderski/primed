<?php

declare(strict_types=1);

use Primed\Config\Config;
use Primed\Kernel;

// Lives outside the web root (production: primed-app/bootstrap.php, next to .env, src/, vendor/).

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

set_error_handler(static function (int $severity, string $message, string $file, int $line): bool {
    if ((error_reporting() & $severity) === 0) {
        return false;
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});

require __DIR__ . '/vendor/autoload.php';

date_default_timezone_set('Europe/Berlin');

return Kernel::create(Config::fromEnvFile(__DIR__ . '/.env'), __DIR__);

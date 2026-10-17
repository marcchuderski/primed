<?php

declare(strict_types=1);

use Primed\Auth\PasswordHasher;
use Primed\Auth\PasswordPolicy;
use Primed\Auth\SessionRepository;
use Primed\Auth\UserRepository;
use Primed\Cli\UserAdmin;
use Primed\Config\Config;
use Primed\Database\ConnectionFactory;
use Primed\Support\SystemClock;

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit(1);
}

require __DIR__ . '/../vendor/autoload.php';

$appRoot = dirname(__DIR__);
$config = Config::fromEnvFile($appRoot . '/.env');
$pdo = ConnectionFactory::create($config);

return new UserAdmin(
    new UserRepository($pdo),
    new SessionRepository($pdo),
    new PasswordHasher(),
    new PasswordPolicy($appRoot . '/resources/common-passwords.txt'),
    new SystemClock(),
);

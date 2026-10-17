<?php

declare(strict_types=1);

// Adds start data (day types, week template) to an existing user without any.
// Usage: php bin/user-seed.php [--owner-defaults]

use Primed\Cli\Console;
use Primed\Cli\UserAdmin;

$admin = require __DIR__ . '/cli-bootstrap.php';
assert($admin instanceof UserAdmin);

try {
    $admin->seed(Console::ask('Username:'), Console::hasFlag('--owner-defaults'));
    Console::line('Startdaten angelegt (falls noch keine vorhanden waren).');
} catch (RuntimeException $e) {
    Console::error('Fehler: ' . $e->getMessage());
    exit(1);
}

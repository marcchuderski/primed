<?php

declare(strict_types=1);

// Creates a user. Usage: php bin/user-create.php [--set-password]
// Without --set-password a random start password is generated and shown once (D-079).

use Primed\Cli\Console;
use Primed\Cli\UserAdmin;

$admin = require __DIR__ . '/cli-bootstrap.php';
assert($admin instanceof UserAdmin);

try {
    $username = Console::ask('Username:');
    $displayName = Console::ask('Display-Name:');
    if (Console::hasFlag('--set-password')) {
        $password = Console::askHidden('Passwort (min. 12 Zeichen):');
        if (Console::askHidden('Passwort wiederholen:') !== $password) {
            throw new RuntimeException('Die Passwörter stimmen nicht überein.');
        }
        $admin->create($username, $displayName, $password);
        Console::line('User angelegt.');
    } else {
        $password = Console::generatePassword();
        $admin->create($username, $displayName, $password);
        Console::line('User angelegt. Startpasswort (wird nur jetzt angezeigt):');
        Console::line('  ' . $password);
    }
} catch (RuntimeException $e) {
    Console::error('Fehler: ' . $e->getMessage());
    exit(1);
}

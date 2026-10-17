<?php

declare(strict_types=1);

// Resets a user's password and ends all of their sessions.
// Usage: php bin/user-password.php [--set-password]   (default: generate a random password)

use Primed\Cli\Console;
use Primed\Cli\UserAdmin;

$admin = require __DIR__ . '/cli-bootstrap.php';
assert($admin instanceof UserAdmin);

try {
    $username = Console::ask('Username:');
    if (Console::hasFlag('--set-password')) {
        $password = Console::askHidden('Neues Passwort (min. 12 Zeichen):');
        if (Console::askHidden('Passwort wiederholen:') !== $password) {
            throw new RuntimeException('Die Passwörter stimmen nicht überein.');
        }
        $admin->resetPassword($username, $password);
        Console::line('Passwort geändert, alle Sessions beendet.');
    } else {
        $password = Console::generatePassword();
        $admin->resetPassword($username, $password);
        Console::line('Passwort zurückgesetzt, alle Sessions beendet. Neues Passwort (wird nur jetzt angezeigt):');
        Console::line('  ' . $password);
    }
} catch (RuntimeException $e) {
    Console::error('Fehler: ' . $e->getMessage());
    exit(1);
}

<?php

declare(strict_types=1);

namespace Primed\Cli;

/**
 * Minimal interactive console helpers for the admin CLI scripts.
 */
final class Console
{
    public static function hasFlag(string $flag): bool
    {
        $argv = $_SERVER['argv'] ?? [];

        return is_array($argv) && in_array($flag, $argv, true);
    }

    public static function ask(string $question): string
    {
        fwrite(STDOUT, $question . ' ');
        $line = fgets(STDIN);

        return $line === false ? '' : trim($line);
    }

    /**
     * Reads a line without echoing it (for passwords). Refuses to run if echo cannot be disabled,
     * so a password is never shown on screen.
     */
    public static function askHidden(string $question): string
    {
        if (!stream_isatty(STDIN) || !function_exists('shell_exec')) {
            throw new \RuntimeException('Verdeckte Eingabe nicht möglich. Ohne --set-password ausführen.');
        }
        fwrite(STDOUT, $question . ' ');
        // Constant arguments only; needed to switch off terminal echo.
        shell_exec('stty -echo'); // phpcs:ignore Generic.PHP.ForbiddenFunctions
        $line = fgets(STDIN);
        shell_exec('stty echo'); // phpcs:ignore Generic.PHP.ForbiddenFunctions
        fwrite(STDOUT, "\n");

        return $line === false ? '' : rtrim($line, "\r\n");
    }

    public static function line(string $text = ''): void
    {
        fwrite(STDOUT, $text . "\n");
    }

    public static function error(string $text): void
    {
        fwrite(STDERR, $text . "\n");
    }

    /**
     * Random start password: 4 groups of 5 characters from an unambiguous alphabet (~100 bits).
     */
    public static function generatePassword(): string
    {
        $alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
        $groups = [];
        for ($g = 0; $g < 4; $g++) {
            $group = '';
            for ($i = 0; $i < 5; $i++) {
                $group .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }
            $groups[] = $group;
        }

        return implode('-', $groups);
    }
}

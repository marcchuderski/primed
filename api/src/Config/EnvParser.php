<?php

declare(strict_types=1);

namespace Primed\Config;

/**
 * Minimal, strict .env parser: KEY=VALUE per line, optional single or double quotes,
 * full-line comments with '#'. Values are never exported to the process environment.
 */
final class EnvParser
{
    /**
     * @return array<string, string>
     */
    public static function parse(string $contents): array
    {
        $values = [];
        $lines = preg_split('/\r\n|\n|\r/', $contents);
        if ($lines === false) {
            throw new ConfigException('Could not split .env contents');
        }

        foreach ($lines as $index => $line) {
            $trimmed = trim($line);
            if ($trimmed === '' || str_starts_with($trimmed, '#')) {
                continue;
            }

            $matches = [];
            if (preg_match('/^([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/', $trimmed, $matches) !== 1) {
                // Never include the line itself: it may contain a secret.
                throw new ConfigException(sprintf('Invalid .env syntax on line %d', $index + 1));
            }

            $values[$matches[1]] = self::unquote($matches[2], $index + 1);
        }

        return $values;
    }

    private static function unquote(string $raw, int $lineNumber): string
    {
        if ($raw === '') {
            return '';
        }

        $first = $raw[0];
        if ($first === '"' || $first === "'") {
            if (strlen($raw) < 2 || !str_ends_with($raw, $first)) {
                throw new ConfigException(sprintf('Unterminated quote on line %d', $lineNumber));
            }

            return substr($raw, 1, -1);
        }

        return $raw;
    }
}

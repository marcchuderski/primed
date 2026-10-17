<?php

declare(strict_types=1);

namespace Primed\Support;

use UnexpectedValueException;

/**
 * Typed access to database rows (fails loudly on unexpected types instead of casting blindly).
 */
final class Row
{
    /**
     * @param array<mixed> $row
     */
    public static function int(array $row, string $column): int
    {
        $value = $row[$column] ?? null;
        if (is_int($value)) {
            return $value;
        }
        if (is_string($value) && preg_match('/^-?\d+$/', $value) === 1) {
            return (int) $value;
        }
        throw new UnexpectedValueException(sprintf('Column %s is not an integer', $column));
    }

    /**
     * @param array<mixed> $row
     */
    public static function string(array $row, string $column): string
    {
        $value = $row[$column] ?? null;
        if (!is_string($value)) {
            throw new UnexpectedValueException(sprintf('Column %s is not a string', $column));
        }

        return $value;
    }
}

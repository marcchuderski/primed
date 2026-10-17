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

    /**
     * DECIMAL columns arrive as strings (native prepares); converted to float.
     *
     * @param array<mixed> $row
     */
    public static function float(array $row, string $column): float
    {
        $value = $row[$column] ?? null;
        if (is_int($value) || is_float($value)) {
            return (float) $value;
        }
        if (is_string($value) && is_numeric($value)) {
            return (float) $value;
        }
        throw new UnexpectedValueException(sprintf('Column %s is not numeric', $column));
    }

    /**
     * @param array<mixed> $row
     */
    public static function nullableFloat(array $row, string $column): ?float
    {
        return ($row[$column] ?? null) === null ? null : self::float($row, $column);
    }

    /**
     * @param array<mixed> $row
     */
    public static function nullableString(array $row, string $column): ?string
    {
        return ($row[$column] ?? null) === null ? null : self::string($row, $column);
    }
}

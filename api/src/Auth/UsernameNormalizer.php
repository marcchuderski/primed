<?php

declare(strict_types=1);

namespace Primed\Auth;

final class UsernameNormalizer
{
    public const PATTERN = '/^[a-z0-9._-]{3,32}$/';

    public static function normalize(string $username): string
    {
        return mb_strtolower(trim($username), 'UTF-8');
    }

    public static function isValid(string $normalized): bool
    {
        return preg_match(self::PATTERN, $normalized) === 1;
    }
}

<?php

declare(strict_types=1);

namespace Primed\Auth;

/**
 * Stateless CSRF tokens bound to the session: HMAC(csrfKey, sessionTokenHash).
 * The token can be re-issued on every /auth/me without storing it.
 */
final class CsrfTokens
{
    public function __construct(private readonly string $key)
    {
    }

    public function forSession(string $sessionTokenHash): string
    {
        return self::base64Url(hash_hmac('sha256', $sessionTokenHash, $this->key, true));
    }

    public function isValid(string $sessionTokenHash, ?string $candidate): bool
    {
        if ($candidate === null || $candidate === '') {
            return false;
        }

        return hash_equals($this->forSession($sessionTokenHash), $candidate);
    }

    private static function base64Url(string $raw): string
    {
        return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    }
}

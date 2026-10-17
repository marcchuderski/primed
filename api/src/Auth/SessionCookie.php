<?php

declare(strict_types=1);

namespace Primed\Auth;

use DateTimeImmutable;
use Primed\Http\Response;

/**
 * The session cookie. "__Host-" forces Secure, Path=/ and no Domain attribute.
 */
final class SessionCookie
{
    public const NAME = '__Host-primed_session';

    public static function set(
        Response $response,
        string $token,
        DateTimeImmutable $expiresAt,
        DateTimeImmutable $now,
    ): Response {
        $maxAge = max(0, $expiresAt->getTimestamp() - $now->getTimestamp());

        return $response->withHeader('Set-Cookie', sprintf(
            '%s=%s; Max-Age=%d; Path=/; Secure; HttpOnly; SameSite=Strict',
            self::NAME,
            $token,
            $maxAge,
        ));
    }

    public static function clear(Response $response): Response
    {
        return $response->withHeader(
            'Set-Cookie',
            self::NAME . '=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Strict',
        );
    }
}

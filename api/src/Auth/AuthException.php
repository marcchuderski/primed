<?php

declare(strict_types=1);

namespace Primed\Auth;

use Primed\Http\HttpException;

final class AuthException
{
    public static function invalidCredentials(): HttpException
    {
        // Same message whether the username exists or not (no enumeration).
        return new HttpException(401, 'invalid_credentials', 'Username oder Passwort ist falsch.');
    }

    public static function unauthenticated(): HttpException
    {
        return new HttpException(401, 'unauthenticated', 'Bitte melde dich an.');
    }

    public static function rateLimited(int $retryAfter): HttpException
    {
        return new HttpException(
            429,
            'too_many_attempts',
            'Zu viele Versuche. Bitte warte kurz und versuche es dann erneut.',
            ['Retry-After' => (string) $retryAfter],
        );
    }

    public static function csrf(): HttpException
    {
        return new HttpException(403, 'csrf_failed', 'Die Anfrage konnte nicht bestätigt werden. Lade die Seite neu.');
    }
}

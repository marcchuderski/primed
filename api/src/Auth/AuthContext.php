<?php

declare(strict_types=1);

namespace Primed\Auth;

use DateTimeImmutable;

/**
 * The authenticated user of the current request.
 */
final class AuthContext
{
    public function __construct(
        public readonly User $user,
        public readonly Session $session,
        public readonly string $csrfToken,
        /** Set when the sliding expiry moved and the cookie must be refreshed. */
        public readonly ?DateTimeImmutable $refreshedCookieExpiry,
    ) {
    }
}

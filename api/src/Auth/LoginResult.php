<?php

declare(strict_types=1);

namespace Primed\Auth;

use DateTimeImmutable;

final class LoginResult
{
    public function __construct(
        public readonly User $user,
        public readonly string $sessionToken,
        public readonly string $csrfToken,
        public readonly DateTimeImmutable $cookieExpiresAt,
    ) {
    }
}

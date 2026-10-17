<?php

declare(strict_types=1);

namespace Primed\Auth;

use DateTimeImmutable;

final class Session
{
    public function __construct(
        public readonly int $id,
        public readonly int $userId,
        public readonly string $tokenHash,
        public readonly DateTimeImmutable $lastSeenAt,
        public readonly DateTimeImmutable $expiresAt,
        public readonly DateTimeImmutable $absoluteExpiresAt,
    ) {
    }
}

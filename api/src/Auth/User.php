<?php

declare(strict_types=1);

namespace Primed\Auth;

final class User
{
    public function __construct(
        public readonly int $id,
        public readonly string $username,
        public readonly string $displayName,
        public readonly string $passwordHash,
    ) {
    }

    /**
     * Public representation; never includes the password hash.
     *
     * @return array{id: int, username: string, displayName: string}
     */
    public function toPublic(): array
    {
        return ['id' => $this->id, 'username' => $this->username, 'displayName' => $this->displayName];
    }
}

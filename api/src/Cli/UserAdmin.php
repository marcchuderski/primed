<?php

declare(strict_types=1);

namespace Primed\Cli;

use Primed\Auth\PasswordHasher;
use Primed\Auth\PasswordPolicy;
use Primed\Auth\SessionRepository;
use Primed\Auth\UsernameNormalizer;
use Primed\Auth\UserRepository;
use Primed\Support\Clock;
use RuntimeException;

/**
 * Admin operations behind bin/user-create and bin/user-password (D-063, D-079).
 */
final class UserAdmin
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly SessionRepository $sessions,
        private readonly PasswordHasher $hasher,
        private readonly PasswordPolicy $policy,
        private readonly Clock $clock,
    ) {
    }

    public function create(string $username, string $displayName, string $password): int
    {
        $normalized = UsernameNormalizer::normalize($username);
        if (!UsernameNormalizer::isValid($normalized)) {
            throw new RuntimeException('Username: 3–32 Zeichen, nur a–z, 0–9, Punkt, Bindestrich, Unterstrich.');
        }
        $displayName = trim($displayName);
        $length = mb_strlen($displayName, 'UTF-8');
        if ($length < 1 || $length > 64 || preg_match('/\p{C}/u', $displayName) === 1) {
            throw new RuntimeException('Display-Name: 1–64 Zeichen, keine Steuerzeichen.');
        }
        if ($this->users->findByUsername($normalized) !== null) {
            throw new RuntimeException('Dieser Username ist bereits vergeben.');
        }
        $this->assertPassword($password, $normalized);

        return $this->users->create($normalized, $displayName, $this->hasher->hash($password), $this->clock->now());
    }

    /** Sets a new password and ends all sessions of the user. */
    public function resetPassword(string $username, string $password): void
    {
        $user = $this->users->findByUsername(UsernameNormalizer::normalize($username));
        if ($user === null) {
            throw new RuntimeException('User nicht gefunden.');
        }
        $this->assertPassword($password, $user->username);

        $now = $this->clock->now();
        $this->users->updatePasswordHash($user->id, $this->hasher->hash($password), $now);
        $this->sessions->revokeAllForUser($user->id, $now);
    }

    private function assertPassword(string $password, string $username): void
    {
        $errors = $this->policy->validate($password, $username);
        if ($errors !== []) {
            throw new RuntimeException(implode(' ', $errors));
        }
    }
}

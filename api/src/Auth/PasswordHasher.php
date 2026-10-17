<?php

declare(strict_types=1);

namespace Primed\Auth;

/**
 * Argon2id via password_hash (D-062). Server supports PASSWORD_ARGON2ID (checked 2026-10-17).
 */
final class PasswordHasher
{
    /** Hash of a random, discarded value. Verified against for unknown users to equalize timing. */
    private const DUMMY_HASH = '$argon2id$v=19$m=65536,t=4,p=1$aU1KdC5sTmVDOTNNc3RGcQ'
        . '$DxwxdmtB/xf3PHgpkMf8tWyGgXFpdOwNB6/48WJZLRU';

    /** @var array{memory_cost: int, time_cost: int, threads: int} */
    private readonly array $options;

    public function __construct(int $memoryCost = PASSWORD_ARGON2_DEFAULT_MEMORY_COST, int $timeCost = 4)
    {
        $this->options = ['memory_cost' => $memoryCost, 'time_cost' => $timeCost, 'threads' => 1];
    }

    public function hash(string $password): string
    {
        return password_hash($password, PASSWORD_ARGON2ID, $this->options);
    }

    public function verify(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    public function needsRehash(string $hash): bool
    {
        return password_needs_rehash($hash, PASSWORD_ARGON2ID, $this->options);
    }

    /** Burns the same time as a real verification (unknown username). */
    public function verifyDummy(string $password): void
    {
        password_verify($password, self::DUMMY_HASH);
    }
}

<?php

declare(strict_types=1);

namespace Primed\Auth;

/**
 * Pseudonymizes client IPs for rate limiting (D-061): keyed HMAC, not reversible without the key.
 */
final class IpHasher
{
    public function __construct(private readonly string $key)
    {
    }

    public function hash(string $ip): string
    {
        return hash_hmac('sha256', $ip, $this->key, true);
    }
}

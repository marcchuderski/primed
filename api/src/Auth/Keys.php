<?php

declare(strict_types=1);

namespace Primed\Auth;

use Primed\Config\ConfigException;

/**
 * Purpose-bound sub-keys derived from APP_KEY (HMAC-based domain separation).
 */
final class Keys
{
    private function __construct(private readonly string $appKey)
    {
    }

    public static function fromBase64(string $appKeyBase64): self
    {
        $raw = base64_decode($appKeyBase64, true);
        if ($raw === false || strlen($raw) < 32) {
            throw new ConfigException('APP_KEY must be at least 32 random bytes, base64-encoded');
        }

        return new self($raw);
    }

    public function ipHashKey(): string
    {
        return hash_hmac('sha256', 'primed:ip-hash:v1', $this->appKey, true);
    }

    public function csrfKey(): string
    {
        return hash_hmac('sha256', 'primed:csrf:v1', $this->appKey, true);
    }
}

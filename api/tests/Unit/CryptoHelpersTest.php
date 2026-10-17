<?php

declare(strict_types=1);

namespace Primed\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Primed\Auth\CsrfTokens;
use Primed\Auth\IpHasher;
use Primed\Auth\Keys;
use Primed\Auth\SessionCookie;
use Primed\Config\ConfigException;
use Primed\Http\Response;
use Primed\Support\FixedClock;

final class CryptoHelpersTest extends TestCase
{
    public function testKeysRequire32Bytes(): void
    {
        $this->expectException(ConfigException::class);
        Keys::fromBase64(base64_encode(random_bytes(16)));
    }

    public function testDerivedKeysAreDistinct(): void
    {
        $keys = Keys::fromBase64(base64_encode(random_bytes(32)));

        self::assertNotSame($keys->csrfKey(), $keys->ipHashKey());
        self::assertSame(32, strlen($keys->csrfKey()));
    }

    public function testCsrfTokenIsBoundToSession(): void
    {
        $csrf = new CsrfTokens(random_bytes(32));
        $a = random_bytes(32);
        $b = random_bytes(32);

        self::assertTrue($csrf->isValid($a, $csrf->forSession($a)));
        self::assertFalse($csrf->isValid($b, $csrf->forSession($a)));
        self::assertFalse($csrf->isValid($a, null));
        self::assertFalse($csrf->isValid($a, ''));
    }

    public function testIpHashIsKeyed(): void
    {
        self::assertNotSame(
            (new IpHasher(random_bytes(32)))->hash('203.0.113.7'),
            (new IpHasher(random_bytes(32)))->hash('203.0.113.7'),
        );
    }

    public function testSessionCookieAttributes(): void
    {
        $clock = new FixedClock();
        $response = SessionCookie::set(new Response(200), 'tok', $clock->now()->modify('+30 days'), $clock->now());

        self::assertSame(
            '__Host-primed_session=tok; Max-Age=2592000; Path=/; Secure; HttpOnly; SameSite=Strict',
            $response->header('Set-Cookie'),
        );
        $cleared = SessionCookie::clear(new Response(204))->header('Set-Cookie');
        self::assertStringContainsString('Max-Age=0', (string) $cleared);
    }
}

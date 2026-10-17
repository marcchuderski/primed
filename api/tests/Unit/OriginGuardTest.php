<?php

declare(strict_types=1);

namespace Primed\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Primed\Http\HttpException;
use Primed\Http\OriginGuard;
use Primed\Http\Request;

final class OriginGuardTest extends TestCase
{
    private OriginGuard $guard;

    protected function setUp(): void
    {
        $this->guard = new OriginGuard([OriginGuard::originOf('https://primed.dev-pfeffermond.de/')]);
    }

    public function testSafeMethodsPass(): void
    {
        $this->guard->check(new Request('GET', '/', ['Origin' => 'https://evil.example']));
        $this->addToAssertionCount(1);
    }

    public function testSameOriginJsonPasses(): void
    {
        $this->guard->check($this->post(['Origin' => 'https://primed.dev-pfeffermond.de']));
        $this->guard->check($this->post(['Sec-Fetch-Site' => 'same-origin']));
        $this->addToAssertionCount(2);
    }

    public function testForeignOriginIsRejected(): void
    {
        $this->assertStatus(403, $this->post(['Origin' => 'https://evil.example']));
        $this->assertStatus(403, $this->post(['Origin' => 'https://primed.dev-pfeffermond.de.evil.example']));
        $this->assertStatus(403, $this->post(['Origin' => 'null']));
    }

    public function testMissingOriginAndFetchMetadataIsRejected(): void
    {
        $this->assertStatus(403, $this->post([]));
        $this->assertStatus(403, $this->post(['Sec-Fetch-Site' => 'cross-site']));
    }

    public function testFormEncodedBodyIsRejectedEvenFromSameOrigin(): void
    {
        $request = new Request(
            'POST',
            '/',
            ['Origin' => 'https://primed.dev-pfeffermond.de', 'Content-Type' => 'application/x-www-form-urlencoded'],
        );
        $this->assertStatus(415, $request);
    }

    /**
     * @param array<string, string> $headers
     */
    private function post(array $headers): Request
    {
        return new Request('POST', '/', $headers + ['Content-Type' => 'application/json']);
    }

    private function assertStatus(int $status, Request $request): void
    {
        try {
            $this->guard->check($request);
            self::fail('Expected rejection');
        } catch (HttpException $e) {
            self::assertSame($status, $e->status);
        }
    }
}

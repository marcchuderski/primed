<?php

declare(strict_types=1);

namespace Primed\Tests\Unit;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Primed\Http\HttpException;
use Primed\Http\Request;

final class RequestTest extends TestCase
{
    public function testHeadersAreCaseInsensitive(): void
    {
        $request = new Request('GET', '/', ['X-CSRF-Token' => 'abc']);

        self::assertSame('abc', $request->header('x-csrf-token'));
        self::assertNull($request->header('missing'));
    }

    public function testDecodesJsonObject(): void
    {
        $request = new Request('POST', '/', ['Content-Type' => 'application/json; charset=utf-8'], '{"a":1}');

        self::assertSame(['a' => 1], $request->json());
    }

    public function testRejectsNonJsonContentType(): void
    {
        $request = new Request('POST', '/', ['Content-Type' => 'application/x-www-form-urlencoded'], 'a=1');

        try {
            $request->json();
            self::fail('Expected exception');
        } catch (HttpException $e) {
            self::assertSame(415, $e->status);
        }
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function invalidBodies(): iterable
    {
        yield 'malformed' => ['{"a":'];
        yield 'list' => ['[1,2]'];
        yield 'scalar' => ['"text"'];
        yield 'too deep' => [str_repeat('{"a":', 40) . '1' . str_repeat('}', 40)];
    }

    #[DataProvider('invalidBodies')]
    public function testRejectsInvalidJsonBodies(string $body): void
    {
        $request = new Request('POST', '/', ['Content-Type' => 'application/json'], $body);

        try {
            $request->json();
            self::fail('Expected exception');
        } catch (HttpException $e) {
            self::assertSame(400, $e->status);
        }
    }
}

<?php

declare(strict_types=1);

namespace Primed\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Primed\Http\HttpException;
use Primed\Http\Request;
use Primed\Http\Response;
use Primed\Http\Router;

final class RouterTest extends TestCase
{
    private Router $router;

    protected function setUp(): void
    {
        $this->router = new Router();
        $this->router->add('GET', '/v1/items/{id}', static fn (Request $r, array $p): Response => Response::json($p));
        $this->router->add('DELETE', '/v1/items/{id}', static fn (): Response => Response::noContent());
        $this->router->add('GET', '/v1/a.b', static fn (): Response => Response::json('dot'));
    }

    public function testMatchesRouteAndExtractsParams(): void
    {
        $response = $this->router->dispatch(new Request('GET', '/api/v1/items/42'), '/v1/items/42');

        self::assertSame(200, $response->status);
        self::assertSame('{"id":"42"}', $response->body);
    }

    public function testParamsDoNotSpanSegments(): void
    {
        $this->expectExceptionObject(HttpException::notFound());
        $this->router->dispatch(new Request('GET', '/'), '/v1/items/42/extra');
    }

    public function testUnknownPathIs404(): void
    {
        try {
            $this->router->dispatch(new Request('GET', '/'), '/v1/unknown');
            self::fail('Expected exception');
        } catch (HttpException $e) {
            self::assertSame(404, $e->status);
        }
    }

    public function testWrongMethodIs405WithAllowHeader(): void
    {
        try {
            $this->router->dispatch(new Request('POST', '/'), '/v1/items/1');
            self::fail('Expected exception');
        } catch (HttpException $e) {
            self::assertSame(405, $e->status);
            self::assertSame(['Allow' => 'GET, DELETE'], $e->headers);
        }
    }

    public function testLiteralDotsAreNotRegexWildcards(): void
    {
        $this->expectException(HttpException::class);
        $this->router->dispatch(new Request('GET', '/'), '/v1/aXb');
    }

    public function testParamsRejectUnsafeCharacters(): void
    {
        foreach (['/v1/items/a%2F', '/v1/items/a b', '/v1/items/' . str_repeat('1', 65)] as $path) {
            try {
                $this->router->dispatch(new Request('GET', '/'), $path);
                self::fail('Expected exception for ' . $path);
            } catch (HttpException $e) {
                self::assertSame(404, $e->status);
            }
        }
    }

    public function testTrailingNewlineDoesNotMatch(): void
    {
        $this->expectException(HttpException::class);
        $this->router->dispatch(new Request('GET', '/'), "/v1/items/1\n");
    }
}

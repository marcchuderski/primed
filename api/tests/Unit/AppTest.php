<?php

declare(strict_types=1);

namespace Primed\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Primed\App;
use Primed\Http\Request;
use Primed\Http\Response;
use Primed\Kernel;
use Primed\Log\MemoryLogger;
use RuntimeException;

final class AppTest extends TestCase
{
    private MemoryLogger $logger;

    protected function setUp(): void
    {
        $this->logger = new MemoryLogger();
    }

    public function testHealthEndpoint(): void
    {
        $response = $this->app()->handle(new Request('GET', '/api/v1/health'));

        self::assertSame(200, $response->status);
        self::assertSame('{"status":"ok"}', $response->body);
        self::assertSame('application/json; charset=utf-8', $response->header('content-type'));
    }

    public function testSecurityHeadersOnEveryResponse(): void
    {
        foreach (['/api/v1/health', '/api/v1/nope', '/other'] as $path) {
            $response = $this->app()->handle(new Request('GET', $path));
            self::assertSame('no-store', $response->header('Cache-Control'), $path);
            self::assertSame('nosniff', $response->header('X-Content-Type-Options'), $path);
            self::assertSame('DENY', $response->header('X-Frame-Options'), $path);
        }
    }

    public function testUnknownRouteAndForeignBasePathAre404(): void
    {
        self::assertSame(404, $this->app()->handle(new Request('GET', '/api/v1/nope'))->status);
        self::assertSame(404, $this->app()->handle(new Request('GET', '/apix/v1/health'))->status);
        self::assertSame(404, $this->app()->handle(new Request('GET', '/v1/health'))->status);
    }

    public function testWrongMethodIs405(): void
    {
        $response = $this->app()->handle(new Request('POST', '/api/v1/health'));

        self::assertSame(405, $response->status);
        self::assertSame('GET', $response->header('Allow'));
    }

    public function testUnhandledErrorsDoNotLeakDetails(): void
    {
        $router = Kernel::routes();
        $router->add('GET', '/v1/boom', static function (): Response {
            throw new RuntimeException('SQLSTATE secret detail in /var/www/primed-app/src/Foo.php');
        });
        $app = new App($router, $this->logger);

        $response = $app->handle(new Request('GET', '/api/v1/boom'));

        self::assertSame(500, $response->status);
        self::assertSame(
            '{"error":{"code":"internal_error","message":"Es ist ein Fehler aufgetreten."}}',
            $response->body,
        );
        self::assertStringNotContainsString('SQLSTATE', $response->body);
        self::assertCount(1, $this->logger->records);
        self::assertSame('error', $this->logger->records[0]['level']);
    }

    private function app(): App
    {
        return new App(Kernel::routes(), $this->logger);
    }
}

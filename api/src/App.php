<?php

declare(strict_types=1);

namespace Primed;

use Primed\Http\HttpException;
use Primed\Http\OriginGuard;
use Primed\Http\Request;
use Primed\Http\Response;
use Primed\Http\Router;
use Primed\Log\Logger;
use Throwable;

/**
 * HTTP kernel: strips the base path, dispatches, and turns every error into a safe JSON response.
 */
final class App
{
    public function __construct(
        private readonly Router $router,
        private readonly Logger $logger,
        private readonly string $basePath = '/api',
        private readonly ?OriginGuard $originGuard = null,
    ) {
    }

    public function handle(Request $request): Response
    {
        try {
            $path = $this->stripBasePath($request->path);
            if ($path === null) {
                throw HttpException::notFound();
            }

            $this->originGuard?->check($request);

            return $this->router->dispatch($request, $path);
        } catch (HttpException $e) {
            $response = self::error($e->status, $e->errorCode, $e->getMessage());
            foreach ($e->headers as $name => $value) {
                $response = $response->withHeader($name, $value);
            }

            return $response;
        } catch (Throwable $e) {
            // Internal details go to the log only, never to the client.
            $this->logger->log('error', 'Unhandled exception', [
                'type' => $e::class,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'method' => $request->method,
                'path' => $request->path,
            ]);

            return self::error(500, 'internal_error', 'Es ist ein Fehler aufgetreten.');
        }
    }

    public static function error(int $status, string $code, string $message): Response
    {
        return Response::json(['error' => ['code' => $code, 'message' => $message]], $status);
    }

    private function stripBasePath(string $path): ?string
    {
        if ($this->basePath === '') {
            return $path;
        }
        if ($path === $this->basePath) {
            return '/';
        }
        if (str_starts_with($path, $this->basePath . '/')) {
            return substr($path, strlen($this->basePath));
        }

        return null;
    }
}

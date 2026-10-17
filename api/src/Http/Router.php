<?php

declare(strict_types=1);

namespace Primed\Http;

use Closure;

/**
 * Small exact-match router with {param} placeholders. Parameters match a single path segment
 * of safe characters only ([A-Za-z0-9_-]: ids, dates, barcodes).
 */
final class Router
{
    /** @var list<array{method: string, regex: string, handler: Closure(Request, array<string, string>): Response}> */
    private array $routes = [];

    /**
     * @param Closure(Request, array<string, string>): Response $handler
     */
    public function add(string $method, string $pattern, Closure $handler): void
    {
        $this->routes[] = [
            'method' => strtoupper($method),
            'regex' => self::compile($pattern),
            'handler' => $handler,
        ];
    }

    public function dispatch(Request $request, string $path): Response
    {
        $allowed = [];
        foreach ($this->routes as $route) {
            $matches = [];
            if (preg_match($route['regex'], $path, $matches) !== 1) {
                continue;
            }
            if ($route['method'] !== $request->method) {
                $allowed[] = $route['method'];
                continue;
            }

            $params = [];
            foreach ($matches as $key => $value) {
                if (is_string($key)) {
                    $params[$key] = $value;
                }
            }

            return ($route['handler'])($request, $params);
        }

        if ($allowed !== []) {
            throw HttpException::methodNotAllowed(array_values(array_unique($allowed)));
        }

        throw HttpException::notFound();
    }

    private static function compile(string $pattern): string
    {
        $parts = preg_split('/(\{[a-z][a-zA-Z0-9]*\})/', $pattern, -1, PREG_SPLIT_DELIM_CAPTURE);
        if ($parts === false) {
            throw new \LogicException('Invalid route pattern');
        }

        $regex = '';
        foreach ($parts as $part) {
            if (preg_match('/^\{([a-z][a-zA-Z0-9]*)\}$/', $part, $m) === 1) {
                $regex .= '(?P<' . $m[1] . '>[A-Za-z0-9_-]{1,64})';
            } else {
                $regex .= preg_quote($part, '#');
            }
        }

        return '#^' . $regex . '$#D';
    }
}

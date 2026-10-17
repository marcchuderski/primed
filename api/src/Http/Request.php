<?php

declare(strict_types=1);

namespace Primed\Http;

use JsonException;

final class Request
{
    /** @var array<string, string> lower-cased header names */
    private readonly array $headers;

    /**
     * @param array<string, string> $headers
     * @param array<string, string> $query
     * @param array<string, string> $cookies
     */
    public function __construct(
        public readonly string $method,
        public readonly string $path,
        array $headers = [],
        public readonly string $body = '',
        public readonly string $clientIp = '',
        public readonly array $query = [],
        public readonly array $cookies = [],
    ) {
        $normalized = [];
        foreach ($headers as $name => $value) {
            $normalized[strtolower($name)] = $value;
        }
        $this->headers = $normalized;
    }

    /**
     * Builds the request from PHP superglobals, enforcing a maximum body size.
     */
    public static function fromGlobals(int $maxBodyBytes): self
    {
        $server = $_SERVER;
        $method = strtoupper(self::serverString($server, 'REQUEST_METHOD', 'GET'));
        $uri = self::serverString($server, 'REQUEST_URI', '/');
        $path = parse_url($uri, PHP_URL_PATH);
        if (!is_string($path) || $path === '') {
            $path = '/';
        }

        $headers = [];
        foreach ($server as $key => $value) {
            if (!is_string($value)) {
                continue;
            }
            if (str_starts_with($key, 'HTTP_')) {
                $headers[str_replace('_', '-', substr($key, 5))] = $value;
            } elseif ($key === 'CONTENT_TYPE' || $key === 'CONTENT_LENGTH') {
                $headers[str_replace('_', '-', $key)] = $value;
            }
        }

        $declaredLength = self::serverString($server, 'CONTENT_LENGTH', '0');
        if (ctype_digit($declaredLength) && (int) $declaredLength > $maxBodyBytes) {
            throw HttpException::payloadTooLarge();
        }

        $body = '';
        $stream = fopen('php://input', 'rb');
        if ($stream !== false) {
            $read = stream_get_contents($stream, $maxBodyBytes + 1);
            fclose($stream);
            $body = $read === false ? '' : $read;
        }
        if (strlen($body) > $maxBodyBytes) {
            throw HttpException::payloadTooLarge();
        }

        return new self(
            $method,
            $path,
            $headers,
            $body,
            self::serverString($server, 'REMOTE_ADDR', ''),
            self::stringMap($_GET),
            self::stringMap($_COOKIE),
        );
    }

    public function header(string $name): ?string
    {
        return $this->headers[strtolower($name)] ?? null;
    }

    public function cookie(string $name): ?string
    {
        return $this->cookies[$name] ?? null;
    }

    public function isJson(): bool
    {
        $contentType = $this->header('Content-Type') ?? '';
        $mediaType = strtolower(trim(explode(';', $contentType, 2)[0]));

        return $mediaType === 'application/json';
    }

    /**
     * Decodes the JSON body into an object-like array. Rejects non-JSON content types and non-object bodies.
     *
     * @return array<string, mixed>
     */
    public function json(): array
    {
        if (!$this->isJson()) {
            throw HttpException::unsupportedMediaType();
        }

        try {
            $data = json_decode($this->body, true, 32, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw HttpException::badRequest('Ungültiges JSON.');
        }

        if (!is_array($data) || ($data !== [] && array_is_list($data))) {
            throw HttpException::badRequest('JSON-Objekt erwartet.');
        }

        /** @var array<string, mixed> $data */
        return $data;
    }

    /**
     * @param array<mixed> $server
     */
    private static function serverString(array $server, string $key, string $default): string
    {
        $value = $server[$key] ?? null;

        return is_string($value) ? $value : $default;
    }

    /**
     * @param array<mixed> $input
     * @return array<string, string>
     */
    private static function stringMap(array $input): array
    {
        $result = [];
        foreach ($input as $key => $value) {
            if (is_string($key) && is_string($value)) {
                $result[$key] = $value;
            }
        }

        return $result;
    }
}

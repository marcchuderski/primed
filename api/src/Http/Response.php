<?php

declare(strict_types=1);

namespace Primed\Http;

final class Response
{
    /** Headers sent with every API response. Page-level headers (CSP, HSTS …) are set in .htaccess. */
    private const DEFAULT_HEADERS = [
        'Cache-Control' => 'no-store',
        'X-Content-Type-Options' => 'nosniff',
        'Referrer-Policy' => 'no-referrer',
        'X-Frame-Options' => 'DENY',
        'Content-Security-Policy' => "default-src 'none'; frame-ancestors 'none'",
        'Cross-Origin-Resource-Policy' => 'same-origin',
    ];

    /**
     * @param array<string, string> $headers
     */
    public function __construct(
        public readonly int $status,
        public readonly string $body = '',
        private array $headers = [],
    ) {
        $this->headers = array_merge(self::DEFAULT_HEADERS, $headers);
    }

    public static function json(mixed $data, int $status = 200): self
    {
        $body = json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return new self($status, $body, ['Content-Type' => 'application/json; charset=utf-8']);
    }

    public static function noContent(): self
    {
        return new self(204);
    }

    public function withHeader(string $name, string $value): self
    {
        $clone = clone $this;
        $clone->headers[$name] = $value;

        return $clone;
    }

    public function header(string $name): ?string
    {
        foreach ($this->headers as $key => $value) {
            if (strcasecmp($key, $name) === 0) {
                return $value;
            }
        }

        return null;
    }

    /**
     * @return array<string, string>
     */
    public function headers(): array
    {
        return $this->headers;
    }

    public function send(): void
    {
        http_response_code($this->status);
        header_remove('X-Powered-By');
        foreach ($this->headers as $name => $value) {
            header($name . ': ' . $value);
        }
        echo $this->body;
    }
}

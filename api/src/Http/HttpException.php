<?php

declare(strict_types=1);

namespace Primed\Http;

use RuntimeException;

/**
 * An error whose code and message are safe to show to the client.
 */
final class HttpException extends RuntimeException
{
    /**
     * @param array<string, string> $headers
     */
    public function __construct(
        public readonly int $status,
        public readonly string $errorCode,
        string $publicMessage,
        public readonly array $headers = [],
    ) {
        parent::__construct($publicMessage);
    }

    public static function badRequest(string $message = 'Ungültige Anfrage.'): self
    {
        return new self(400, 'bad_request', $message);
    }

    public static function notFound(): self
    {
        return new self(404, 'not_found', 'Nicht gefunden.');
    }

    /**
     * @param list<string> $allowed
     */
    public static function methodNotAllowed(array $allowed): self
    {
        return new self(405, 'method_not_allowed', 'Methode nicht erlaubt.', ['Allow' => implode(', ', $allowed)]);
    }

    public static function payloadTooLarge(): self
    {
        return new self(413, 'payload_too_large', 'Anfrage zu groß.');
    }

    public static function unsupportedMediaType(): self
    {
        return new self(415, 'unsupported_media_type', 'Nur JSON wird akzeptiert.');
    }
}

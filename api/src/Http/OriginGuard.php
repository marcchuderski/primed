<?php

declare(strict_types=1);

namespace Primed\Http;

/**
 * Defense in depth against cross-site requests for state-changing methods (SECURITY.md):
 * the Origin must be allowed and the body must be declared as JSON (blocks HTML-form CSRF, incl. login CSRF).
 */
final class OriginGuard
{
    private const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

    /**
     * @param list<string> $allowedOrigins e.g. ["https://primed.dev-pfeffermond.de"]
     */
    public function __construct(private readonly array $allowedOrigins)
    {
    }

    public static function originOf(string $url): string
    {
        $parts = parse_url($url);
        if (!is_array($parts) || !isset($parts['scheme'], $parts['host'])) {
            throw new \InvalidArgumentException('Invalid origin URL');
        }
        $origin = strtolower($parts['scheme']) . '://' . strtolower($parts['host']);

        return isset($parts['port']) ? $origin . ':' . $parts['port'] : $origin;
    }

    public function check(Request $request): void
    {
        if (in_array($request->method, self::SAFE_METHODS, true)) {
            return;
        }

        $origin = $request->header('Origin');
        if ($origin !== null) {
            if (!in_array(strtolower($origin), $this->allowedOrigins, true)) {
                throw new HttpException(403, 'origin_not_allowed', 'Anfrage von fremder Herkunft abgelehnt.');
            }
        } elseif ($request->header('Sec-Fetch-Site') !== 'same-origin') {
            throw new HttpException(403, 'origin_not_allowed', 'Anfrage von fremder Herkunft abgelehnt.');
        }

        if (!$request->isJson()) {
            throw HttpException::unsupportedMediaType();
        }
    }
}

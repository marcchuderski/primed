<?php

declare(strict_types=1);

namespace Primed\Off;

/**
 * Outbound HTTPS to Open Food Facts only (SECURITY.md: SSRF protection): fixed host allowlist,
 * HTTPS only, no redirects, short timeouts, response size limit.
 */
final class CurlFetcher implements HttpFetcher
{
    private const ALLOWED_HOSTS = ['world.openfoodfacts.org', 'search.openfoodfacts.org'];
    private const MAX_BYTES = 1_048_576;

    /**
     * @param non-empty-string $userAgent
     */
    public function __construct(private readonly string $userAgent, private readonly int $timeoutSeconds = 5)
    {
    }

    public function get(string $url): ?string
    {
        $parts = parse_url($url);
        if (
            !is_array($parts)
            || ($parts['scheme'] ?? '') !== 'https'
            || !in_array($parts['host'] ?? '', self::ALLOWED_HOSTS, true)
            || isset($parts['user']) || isset($parts['pass']) || isset($parts['port'])
        ) {
            throw new OffUnavailable('URL not allowed');
        }

        $handle = curl_init($url);
        if ($handle === false) {
            throw new OffUnavailable('curl init failed');
        }
        $body = '';
        $tooLarge = false;
        curl_setopt_array($handle, [
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT => $this->timeoutSeconds,
            CURLOPT_USERAGENT => $this->userAgent,
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_WRITEFUNCTION => static function ($ch, string $chunk) use (&$body, &$tooLarge): int {
                if (strlen($body) + strlen($chunk) > self::MAX_BYTES) {
                    $tooLarge = true;

                    return 0; // abort transfer
                }
                $body .= $chunk;

                return strlen($chunk);
            },
        ]);
        $ok = curl_exec($handle);
        $status = curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        curl_close($handle);

        if ($tooLarge) {
            throw new OffUnavailable('response too large');
        }
        if ($ok === false) {
            throw new OffUnavailable('request failed');
        }
        if ($status === 404) {
            return null;
        }
        if ($status !== 200) {
            throw new OffUnavailable('unexpected status ' . $status);
        }

        return $body;
    }
}

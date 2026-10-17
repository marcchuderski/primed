<?php

declare(strict_types=1);

namespace Primed\Tests\Support;

use Primed\Off\HttpFetcher;
use Primed\Off\OffUnavailable;

/**
 * Canned Open Food Facts responses; records requested URLs.
 */
final class FakeFetcher implements HttpFetcher
{
    /** @var list<string> */
    public array $requests = [];

    /**
     * @param array<int|string, string|null> $responses URL substring => body (null = 404; numeric keys become ints)
     */
    public function __construct(public array $responses = [], public bool $down = false)
    {
    }

    public function get(string $url): ?string
    {
        $this->requests[] = $url;
        if ($this->down) {
            throw new OffUnavailable('down');
        }
        foreach ($this->responses as $needle => $body) {
            if (str_contains($url, (string) $needle)) {
                return $body;
            }
        }

        return null;
    }
}

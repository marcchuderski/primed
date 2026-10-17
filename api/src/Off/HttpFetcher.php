<?php

declare(strict_types=1);

namespace Primed\Off;

interface HttpFetcher
{
    /**
     * GET request; returns the body on HTTP 200, null on 404, throws OffUnavailable otherwise.
     */
    public function get(string $url): ?string;
}

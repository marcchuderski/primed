<?php

declare(strict_types=1);

namespace Primed\Log;

interface Logger
{
    /**
     * @param array<string, scalar|null> $context
     */
    public function log(string $level, string $message, array $context = []): void;
}

<?php

declare(strict_types=1);

namespace Primed\Log;

/**
 * Collects log records in memory (tests, CLI).
 */
final class MemoryLogger implements Logger
{
    /** @var list<array{level: string, message: string, context: array<string, scalar|null>}> */
    public array $records = [];

    public function log(string $level, string $message, array $context = []): void
    {
        $this->records[] = ['level' => $level, 'message' => $message, 'context' => FileLogger::redact($context)];
    }
}

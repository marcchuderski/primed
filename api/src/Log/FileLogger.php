<?php

declare(strict_types=1);

namespace Primed\Log;

/**
 * Writes JSON lines to a log file outside the web root. Sensitive context keys are redacted.
 */
final class FileLogger implements Logger
{
    private const SENSITIVE_KEY_PATTERN = '/pass|token|secret|cookie|session|csrf|authorization|key/i';

    public function __construct(private readonly string $file)
    {
    }

    public function log(string $level, string $message, array $context = []): void
    {
        $line = json_encode(
            [
                'time' => gmdate('Y-m-d\TH:i:s\Z'),
                'level' => $level,
                'message' => $message,
                'context' => self::redact($context),
            ],
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
                | JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR,
        );

        if ($line !== false) {
            @file_put_contents($this->file, $line . "\n", FILE_APPEND | LOCK_EX);
        }
    }

    /**
     * @param array<string, scalar|null> $context
     * @return array<string, scalar|null>
     */
    public static function redact(array $context): array
    {
        $result = [];
        foreach ($context as $key => $value) {
            $result[$key] = preg_match(self::SENSITIVE_KEY_PATTERN, $key) === 1 ? '[redacted]' : $value;
        }

        return $result;
    }
}

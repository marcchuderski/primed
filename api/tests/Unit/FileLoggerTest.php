<?php

declare(strict_types=1);

namespace Primed\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Primed\Log\FileLogger;

final class FileLoggerTest extends TestCase
{
    public function testRedactsSensitiveKeys(): void
    {
        $redacted = FileLogger::redact([
            'password' => 'hunter2',
            'sessionToken' => 'abc',
            'csrf' => 'x',
            'IP_HASH_KEY' => 'k',
            'userId' => 5,
            'path' => '/api/v1/health',
        ]);

        self::assertSame(
            [
                'password' => '[redacted]',
                'sessionToken' => '[redacted]',
                'csrf' => '[redacted]',
                'IP_HASH_KEY' => '[redacted]',
                'userId' => 5,
                'path' => '/api/v1/health',
            ],
            $redacted,
        );
    }

    public function testWritesJsonLines(): void
    {
        $file = tempnam(sys_get_temp_dir(), 'primed-log');
        self::assertIsString($file);

        (new FileLogger($file))->log('warning', 'Login failed', ['userId' => 1, 'password' => 'x']);
        $contents = (string) file_get_contents($file);
        unlink($file);

        self::assertStringContainsString('"message":"Login failed"', $contents);
        self::assertStringNotContainsString('"password":"x"', $contents);
    }
}

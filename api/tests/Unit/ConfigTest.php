<?php

declare(strict_types=1);

namespace Primed\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Primed\Config\Config;
use Primed\Config\ConfigException;

final class ConfigTest extends TestCase
{
    public function testReturnsValuesAndDefaults(): void
    {
        $config = Config::fromArray(['A' => 'x', 'N' => '42', 'EMPTY' => '']);

        self::assertSame('x', $config->string('A'));
        self::assertSame('d', $config->string('EMPTY', 'd'));
        self::assertSame(42, $config->int('N'));
        self::assertSame(7, $config->int('MISSING', 7));
    }

    public function testMissingRequiredKeyThrows(): void
    {
        $this->expectException(ConfigException::class);
        Config::fromArray([])->string('DB_PASS');
    }

    public function testNonIntegerThrows(): void
    {
        $this->expectException(ConfigException::class);
        Config::fromArray(['N' => '4x'])->int('N');
    }

    public function testMissingFileThrowsWithoutPath(): void
    {
        try {
            Config::fromEnvFile('/nonexistent/secret/.env');
            self::fail('Expected exception');
        } catch (ConfigException $e) {
            self::assertStringNotContainsString('/nonexistent', $e->getMessage());
        }
    }

    public function testDefaultsToProduction(): void
    {
        self::assertTrue(Config::fromArray([])->isProduction());
        self::assertFalse(Config::fromArray(['APP_ENV' => 'development'])->isProduction());
    }
}

<?php

declare(strict_types=1);

namespace Primed\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Primed\Config\ConfigException;
use Primed\Config\EnvParser;

final class EnvParserTest extends TestCase
{
    public function testParsesPlainQuotedAndEmptyValues(): void
    {
        $env = <<<'ENV'
            # comment
            APP_ENV=production

            DB_PASS="p@ss word#1"
            OFF_USER_AGENT='Primed/0.1'
            EMPTY=
            SPACED = value
            ENV;

        self::assertSame(
            [
                'APP_ENV' => 'production',
                'DB_PASS' => 'p@ss word#1',
                'OFF_USER_AGENT' => 'Primed/0.1',
                'EMPTY' => '',
                'SPACED' => 'value',
            ],
            EnvParser::parse($env),
        );
    }

    public function testRejectsInvalidLineWithoutLeakingItsContent(): void
    {
        try {
            EnvParser::parse("APP_ENV=dev\nsecret-value-without-key");
            self::fail('Expected exception');
        } catch (ConfigException $e) {
            self::assertSame('Invalid .env syntax on line 2', $e->getMessage());
            self::assertStringNotContainsString('secret', $e->getMessage());
        }
    }

    public function testRejectsUnterminatedQuote(): void
    {
        $this->expectException(ConfigException::class);
        EnvParser::parse('DB_PASS="abc');
    }

    public function testRejectsLowercaseKeys(): void
    {
        $this->expectException(ConfigException::class);
        EnvParser::parse('db_pass=abc');
    }
}

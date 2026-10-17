<?php

declare(strict_types=1);

namespace Primed\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Primed\Auth\PasswordPolicy;
use Primed\Cli\Console;

final class ConsoleTest extends TestCase
{
    public function testGeneratedPasswordsSatisfyThePolicyAndDiffer(): void
    {
        $policy = new PasswordPolicy(__DIR__ . '/../../resources/common-passwords.txt');
        $a = Console::generatePassword();
        $b = Console::generatePassword();

        self::assertMatchesRegularExpression('/^[A-Za-z2-9]{5}(-[A-Za-z2-9]{5}){3}$/', $a);
        self::assertNotSame($a, $b);
        self::assertSame([], $policy->validate($a, 'marcch'));
    }
}

<?php

declare(strict_types=1);

namespace Primed\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Primed\Auth\PasswordPolicy;

final class PasswordPolicyTest extends TestCase
{
    private PasswordPolicy $policy;

    protected function setUp(): void
    {
        $this->policy = new PasswordPolicy(__DIR__ . '/../../resources/common-passwords.txt');
    }

    public function testAcceptsLongUncommonPassphrase(): void
    {
        self::assertSame([], $this->policy->validate('Kaffee mit Hafermilch 2026', 'marcch'));
    }

    public function testRejectsShortPasswords(): void
    {
        self::assertNotSame([], $this->policy->validate('kurz1234567', 'marcch'));
    }

    public function testCountsCharactersNotBytes(): void
    {
        // 12 characters, more than 12 bytes.
        self::assertSame([], $this->policy->validate('äöüäöüäöüäöü', 'marcch'));
        self::assertNotSame([], $this->policy->validate('äöüäöüäöüäö', 'marcch'));
    }

    public function testRejectsCommonPasswordsCaseInsensitive(): void
    {
        self::assertNotSame([], $this->policy->validate('123456789012', 'marcch'));
        self::assertNotSame([], $this->policy->validate('QWERTYUIOPASDFGHJKL', 'marcch'));
    }

    public function testRejectsPasswordContainingUsername(): void
    {
        self::assertNotSame([], $this->policy->validate('mein-MARCCH-passwort', 'marcch'));
    }

    public function testRejectsOverlongPasswords(): void
    {
        self::assertNotSame([], $this->policy->validate(str_repeat('a', 1025), 'marcch'));
    }

    public function testRejectsInvalidUtf8(): void
    {
        self::assertNotSame([], $this->policy->validate("abcdefghijkl\xff", 'marcch'));
    }
}

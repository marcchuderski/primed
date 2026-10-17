<?php

declare(strict_types=1);

namespace Primed\Tests\Integration;

use Primed\Auth\PasswordHasher;
use Primed\Auth\PasswordPolicy;
use Primed\Auth\SessionRepository;
use Primed\Auth\UserRepository;
use Primed\Cli\UserAdmin;
use Primed\Database\Migrator;
use Primed\Support\FixedClock;
use RuntimeException;

final class UserAdminTest extends DatabaseTestCase
{
    private UserAdmin $admin;
    private UserRepository $users;
    private SessionRepository $sessions;
    private FixedClock $clock;
    private PasswordHasher $hasher;

    protected function setUp(): void
    {
        $pdo = self::freshDatabase();
        (new Migrator($pdo, __DIR__ . '/../../migrations'))->migrate();
        $this->users = new UserRepository($pdo);
        $this->sessions = new SessionRepository($pdo);
        $this->clock = new FixedClock();
        $this->hasher = new PasswordHasher(8192, 1);
        $this->admin = new UserAdmin(
            $this->users,
            $this->sessions,
            $this->hasher,
            new PasswordPolicy(__DIR__ . '/../../resources/common-passwords.txt'),
            $this->clock,
        );
    }

    public function testCreatesUserWithNormalizedUsernameAndHashedPassword(): void
    {
        $this->admin->create(' MarcCH ', ' Marc ', 'Kaffee mit Hafermilch 2026');

        $user = $this->users->findByUsername('marcch');
        self::assertNotNull($user);
        self::assertSame('Marc', $user->displayName);
        self::assertStringStartsWith('$argon2id$', $user->passwordHash);
        self::assertTrue($this->hasher->verify('Kaffee mit Hafermilch 2026', $user->passwordHash));
    }

    public function testRejectsInvalidInput(): void
    {
        foreach (
            [
                ['ma', 'Marc', 'Kaffee mit Hafermilch 2026'],
                ['marc ch', 'Marc', 'Kaffee mit Hafermilch 2026'],
                ['marcch', '', 'Kaffee mit Hafermilch 2026'],
                ['marcch', "Ma\u{0007}rc", 'Kaffee mit Hafermilch 2026'],
                ['marcch', 'Marc', 'zu kurz'],
                ['marcch', 'Marc', '123456789012'],
            ] as [$username, $displayName, $password]
        ) {
            try {
                $this->admin->create($username, $displayName, $password);
                self::fail('Accepted invalid input: ' . $username);
            } catch (RuntimeException) {
                $this->addToAssertionCount(1);
            }
        }
    }

    public function testRejectsDuplicateUsername(): void
    {
        $this->admin->create('marcch', 'Marc', 'Kaffee mit Hafermilch 2026');

        $this->expectException(RuntimeException::class);
        $this->admin->create('MARCCH', 'Other', 'Ein anderes langes Passwort');
    }

    public function testResetPasswordEndsAllSessions(): void
    {
        $id = $this->admin->create('marcch', 'Marc', 'Kaffee mit Hafermilch 2026');
        $now = $this->clock->now();
        $tokenHash = random_bytes(32);
        $this->sessions->create($id, $tokenHash, $now, $now->modify('+30 days'), $now->modify('+90 days'));

        $this->admin->resetPassword('marcch', 'Ein neues langes Passwort 1');

        self::assertNull($this->sessions->findActive($tokenHash, $now));
        $user = $this->users->findById($id);
        self::assertNotNull($user);
        self::assertTrue($this->hasher->verify('Ein neues langes Passwort 1', $user->passwordHash));
    }
}

<?php

declare(strict_types=1);

namespace Primed\Tests\Integration;

use PDO;
use Primed\App;
use Primed\Auth\AuthService;
use Primed\Auth\CsrfTokens;
use Primed\Auth\IpHasher;
use Primed\Auth\LoginAttemptRepository;
use Primed\Auth\PasswordHasher;
use Primed\Auth\PasswordPolicy;
use Primed\Auth\RateLimiter;
use Primed\Auth\SessionCookie;
use Primed\Auth\SessionRepository;
use Primed\Auth\UserRepository;
use Primed\Container;
use Primed\Database\Migrator;
use Primed\Day\DayTypeRepository;
use Primed\Day\UserSeeder;
use Primed\Day\WeekTemplateRepository;
use Primed\Food\FoodRepository;
use Primed\Food\FoodSeeder;
use Primed\Http\OriginGuard;
use Primed\Http\Request;
use Primed\Http\Response;
use Primed\Kernel;
use Primed\Log\MemoryLogger;
use Primed\Support\FixedClock;

/**
 * HTTP-level tests through the kernel with two seeded users: "marcch" (owner defaults) and "freund".
 * Accounts are created Thu 2026-10-15; "now" starts at Tue 2026-10-20 12:00 Berlin.
 */
abstract class ApiTestCase extends DatabaseTestCase
{
    protected const ORIGIN = 'https://primed.test';
    protected const PASSWORD = 'Kaffee mit Hafermilch 2026';

    protected PDO $pdo;
    protected FixedClock $clock;
    protected App $app;
    /** @var array<string, string> username => session token */
    protected array $tokens = [];
    /** @var array<string, string> username => csrf token */
    protected array $csrf = [];

    protected function setUp(): void
    {
        $this->pdo = self::freshDatabase();
        (new Migrator($this->pdo, __DIR__ . '/../../migrations'))->migrate();
        $this->clock = new FixedClock('2026-10-15 08:00:00');
        $hasher = new PasswordHasher(8192, 1);
        $users = new UserRepository($this->pdo);
        $seeder = new UserSeeder(
            new DayTypeRepository($this->pdo),
            new WeekTemplateRepository($this->pdo),
            new FoodSeeder(new FoodRepository($this->pdo)),
        );
        foreach (['marcch' => true, 'freund' => false] as $username => $owner) {
            $id = $users->create($username, ucfirst($username), $hasher->hash(self::PASSWORD), $this->clock->now());
            $seeder->seed($id, $owner, $this->clock->now());
        }

        $attempts = new LoginAttemptRepository($this->pdo);
        $service = new AuthService(
            $users,
            new SessionRepository($this->pdo),
            $attempts,
            new RateLimiter($attempts),
            $hasher,
            new PasswordPolicy(__DIR__ . '/../../resources/common-passwords.txt'),
            new CsrfTokens(random_bytes(32)),
            new IpHasher(random_bytes(32)),
            $this->clock,
            new MemoryLogger(),
        );
        $pdo = $this->pdo;
        $container = new Container(static fn (): PDO => $pdo, static fn (): AuthService => $service, $this->clock);
        $guard = new OriginGuard([self::ORIGIN]);
        $this->app = new App(Kernel::routes($container), new MemoryLogger(), '/api', $guard);

        $this->clock->advance('+5 days +2 hours'); // 2026-10-20 10:00 UTC = 12:00 Berlin
        foreach (['marcch', 'freund'] as $username) {
            $this->login($username);
        }
    }

    protected function login(string $username): void
    {
        $response = $this->app->handle(new Request(
            'POST',
            '/api/v1/auth/login',
            ['Origin' => self::ORIGIN, 'Content-Type' => 'application/json'],
            (string) json_encode(['username' => $username, 'password' => self::PASSWORD]),
            '203.0.113.7',
        ));
        self::assertSame(200, $response->status);
        $cookie = (string) $response->header('Set-Cookie');
        $this->tokens[$username] = substr($cookie, strlen(SessionCookie::NAME) + 1, 43);
        $csrf = self::json($response)['csrfToken'] ?? null;
        self::assertIsString($csrf);
        $this->csrf[$username] = $csrf;
    }

    /**
     * @param array<string, mixed>|null $json
     */
    protected function call(string $method, string $path, ?array $json = null, string $as = 'marcch'): Response
    {
        $headers = ['Origin' => self::ORIGIN, 'Content-Type' => 'application/json'];
        if ($method !== 'GET') {
            $headers['X-CSRF-Token'] = $this->csrf[$as] ?? '';
        }

        return $this->app->handle(new Request(
            $method,
            $path,
            $headers,
            $json === null ? '' : (string) json_encode($json),
            '203.0.113.7',
            [],
            [SessionCookie::NAME => $this->tokens[$as] ?? ''],
        ));
    }

    /**
     * @return array<string, mixed>
     */
    protected static function json(Response $response): array
    {
        $data = json_decode($response->body, true);
        self::assertIsArray($data, $response->body);

        /** @var array<string, mixed> $data */
        return $data;
    }
}

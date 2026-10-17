<?php

declare(strict_types=1);

namespace Primed\Tests\Integration;

use PDO;
use Primed\App;
use Primed\Container;
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
use Primed\Database\Migrator;
use Primed\Http\OriginGuard;
use Primed\Http\Request;
use Primed\Http\Response;
use Primed\Kernel;
use Primed\Log\MemoryLogger;
use Primed\Support\FixedClock;

/**
 * End-to-end auth flows through the HTTP kernel against the test database.
 */
final class AuthFlowTest extends DatabaseTestCase
{
    private const ORIGIN = 'https://primed.test';
    private const PASSWORD = 'Kaffee mit Hafermilch 2026';

    private PDO $pdo;
    private FixedClock $clock;
    private MemoryLogger $logger;
    private App $app;
    private PasswordHasher $hasher;

    protected function setUp(): void
    {
        $this->pdo = self::freshDatabase();
        (new Migrator($this->pdo, __DIR__ . '/../../migrations'))->migrate();
        $this->clock = new FixedClock();
        $this->logger = new MemoryLogger();
        // Cheap parameters keep the suite fast; production uses the defaults.
        $this->hasher = new PasswordHasher(8192, 1);

        $users = new UserRepository($this->pdo);
        $users->create('marcch', 'Marc', $this->hasher->hash(self::PASSWORD), $this->clock->now());

        $attempts = new LoginAttemptRepository($this->pdo);
        $service = new AuthService(
            $users,
            new SessionRepository($this->pdo),
            $attempts,
            new RateLimiter($attempts),
            $this->hasher,
            new PasswordPolicy(__DIR__ . '/../../resources/common-passwords.txt'),
            new CsrfTokens(random_bytes(32)),
            new IpHasher(random_bytes(32)),
            $this->clock,
            $this->logger,
        );

        $pdo = $this->pdo;
        $container = new Container(
            static fn (): PDO => $pdo,
            static fn (): AuthService => $service,
            $this->clock,
        );
        $this->app = new App(
            Kernel::routes($container),
            $this->logger,
            '/api',
            new OriginGuard([self::ORIGIN]),
        );
    }

    public function testLoginMeLogout(): void
    {
        $login = $this->login('marcch', self::PASSWORD);
        self::assertSame(200, $login->status);
        $body = self::body($login);
        self::assertSame(['id' => 1, 'username' => 'marcch', 'displayName' => 'Marc'], $body['user']);
        $token = self::cookieToken($login);
        $csrf = self::csrf($login);

        $me = $this->request('GET', '/api/v1/auth/me', $token);
        self::assertSame(200, $me->status);
        self::assertSame($csrf, self::body($me)['csrfToken']);

        $logout = $this->request('POST', '/api/v1/auth/logout', $token, $csrf);
        self::assertSame(204, $logout->status);
        self::assertStringContainsString('Max-Age=0', (string) $logout->header('Set-Cookie'));

        self::assertSame(401, $this->request('GET', '/api/v1/auth/me', $token)->status);
    }

    public function testUsernameIsCaseInsensitiveAndTrimmed(): void
    {
        self::assertSame(200, $this->login('  MarcCH ', self::PASSWORD)->status);
    }

    public function testWrongPasswordAndUnknownUserLookIdentical(): void
    {
        $wrong = $this->login('marcch', 'falsches Passwort 123');
        $unknown = $this->login('niemand', 'falsches Passwort 123');

        self::assertSame(401, $wrong->status);
        self::assertSame($wrong->body, $unknown->body);
        self::assertNull($wrong->header('Set-Cookie'));
    }

    public function testFifthFailureLocksPairAndLockExpires(): void
    {
        for ($i = 0; $i < 5; $i++) {
            self::assertSame(401, $this->login('marcch', 'falsch falsch falsch')->status);
        }

        $locked = $this->login('marcch', self::PASSWORD);
        self::assertSame(429, $locked->status);
        self::assertSame('900', $locked->header('Retry-After'));

        $this->clock->advance('+901 seconds');
        self::assertSame(200, $this->login('marcch', self::PASSWORD)->status);
    }

    public function testMissingCsrfTokenIsRejected(): void
    {
        $token = self::cookieToken($this->login('marcch', self::PASSWORD));

        self::assertSame(403, $this->request('POST', '/api/v1/auth/logout', $token)->status);
        self::assertSame(403, $this->request('POST', '/api/v1/auth/logout', $token, 'forged')->status);
        self::assertSame(200, $this->request('GET', '/api/v1/auth/me', $token)->status);
    }

    public function testForeignOriginCannotLogIn(): void
    {
        $response = $this->app->handle(new Request(
            'POST',
            '/api/v1/auth/login',
            ['Origin' => 'https://evil.example', 'Content-Type' => 'application/json'],
            (string) json_encode(['username' => 'marcch', 'password' => self::PASSWORD]),
            '203.0.113.7',
        ));

        self::assertSame(403, $response->status);
    }

    public function testSlidingExpiryAndAbsoluteLimit(): void
    {
        $token = self::cookieToken($this->login('marcch', self::PASSWORD));

        // Used every 29 days: stays logged in thanks to the sliding expiry …
        for ($i = 0; $i < 3; $i++) {
            $this->clock->advance('+29 days');
            $me = $this->request('GET', '/api/v1/auth/me', $token);
            self::assertSame(200, $me->status, 'day ' . (($i + 1) * 29));
            self::assertNotNull($me->header('Set-Cookie'));
        }

        // … but never beyond 90 days after login.
        $this->clock->advance('+4 days');
        self::assertSame(401, $this->request('GET', '/api/v1/auth/me', $token)->status);
    }

    public function testIdleExpiryAfterThirtyDays(): void
    {
        $token = self::cookieToken($this->login('marcch', self::PASSWORD));
        $this->clock->advance('+30 days +1 second');

        self::assertSame(401, $this->request('GET', '/api/v1/auth/me', $token)->status);
    }

    public function testLogoutEverywhereEndsAllSessions(): void
    {
        $first = $this->login('marcch', self::PASSWORD);
        $second = $this->login('marcch', self::PASSWORD);
        $csrf = self::csrf($second);

        $logoutAll = $this->request('POST', '/api/v1/auth/logout-all', self::cookieToken($second), $csrf);
        self::assertSame(204, $logoutAll->status);

        self::assertSame(401, $this->request('GET', '/api/v1/auth/me', self::cookieToken($first))->status);
        self::assertSame(401, $this->request('GET', '/api/v1/auth/me', self::cookieToken($second))->status);
    }

    public function testPasswordChangeEndsOtherSessionsOnly(): void
    {
        $other = $this->login('marcch', self::PASSWORD);
        $current = $this->login('marcch', self::PASSWORD);
        $csrf = self::csrf($current);
        $newPassword = 'Ein ganz neues Passwort 77';

        $weak = $this->request('POST', '/api/v1/auth/password', self::cookieToken($current), $csrf, [
            'currentPassword' => self::PASSWORD,
            'newPassword' => '123456789012',
        ]);
        self::assertSame(422, $weak->status);

        $wrongCurrent = $this->request('POST', '/api/v1/auth/password', self::cookieToken($current), $csrf, [
            'currentPassword' => 'nicht das richtige',
            'newPassword' => $newPassword,
        ]);
        self::assertSame(422, $wrongCurrent->status);

        $changed = $this->request('POST', '/api/v1/auth/password', self::cookieToken($current), $csrf, [
            'currentPassword' => self::PASSWORD,
            'newPassword' => $newPassword,
        ]);
        self::assertSame(204, $changed->status);

        self::assertSame(200, $this->request('GET', '/api/v1/auth/me', self::cookieToken($current))->status);
        self::assertSame(401, $this->request('GET', '/api/v1/auth/me', self::cookieToken($other))->status);
        self::assertSame(401, $this->login('marcch', self::PASSWORD)->status);
        self::assertSame(200, $this->login('marcch', $newPassword)->status);
    }

    public function testTokensAreStoredHashedAndLogsContainNoSecrets(): void
    {
        $login = $this->login('marcch', self::PASSWORD);
        $token = self::cookieToken($login);

        $statement = $this->pdo->query('SELECT token_hash FROM sessions');
        self::assertNotFalse($statement);
        $stored = $statement->fetchColumn();
        self::assertSame(hash('sha256', $token, true), $stored);

        $this->login('marcch', 'falsch falsch falsch');
        $logs = (string) json_encode($this->logger->records);
        self::assertStringNotContainsString(self::PASSWORD, $logs);
        self::assertStringNotContainsString('falsch falsch falsch', $logs);
        self::assertStringNotContainsString($token, $logs);
    }

    public function testOldLoginAttemptsArePurgedOnEveryAttempt(): void
    {
        $this->login('marcch', 'falsch falsch falsch');
        $this->clock->advance('+31 days');
        $this->login('niemand', 'falsch falsch falsch');

        $statement = $this->pdo->query('SELECT COUNT(*) FROM login_attempts');
        self::assertNotFalse($statement);
        self::assertSame(1, (int) $statement->fetchColumn());
    }

    public function testMalformedCookiesAreIgnored(): void
    {
        foreach (['', 'x', str_repeat('a', 500), "abc\0def"] as $cookie) {
            self::assertSame(401, $this->request('GET', '/api/v1/auth/me', $cookie)->status);
        }
    }

    private function login(string $username, string $password): Response
    {
        return $this->app->handle(new Request(
            'POST',
            '/api/v1/auth/login',
            ['Origin' => self::ORIGIN, 'Content-Type' => 'application/json'],
            (string) json_encode(['username' => $username, 'password' => $password]),
            '203.0.113.7',
        ));
    }

    /**
     * @param array<string, string>|null $json
     */
    private function request(
        string $method,
        string $path,
        string $token,
        ?string $csrf = null,
        ?array $json = null,
    ): Response {
        $headers = ['Origin' => self::ORIGIN, 'Content-Type' => 'application/json'];
        if ($csrf !== null) {
            $headers['X-CSRF-Token'] = $csrf;
        }

        return $this->app->handle(new Request(
            $method,
            $path,
            $headers,
            $json === null ? '' : (string) json_encode($json),
            '203.0.113.7',
            [],
            [SessionCookie::NAME => $token],
        ));
    }

    private static function cookieToken(Response $response): string
    {
        $header = (string) $response->header('Set-Cookie');
        self::assertMatchesRegularExpression('/^__Host-primed_session=([A-Za-z0-9_-]{43});/', $header);

        return substr($header, strlen(SessionCookie::NAME) + 1, 43);
    }

    private static function csrf(Response $response): string
    {
        $csrf = self::body($response)['csrfToken'] ?? null;
        self::assertIsString($csrf);

        return $csrf;
    }

    /**
     * @return array<string, mixed>
     */
    private static function body(Response $response): array
    {
        $data = json_decode($response->body, true);
        self::assertIsArray($data);

        /** @var array<string, mixed> $data */
        return $data;
    }
}

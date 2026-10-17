<?php

declare(strict_types=1);

namespace Primed;

use PDO;
use Primed\Auth\AuthService;
use Primed\Auth\CsrfTokens;
use Primed\Auth\IpHasher;
use Primed\Auth\Keys;
use Primed\Auth\LoginAttemptRepository;
use Primed\Auth\PasswordHasher;
use Primed\Auth\PasswordPolicy;
use Primed\Auth\RateLimiter;
use Primed\Auth\SessionRepository;
use Primed\Auth\UserRepository;
use Primed\Config\Config;
use Primed\Controller\AuthController;
use Primed\Controller\HealthController;
use Primed\Database\ConnectionFactory;
use Primed\Http\HttpException;
use Primed\Http\OriginGuard;
use Primed\Http\Request;
use Primed\Http\Router;
use Primed\Log\FileLogger;
use Primed\Log\Logger;
use Primed\Support\Clock;
use Primed\Support\SystemClock;

/**
 * Wires the application together and runs one request.
 */
final class Kernel
{
    public const MAX_BODY_BYTES = 65536;

    public function __construct(private readonly App $app)
    {
    }

    public static function create(Config $config, string $appRoot): self
    {
        $logger = new FileLogger($appRoot . '/var/log/app.log');
        $pdo = null;
        $connect = static function () use (&$pdo, $config): PDO {
            return $pdo ??= ConnectionFactory::create($config);
        };

        $clock = new SystemClock();
        $router = self::routes(
            static fn (): AuthService => self::authService($config, $connect(), $clock, $logger, $appRoot),
            $clock,
        );

        $origins = [OriginGuard::originOf($config->string('APP_URL'))];
        foreach (explode(',', $config->string('ALLOWED_ORIGINS', '')) as $extra) {
            if (trim($extra) !== '') {
                $origins[] = OriginGuard::originOf(trim($extra));
            }
        }

        return new self(new App($router, $logger, $config->string('API_BASE_PATH', '/api'), new OriginGuard($origins)));
    }

    public static function authService(
        Config $config,
        PDO $pdo,
        Clock $clock,
        Logger $logger,
        string $appRoot,
    ): AuthService {
        $keys = Keys::fromBase64($config->string('APP_KEY'));
        $attempts = new LoginAttemptRepository($pdo);

        return new AuthService(
            new UserRepository($pdo),
            new SessionRepository($pdo),
            $attempts,
            new RateLimiter($attempts),
            new PasswordHasher(),
            new PasswordPolicy($appRoot . '/resources/common-passwords.txt'),
            new CsrfTokens($keys->csrfKey()),
            new IpHasher($keys->ipHashKey()),
            $clock,
            $logger,
            $config->int('SESSION_IDLE_DAYS', 30),
            $config->int('SESSION_ABSOLUTE_DAYS', 90),
        );
    }

    /**
     * @param (\Closure(): AuthService)|null $authFactory lazily builds the auth service (DB connection on demand)
     */
    public static function routes(?\Closure $authFactory = null, ?Clock $clock = null): Router
    {
        $router = new Router();
        $health = new HealthController();
        $router->add('GET', '/v1/health', $health->show(...));

        if ($authFactory !== null) {
            $clock ??= new SystemClock();
            $controller = null;
            $auth = static function () use (&$controller, $authFactory, $clock): AuthController {
                return $controller ??= new AuthController($authFactory(), $clock);
            };
            $router->add('POST', '/v1/auth/login', static fn (Request $r, array $p) => $auth()->login($r, $p));
            $router->add('GET', '/v1/auth/me', static fn (Request $r, array $p) => $auth()->me($r, $p));
            $router->add('POST', '/v1/auth/logout', static fn (Request $r, array $p) => $auth()->logout($r, $p));
            $router->add(
                'POST',
                '/v1/auth/logout-all',
                static fn (Request $r, array $p) => $auth()->logoutEverywhere($r, $p),
            );
            $router->add(
                'POST',
                '/v1/auth/password',
                static fn (Request $r, array $p) => $auth()->changePassword($r, $p),
            );
        }

        return $router;
    }

    public function run(): void
    {
        try {
            $request = Request::fromGlobals(self::MAX_BODY_BYTES);
        } catch (HttpException $e) {
            App::error($e->status, $e->errorCode, $e->getMessage())->send();

            return;
        }

        $this->app->handle($request)->send();
    }
}

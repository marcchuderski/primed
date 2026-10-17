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
use Primed\Controller\WeekTemplateController;
use Primed\Controller\SettingsController;
use Primed\Controller\DayTypeController;
use Primed\Controller\EntryController;
use Primed\Controller\FoodController;
use Primed\Off\CurlFetcher;
use Primed\Controller\DayController;
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
        $clock = new SystemClock();
        $container = new Container(
            static fn (): PDO => ConnectionFactory::create($config),
            static fn (PDO $pdo, Clock $c): AuthService => self::authService($config, $pdo, $c, $logger, $appRoot),
            $clock,
            static function () use ($config): CurlFetcher {
                $agent = sprintf(
                    '%s (%s)',
                    $config->string('OFF_USER_AGENT', 'Primed/0.1'),
                    $config->string('OFF_CONTACT_EMAIL'),
                );

                return new CurlFetcher($agent);
            },
        );

        $origins = [OriginGuard::originOf($config->string('APP_URL'))];
        foreach (explode(',', $config->string('ALLOWED_ORIGINS', '')) as $extra) {
            if (trim($extra) !== '') {
                $origins[] = OriginGuard::originOf(trim($extra));
            }
        }

        return new self(new App(
            self::routes($container),
            $logger,
            $config->string('API_BASE_PATH', '/api'),
            new OriginGuard($origins),
        ));
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

    public static function routes(?Container $c = null): Router
    {
        $router = new Router();
        $health = new HealthController();
        $router->add('GET', '/v1/health', $health->show(...));

        if ($c === null) {
            return $router;
        }

        $auth = new AuthController($c);
        $router->add('POST', '/v1/auth/login', $auth->login(...));
        $router->add('GET', '/v1/auth/me', $auth->me(...));
        $router->add('POST', '/v1/auth/logout', $auth->logout(...));
        $router->add('POST', '/v1/auth/logout-all', $auth->logoutEverywhere(...));
        $router->add('POST', '/v1/auth/password', $auth->changePassword(...));

        $settings = new SettingsController($c);
        $router->add('GET', '/v1/settings', $settings->show(...));
        $router->add('PATCH', '/v1/settings', $settings->update(...));

        $dayTypes = new DayTypeController($c);
        $router->add('GET', '/v1/day-types', $dayTypes->index(...));
        $router->add('POST', '/v1/day-types', $dayTypes->create(...));
        $router->add('PATCH', '/v1/day-types/{id}', $dayTypes->update(...));
        $router->add('DELETE', '/v1/day-types/{id}', $dayTypes->delete(...));

        $template = new WeekTemplateController($c);
        $router->add('GET', '/v1/week-template', $template->show(...));
        $router->add('PUT', '/v1/week-template', $template->replace(...));

        $days = new DayController($c);
        $router->add('GET', '/v1/days/today', $days->today(...));
        $router->add('GET', '/v1/days/{date}', $days->show(...));
        $router->add('PUT', '/v1/days/{date}', $days->update(...));

        $foods = new FoodController($c);
        $router->add('GET', '/v1/foods', $foods->index(...));
        $router->add('POST', '/v1/foods', $foods->create(...));
        $router->add('GET', '/v1/foods/frequent', $foods->frequent(...));
        $router->add('GET', '/v1/foods/barcode/{ean}', $foods->barcode(...));
        $router->add('GET', '/v1/foods/{id}', $foods->show(...));
        $router->add('PATCH', '/v1/foods/{id}', $foods->update(...));
        $router->add('DELETE', '/v1/foods/{id}', $foods->delete(...));
        $router->add('GET', '/v1/off/search', $foods->searchOnline(...));

        $entries = new EntryController($c);
        $router->add('GET', '/v1/days/{date}/entries', $entries->index(...));
        $router->add('POST', '/v1/entries', $entries->create(...));
        $router->add('POST', '/v1/entries/shake', $entries->createShake(...));
        $router->add('GET', '/v1/shakes', $entries->shakes(...));
        $router->add('PATCH', '/v1/entries/{id}', $entries->update(...));
        $router->add('DELETE', '/v1/entries/{id}', $entries->delete(...));

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

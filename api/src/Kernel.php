<?php

declare(strict_types=1);

namespace Primed;

use Primed\Config\Config;
use Primed\Controller\HealthController;
use Primed\Http\HttpException;
use Primed\Http\Request;
use Primed\Http\Router;
use Primed\Log\FileLogger;

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

        return new self(new App(self::routes(), $logger, $config->string('API_BASE_PATH', '/api')));
    }

    public static function routes(): Router
    {
        $router = new Router();
        $health = new HealthController();
        $router->add('GET', '/v1/health', $health->show(...));

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

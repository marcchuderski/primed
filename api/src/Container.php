<?php

declare(strict_types=1);

namespace Primed;

use PDO;
use Primed\Auth\AuthService;
use Primed\Auth\RequestAuthenticator;
use Primed\Day\DayRepository;
use Primed\Day\DayService;
use Primed\Day\DayTypeRepository;
use Primed\Day\LogicalCalendar;
use Primed\Day\SettingsRepository;
use Primed\Day\UserSeeder;
use Primed\Day\WeekTemplateRepository;
use Primed\Entry\EntryRepository;
use Primed\Entry\EntryService;
use Primed\Food\FoodRepository;
use Primed\Food\FoodService;
use Primed\Food\ShakeService;
use Primed\Off\HttpFetcher;
use Primed\Off\OffClient;
use Primed\Off\OffUnavailable;
use Primed\Support\UserRateLimit;
use Primed\Food\FoodSeeder;
use Primed\Support\Clock;

/**
 * Lazily built services for one request. The database connection is opened on first use only.
 */
final class Container
{
    private ?PDO $pdo = null;
    private ?AuthService $auth = null;
    private ?DayService $days = null;
    private ?EntryService $entries = null;
    private ?FoodService $foods = null;

    /**
     * @param \Closure(): PDO $connect
     * @param \Closure(PDO, Clock): AuthService $authFactory
     * @param (\Closure(): HttpFetcher)|null $offFetcher outbound HTTP for Open Food Facts
     */
    public function __construct(
        private readonly \Closure $connect,
        private readonly \Closure $authFactory,
        public readonly Clock $clock,
        private readonly ?\Closure $offFetcher = null,
    ) {
    }

    public function foods(): FoodService
    {
        return $this->foods ??= new FoodService(
            new FoodRepository($this->pdo()),
            $this->settings(),
            new LogicalCalendar($this->clock),
            $this->clock,
            new UserRateLimit($this->pdo(), $this->clock),
            function (): OffClient {
                if ($this->offFetcher === null) {
                    throw new OffUnavailable('Open Food Facts not configured');
                }

                return new OffClient(($this->offFetcher)(), $this->pdo(), $this->clock);
            },
        );
    }

    public function pdo(): PDO
    {
        return $this->pdo ??= ($this->connect)();
    }

    public function auth(): AuthService
    {
        return $this->auth ??= ($this->authFactory)($this->pdo(), $this->clock);
    }

    public function authenticator(): RequestAuthenticator
    {
        return new RequestAuthenticator($this->auth());
    }

    public function days(): DayService
    {
        return $this->days ??= new DayService(
            $this->pdo(),
            new DayRepository($this->pdo()),
            new DayTypeRepository($this->pdo()),
            new WeekTemplateRepository($this->pdo()),
            $this->settings(),
            new LogicalCalendar($this->clock),
            $this->clock,
        );
    }

    public function entries(): EntryService
    {
        return $this->entries ??= new EntryService(
            new EntryRepository($this->pdo()),
            new FoodRepository($this->pdo()),
            $this->days(),
            $this->settings(),
            $this->clock,
            $this->shakes(),
        );
    }

    public function shakes(): ShakeService
    {
        return new ShakeService($this->pdo(), new FoodRepository($this->pdo()));
    }

    public function settings(): SettingsRepository
    {
        return new SettingsRepository($this->pdo());
    }

    public function dayTypes(): DayTypeRepository
    {
        return new DayTypeRepository($this->pdo());
    }

    public function seeder(): UserSeeder
    {
        return new UserSeeder(
            new DayTypeRepository($this->pdo()),
            new WeekTemplateRepository($this->pdo()),
            new FoodSeeder(new FoodRepository($this->pdo())),
        );
    }
}

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
use Primed\Support\Clock;

/**
 * Lazily built services for one request. The database connection is opened on first use only.
 */
final class Container
{
    private ?PDO $pdo = null;
    private ?AuthService $auth = null;
    private ?DayService $days = null;

    /**
     * @param \Closure(): PDO $connect
     * @param \Closure(PDO, Clock): AuthService $authFactory
     */
    public function __construct(
        private readonly \Closure $connect,
        private readonly \Closure $authFactory,
        public readonly Clock $clock,
    ) {
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
        return new UserSeeder(new DayTypeRepository($this->pdo()), new WeekTemplateRepository($this->pdo()));
    }
}

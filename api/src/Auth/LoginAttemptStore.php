<?php

declare(strict_types=1);

namespace Primed\Auth;

use DateTimeImmutable;

interface LoginAttemptStore
{
    public function record(string $username, string $ipHash, bool $success, DateTimeImmutable $at): void;

    /** @return list<LoginAttempt> ascending by time */
    public function forPair(string $username, string $ipHash, DateTimeImmutable $since): array;

    /** @return list<LoginAttempt> ascending by time */
    public function forUsername(string $username, DateTimeImmutable $since): array;

    /** @return list<LoginAttempt> ascending by time */
    public function forIp(string $ipHash, DateTimeImmutable $since): array;

    public function purgeBefore(DateTimeImmutable $before): void;
}

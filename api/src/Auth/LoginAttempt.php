<?php

declare(strict_types=1);

namespace Primed\Auth;

use DateTimeImmutable;

final class LoginAttempt
{
    public function __construct(public readonly DateTimeImmutable $at, public readonly bool $success)
    {
    }
}

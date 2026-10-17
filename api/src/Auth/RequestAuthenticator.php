<?php

declare(strict_types=1);

namespace Primed\Auth;

use Primed\Http\Request;

/**
 * Resolves the session of a request for protected endpoints; state-changing requests also need the CSRF token.
 */
final class RequestAuthenticator
{
    public const CSRF_HEADER = 'X-CSRF-Token';

    public function __construct(private readonly AuthService $auth)
    {
    }

    public function require(Request $request): AuthContext
    {
        $context = $this->auth->authenticate($request->cookie(SessionCookie::NAME));
        if ($context === null) {
            throw AuthException::unauthenticated();
        }
        if (!in_array($request->method, ['GET', 'HEAD'], true)) {
            $this->auth->verifyCsrf($context, $request->header(self::CSRF_HEADER));
        }

        return $context;
    }
}

<?php

declare(strict_types=1);

namespace Primed\Controller;

use Primed\Auth\AuthContext;
use Primed\Auth\AuthException;
use Primed\Auth\AuthService;
use Primed\Auth\SessionCookie;
use Primed\Http\HttpException;
use Primed\Http\Request;
use Primed\Http\Response;
use Primed\Support\Clock;

final class AuthController
{
    public const CSRF_HEADER = 'X-CSRF-Token';

    public function __construct(private readonly AuthService $auth, private readonly Clock $clock)
    {
    }

    /**
     * @param array<string, string> $params
     */
    public function login(Request $request, array $params): Response
    {
        $body = $request->json();
        $username = self::stringField($body, 'username', 64);
        $password = self::stringField($body, 'password', 4096);

        $result = $this->auth->login($username, $password, $request->clientIp);

        $response = Response::json(['user' => $result->user->toPublic(), 'csrfToken' => $result->csrfToken]);

        return SessionCookie::set($response, $result->sessionToken, $result->cookieExpiresAt, $this->clock->now());
    }

    /**
     * @param array<string, string> $params
     */
    public function me(Request $request, array $params): Response
    {
        $context = $this->requireAuth($request, false);
        $response = Response::json(['user' => $context->user->toPublic(), 'csrfToken' => $context->csrfToken]);

        return $this->refreshCookie($request, $response, $context);
    }

    /**
     * @param array<string, string> $params
     */
    public function logout(Request $request, array $params): Response
    {
        $this->auth->logout($this->requireAuth($request, true));

        return SessionCookie::clear(Response::noContent());
    }

    /**
     * @param array<string, string> $params
     */
    public function logoutEverywhere(Request $request, array $params): Response
    {
        $this->auth->logoutEverywhere($this->requireAuth($request, true));

        return SessionCookie::clear(Response::noContent());
    }

    /**
     * @param array<string, string> $params
     */
    public function changePassword(Request $request, array $params): Response
    {
        $context = $this->requireAuth($request, true);
        $body = $request->json();
        $this->auth->changePassword(
            $context,
            self::stringField($body, 'currentPassword', 4096),
            self::stringField($body, 'newPassword', 4096),
            $request->clientIp,
        );

        return Response::noContent();
    }

    public function requireAuth(Request $request, bool $checkCsrf): AuthContext
    {
        $context = $this->auth->authenticate($request->cookie(SessionCookie::NAME));
        if ($context === null) {
            throw AuthException::unauthenticated();
        }
        if ($checkCsrf) {
            $this->auth->verifyCsrf($context, $request->header(self::CSRF_HEADER));
        }

        return $context;
    }

    private function refreshCookie(Request $request, Response $response, AuthContext $context): Response
    {
        $token = $request->cookie(SessionCookie::NAME);
        if ($context->refreshedCookieExpiry === null || $token === null) {
            return $response;
        }

        return SessionCookie::set($response, $token, $context->refreshedCookieExpiry, $this->clock->now());
    }

    /**
     * @param array<string, mixed> $body
     */
    private static function stringField(array $body, string $field, int $maxBytes): string
    {
        $value = $body[$field] ?? null;
        if (!is_string($value) || $value === '' || strlen($value) > $maxBytes) {
            throw new HttpException(422, 'validation_failed', 'Bitte fülle alle Felder korrekt aus.');
        }

        return $value;
    }
}

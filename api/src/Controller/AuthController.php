<?php

declare(strict_types=1);

namespace Primed\Controller;

use Primed\Auth\AuthContext;
use Primed\Container;
use Primed\Auth\SessionCookie;
use Primed\Http\HttpException;
use Primed\Http\Input;
use Primed\Http\Request;
use Primed\Http\Response;

final class AuthController
{
    public function __construct(private readonly Container $c)
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

        $result = $this->c->auth()->login($username, $password, $request->clientIp);

        $response = Response::json(['user' => $result->user->toPublic(), 'csrfToken' => $result->csrfToken]);

        return SessionCookie::set($response, $result->sessionToken, $result->cookieExpiresAt, $this->c->clock->now());
    }

    /**
     * @param array<string, string> $params
     */
    public function me(Request $request, array $params): Response
    {
        $context = $this->requireAuth($request);
        $response = Response::json(['user' => $context->user->toPublic(), 'csrfToken' => $context->csrfToken]);

        return $this->refreshCookie($request, $response, $context);
    }

    /**
     * @param array<string, string> $params
     */
    public function logout(Request $request, array $params): Response
    {
        $this->c->auth()->logout($this->requireAuth($request));

        return SessionCookie::clear(Response::noContent());
    }

    /**
     * @param array<string, string> $params
     */
    public function logoutEverywhere(Request $request, array $params): Response
    {
        $this->c->auth()->logoutEverywhere($this->requireAuth($request));

        return SessionCookie::clear(Response::noContent());
    }

    /**
     * @param array<string, string> $params
     */
    public function changePassword(Request $request, array $params): Response
    {
        $context = $this->requireAuth($request);
        $body = $request->json();
        $this->c->auth()->changePassword(
            $context,
            self::stringField($body, 'currentPassword', 4096),
            self::stringField($body, 'newPassword', 4096),
            $request->clientIp,
        );

        return Response::noContent();
    }

    /**
     * @param array<string, string> $params
     */
    public function updateProfile(Request $request, array $params): Response
    {
        $context = $this->requireAuth($request);
        $input = Input::fromRequest($request);
        $user = $this->c->auth()->updateProfile(
            $context,
            $input->text('displayName', 1, 64, 'Display-Name'),
            $input->text('username', 3, 32, 'Username'),
        );

        return Response::json(['user' => $user->toPublic()]);
    }

    /**
     * @param array<string, string> $params
     */
    public function deleteAccount(Request $request, array $params): Response
    {
        $context = $this->requireAuth($request);
        $body = $request->json();
        $this->c->auth()->deleteAccount($context, self::stringField($body, 'password', 4096), $request->clientIp);

        return SessionCookie::clear(Response::noContent());
    }

    private function requireAuth(Request $request): AuthContext
    {
        return $this->c->authenticator()->require($request);
    }

    private function refreshCookie(Request $request, Response $response, AuthContext $context): Response
    {
        $token = $request->cookie(SessionCookie::NAME);
        if ($context->refreshedCookieExpiry === null || $token === null) {
            return $response;
        }

        return SessionCookie::set($response, $token, $context->refreshedCookieExpiry, $this->c->clock->now());
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

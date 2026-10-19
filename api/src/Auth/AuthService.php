<?php

declare(strict_types=1);

namespace Primed\Auth;

use DateTimeImmutable;
use Primed\Http\HttpException;
use Primed\Log\Logger;
use Primed\Support\Clock;

final class AuthService
{
    /** last_seen_at is written at most this often (avoids a DB write on every request). */
    private const TOUCH_INTERVAL_SECONDS = 3600;
    /** Ended sessions and old login attempts are deleted after this many days. */
    private const RETENTION_DAYS = 30;

    public function __construct(
        private readonly UserRepository $users,
        private readonly SessionRepository $sessions,
        private readonly LoginAttemptStore $attempts,
        private readonly RateLimiter $rateLimiter,
        private readonly PasswordHasher $hasher,
        private readonly PasswordPolicy $policy,
        private readonly CsrfTokens $csrf,
        private readonly IpHasher $ipHasher,
        private readonly Clock $clock,
        private readonly Logger $logger,
        private readonly int $idleDays = 30,
        private readonly int $absoluteDays = 90,
    ) {
    }

    public function login(string $username, string $password, string $clientIp): LoginResult
    {
        $now = $this->clock->now();
        $normalized = mb_substr(UsernameNormalizer::normalize($username), 0, 64, 'UTF-8');
        $ipHash = $this->ipHasher->hash($clientIp);
        // Short HMAC prefix: correlates events per client without storing the IP (SECURITY.md).
        $ipRef = substr(bin2hex($ipHash), 0, 12);
        // Runs on every attempt (indexed DELETE) so failed-login floods cannot grow the table unbounded.
        $this->purge($now);

        $retryAfter = $this->rateLimiter->retryAfter($normalized, $ipHash, $now);
        if ($retryAfter !== null) {
            $this->logger->log('warning', 'Login throttled', ['retryAfter' => $retryAfter, 'ip' => $ipRef]);
            throw AuthException::rateLimited($retryAfter);
        }

        $user = UsernameNormalizer::isValid($normalized) && strlen($password) <= PasswordPolicy::MAX_BYTES
            ? $this->users->findByUsername($normalized)
            : null;

        if ($user === null) {
            $this->hasher->verifyDummy($password);
            $this->attempts->record($normalized, $ipHash, false, $now);
            $this->logger->log('notice', 'Login failed', ['reason' => 'unknown_user', 'ip' => $ipRef]);
            throw AuthException::invalidCredentials();
        }

        if (!$this->hasher->verify($password, $user->passwordHash)) {
            $this->attempts->record($normalized, $ipHash, false, $now);
            $this->logger->log('notice', 'Login failed', [
                'userId' => $user->id,
                'reason' => 'wrong_password',
                'ip' => $ipRef,
            ]);
            throw AuthException::invalidCredentials();
        }

        $this->attempts->record($normalized, $ipHash, true, $now);

        if ($this->hasher->needsRehash($user->passwordHash)) {
            $this->users->updatePasswordHash($user->id, $this->hasher->hash($password), null);
        }

        $token = self::newToken();
        $tokenHash = self::tokenHash($token);
        $absolute = $now->modify('+' . $this->absoluteDays . ' days');
        $expires = self::earliest($now->modify('+' . $this->idleDays . ' days'), $absolute);
        $this->sessions->create($user->id, $tokenHash, $now, $expires, $absolute);
        $this->logger->log('info', 'Login succeeded', ['userId' => $user->id, 'ip' => $ipRef]);

        return new LoginResult($user, $token, $this->csrf->forSession($tokenHash), $expires);
    }

    /**
     * Resolves the session cookie; extends the sliding expiry (max. absolute limit).
     */
    public function authenticate(?string $token): ?AuthContext
    {
        if ($token === null || !self::isWellFormedToken($token)) {
            return null;
        }

        $now = $this->clock->now();
        $tokenHash = self::tokenHash($token);
        $session = $this->sessions->findActive($tokenHash, $now);
        if ($session === null) {
            return null;
        }

        $user = $this->users->findById($session->userId);
        if ($user === null) {
            return null;
        }

        $refreshed = null;
        if ($now->getTimestamp() - $session->lastSeenAt->getTimestamp() >= self::TOUCH_INTERVAL_SECONDS) {
            $refreshed = self::earliest($now->modify('+' . $this->idleDays . ' days'), $session->absoluteExpiresAt);
            $this->sessions->touch($session->id, $now, $refreshed);
        }

        return new AuthContext($user, $session, $this->csrf->forSession($tokenHash), $refreshed);
    }

    public function verifyCsrf(AuthContext $context, ?string $candidate): void
    {
        if (!$this->csrf->isValid($context->session->tokenHash, $candidate)) {
            $this->logger->log('warning', 'CSRF check failed', ['userId' => $context->user->id]);
            throw AuthException::csrf();
        }
    }

    public function logout(AuthContext $context): void
    {
        $this->sessions->revoke($context->session->id, $this->clock->now());
        $this->logger->log('info', 'Logout', ['userId' => $context->user->id]);
    }

    public function logoutEverywhere(AuthContext $context): void
    {
        $this->sessions->revokeAllForUser($context->user->id, $this->clock->now());
        $this->logger->log('info', 'Logout everywhere', ['userId' => $context->user->id]);
    }

    /**
     * Changes the password and ends all other sessions; the current session stays valid.
     */
    public function changePassword(AuthContext $context, string $current, string $new, string $clientIp): void
    {
        $now = $this->clock->now();
        $user = $context->user;
        $ipHash = $this->ipHasher->hash($clientIp);

        $retryAfter = $this->rateLimiter->retryAfter($user->username, $ipHash, $now);
        if ($retryAfter !== null) {
            throw AuthException::rateLimited($retryAfter);
        }

        if (strlen($current) > PasswordPolicy::MAX_BYTES || !$this->hasher->verify($current, $user->passwordHash)) {
            $this->attempts->record($user->username, $ipHash, false, $now);
            $this->logger->log('notice', 'Password change failed', ['userId' => $user->id]);
            throw new HttpException(422, 'invalid_current_password', 'Das aktuelle Passwort ist falsch.');
        }

        $errors = $this->policy->validate($new, $user->username);
        if ($errors !== []) {
            throw new HttpException(422, 'weak_password', implode(' ', $errors));
        }

        $this->users->updatePasswordHash($user->id, $this->hasher->hash($new), $now);
        $this->sessions->revokeAllForUser($user->id, $now, $context->session->id);
        $this->logger->log('info', 'Password changed', ['userId' => $user->id]);
    }

    /**
     * Changes display name and username (unique, D-079 rules).
     */
    public function updateProfile(AuthContext $context, string $displayName, string $username): User
    {
        $normalized = UsernameNormalizer::normalize($username);
        if (!UsernameNormalizer::isValid($normalized)) {
            throw new HttpException(
                422,
                'validation_failed',
                'Username: 3–32 Zeichen, nur a–z, 0–9, Punkt, Bindestrich, Unterstrich.',
            );
        }
        $existing = $this->users->findByUsername($normalized);
        if ($existing !== null && $existing->id !== $context->user->id) {
            throw new HttpException(409, 'username_taken', 'Dieser Username ist schon vergeben.');
        }
        $this->users->updateProfile($context->user->id, $displayName, $normalized);
        $this->logger->log('info', 'Profile updated', ['userId' => $context->user->id]);

        return $this->users->findById($context->user->id) ?? throw AuthException::unauthenticated();
    }

    /**
     * Deletes the account and all its data (D-082) after re-entering the password.
     */
    public function deleteAccount(AuthContext $context, string $password, string $clientIp): void
    {
        $now = $this->clock->now();
        $user = $context->user;
        $ipHash = $this->ipHasher->hash($clientIp);
        $retryAfter = $this->rateLimiter->retryAfter($user->username, $ipHash, $now);
        if ($retryAfter !== null) {
            throw AuthException::rateLimited($retryAfter);
        }
        if (strlen($password) > PasswordPolicy::MAX_BYTES || !$this->hasher->verify($password, $user->passwordHash)) {
            $this->attempts->record($user->username, $ipHash, false, $now);
            throw new HttpException(422, 'invalid_password', 'Das Passwort ist falsch.');
        }
        $this->users->delete($user->id);
        $this->logger->log('notice', 'Account deleted', ['userId' => $user->id]);
    }

    public static function tokenHash(string $token): string
    {
        return hash('sha256', $token, true);
    }

    private static function newToken(): string
    {
        return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    }

    private static function isWellFormedToken(string $token): bool
    {
        return preg_match('/^[A-Za-z0-9_-]{43}$/', $token) === 1;
    }

    private static function earliest(DateTimeImmutable $a, DateTimeImmutable $b): DateTimeImmutable
    {
        return $a < $b ? $a : $b;
    }

    private function purge(DateTimeImmutable $now): void
    {
        $before = $now->modify('-' . self::RETENTION_DAYS . ' days');
        $this->attempts->purgeBefore($before);
        $this->sessions->purgeEndedBefore($before);
    }
}

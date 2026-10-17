<?php

declare(strict_types=1);

namespace Primed\Auth;

/**
 * NIST SP 800-63B style policy (D-062): length, no composition rules, blocklist of common passwords.
 */
final class PasswordPolicy
{
    public const MIN_LENGTH = 12;
    /** Upper bound to keep hashing cost predictable. */
    public const MAX_BYTES = 1024;

    /** @var array<string, true>|null */
    private ?array $blocklist = null;

    public function __construct(private readonly string $blocklistFile)
    {
    }

    /**
     * @return list<string> user-facing error messages (empty = valid)
     */
    public function validate(string $password, string $username): array
    {
        $errors = [];
        if (mb_strlen($password, 'UTF-8') < self::MIN_LENGTH) {
            $errors[] = sprintf('Das Passwort muss mindestens %d Zeichen lang sein.', self::MIN_LENGTH);
        }
        if (strlen($password) > self::MAX_BYTES) {
            $errors[] = 'Das Passwort ist zu lang.';
        }
        if (!mb_check_encoding($password, 'UTF-8')) {
            $errors[] = 'Das Passwort enthält ungültige Zeichen.';
        }
        if ($errors !== []) {
            return $errors;
        }

        $lower = mb_strtolower($password, 'UTF-8');
        if (isset($this->blocklist()[$lower])) {
            $errors[] = 'Dieses Passwort ist zu verbreitet. Bitte wähle ein anderes.';
        }
        if ($username !== '' && str_contains($lower, mb_strtolower($username, 'UTF-8'))) {
            $errors[] = 'Das Passwort darf deinen Username nicht enthalten.';
        }

        return $errors;
    }

    /**
     * @return array<string, true>
     */
    private function blocklist(): array
    {
        if ($this->blocklist === null) {
            $this->blocklist = [];
            $lines = file($this->blocklistFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines === false ? [] : $lines as $line) {
                if (!str_starts_with($line, '#')) {
                    $this->blocklist[$line] = true;
                }
            }
        }

        return $this->blocklist;
    }
}

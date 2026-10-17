<?php

declare(strict_types=1);

namespace Primed\Config;

/**
 * Immutable application configuration loaded from the .env file outside the web root.
 */
final class Config
{
    /**
     * @param array<string, string> $values
     */
    private function __construct(private readonly array $values)
    {
    }

    public static function fromEnvFile(string $path): self
    {
        if (!is_file($path) || !is_readable($path)) {
            throw new ConfigException('Configuration file not found or not readable');
        }

        $contents = file_get_contents($path);
        if ($contents === false) {
            throw new ConfigException('Configuration file could not be read');
        }

        return new self(EnvParser::parse($contents));
    }

    /**
     * @param array<string, string> $values
     */
    public static function fromArray(array $values): self
    {
        return new self($values);
    }

    public function string(string $key, ?string $default = null): string
    {
        $value = $this->values[$key] ?? null;
        if ($value === null || $value === '') {
            if ($default !== null) {
                return $default;
            }
            throw new ConfigException(sprintf('Missing required configuration key %s', $key));
        }

        return $value;
    }

    public function int(string $key, ?int $default = null): int
    {
        $value = $this->values[$key] ?? '';
        if ($value === '') {
            if ($default !== null) {
                return $default;
            }
            throw new ConfigException(sprintf('Missing required configuration key %s', $key));
        }

        $int = filter_var($value, FILTER_VALIDATE_INT);
        if ($int === false) {
            throw new ConfigException(sprintf('Configuration key %s must be an integer', $key));
        }

        return $int;
    }

    public function isProduction(): bool
    {
        return $this->string('APP_ENV', 'production') === 'production';
    }
}

<?php

declare(strict_types=1);

namespace Primed\Http;

/**
 * Strict validation of decoded JSON input. Every failure is a 422 with a German, user-facing message.
 */
final class Input
{
    /**
     * @param array<string, mixed> $data
     */
    public function __construct(private readonly array $data)
    {
    }

    public static function fromRequest(Request $request): self
    {
        return new self($request->json());
    }

    public function has(string $field): bool
    {
        return array_key_exists($field, $this->data);
    }

    public function int(string $field, int $min, int $max, string $label): int
    {
        $value = $this->data[$field] ?? null;
        if (!is_int($value) || $value < $min || $value > $max) {
            throw self::invalid(sprintf('%s muss eine ganze Zahl zwischen %d und %d sein.', $label, $min, $max));
        }

        return $value;
    }

    public function nullableInt(string $field, int $min, int $max, string $label): ?int
    {
        return ($this->data[$field] ?? null) === null ? null : $this->int($field, $min, $max, $label);
    }

    public function bool(string $field, string $label): bool
    {
        $value = $this->data[$field] ?? null;
        if (!is_bool($value)) {
            throw self::invalid(sprintf('%s fehlt oder ist ungültig.', $label));
        }

        return $value;
    }

    public function text(string $field, int $minLength, int $maxLength, string $label): string
    {
        $value = $this->data[$field] ?? null;
        if (!is_string($value)) {
            throw self::invalid(sprintf('%s fehlt.', $label));
        }
        $value = trim($value);
        $length = mb_strlen($value, 'UTF-8');
        if (!mb_check_encoding($value, 'UTF-8') || preg_match('/\p{C}/u', $value) === 1) {
            throw self::invalid(sprintf('%s enthält ungültige Zeichen.', $label));
        }
        if ($length < $minLength || $length > $maxLength) {
            throw self::invalid(sprintf('%s muss %d bis %d Zeichen lang sein.', $label, $minLength, $maxLength));
        }

        return $value;
    }

    /**
     * @template T of string
     * @param list<T> $allowed
     * @return T
     */
    public function enum(string $field, array $allowed, string $label): string
    {
        $value = $this->data[$field] ?? null;
        foreach ($allowed as $option) {
            if ($value === $option) {
                return $option;
            }
        }
        throw self::invalid(sprintf('%s ist ungültig.', $label));
    }

    /**
     * @return list<self>
     */
    public function list(string $field, int $min, int $max, string $label): array
    {
        $value = $this->data[$field] ?? null;
        if (!is_array($value) || !array_is_list($value) || count($value) < $min || count($value) > $max) {
            throw self::invalid(sprintf('%s ist ungültig.', $label));
        }
        $items = [];
        foreach ($value as $item) {
            if (!is_array($item) || ($item !== [] && array_is_list($item))) {
                throw self::invalid(sprintf('%s ist ungültig.', $label));
            }
            /** @var array<string, mixed> $item */
            $items[] = new self($item);
        }

        return $items;
    }

    public static function invalid(string $message): HttpException
    {
        return new HttpException(422, 'validation_failed', $message);
    }
}

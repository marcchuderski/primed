<?php

declare(strict_types=1);

namespace Primed\Day;

use DateTimeImmutable;
use PDO;
use Primed\Support\Db;
use Primed\Support\Row;
use RuntimeException;

final class SettingsRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function get(int $userId): UserSettings
    {
        $statement = $this->pdo->prepare(
            'SELECT theme, protein_default, default_duration_min, earliest_training_min, checkpoint_offset_min,
                    checkpoint_pct, earliest_checkpoint_min, day_boundary_min
               FROM user_settings WHERE user_id = ?',
        );
        $statement->execute([$userId]);
        $row = $statement->fetch();
        if (!is_array($row)) {
            throw new RuntimeException('User settings missing');
        }

        return new UserSettings(
            Row::string($row, 'theme'),
            Row::int($row, 'protein_default'),
            Row::int($row, 'default_duration_min'),
            Row::int($row, 'earliest_training_min'),
            Row::int($row, 'checkpoint_offset_min'),
            Row::int($row, 'checkpoint_pct'),
            Row::int($row, 'earliest_checkpoint_min'),
            Row::int($row, 'day_boundary_min'),
        );
    }

    public function updateTheme(int $userId, string $theme, DateTimeImmutable $now): void
    {
        $this->pdo->prepare('UPDATE user_settings SET theme = ?, updated_at = ? WHERE user_id = ?')
            ->execute([$theme, Db::dateTime($now), $userId]);
    }

    public function updateProteinDefault(int $userId, int $protein, DateTimeImmutable $now): void
    {
        $this->pdo->prepare('UPDATE user_settings SET protein_default = ?, updated_at = ? WHERE user_id = ?')
            ->execute([$protein, Db::dateTime($now), $userId]);
    }
}

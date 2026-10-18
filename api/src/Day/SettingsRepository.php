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
    /** Public threshold name => column (suggestions, docs/DEFAULTS.md). */
    public const THRESHOLDS = [
        'minProteinGap' => 'sg_min_protein_gap',
        'bigShakeProtein' => 'sg_big_shake_protein',
        'bigShakeKcal' => 'sg_big_shake_kcal',
        'lightMealKcal' => 'sg_light_meal_kcal',
        'restShakeFrom' => 'sg_rest_shake_from',
        'richMilkKcal' => 'sg_rich_milk_kcal',
        'overKcalProtein' => 'sg_over_kcal_protein',
    ];

    /** Columns that may be changed via update(); never derived from user input. */
    private const UPDATABLE = [
        'checkpoint_offset_min', 'checkpoint_pct', 'earliest_checkpoint_min', 'earliest_training_min',
        'tolerance_pct', 'shakes_enabled',
        'protein_powder_food_id', 'shake_milk_low_food_id', 'shake_milk_high_food_id',
        'shake_big_ml', 'shake_small_ml', 'shake_powder_g',
        'sg_min_protein_gap', 'sg_big_shake_protein', 'sg_big_shake_kcal', 'sg_light_meal_kcal',
        'sg_rest_shake_from', 'sg_rich_milk_kcal', 'sg_over_kcal_protein',
    ];

    public function __construct(private readonly PDO $pdo)
    {
    }

    public function get(int $userId): UserSettings
    {
        $statement = $this->pdo->prepare(
            'SELECT theme, protein_default, default_duration_min, earliest_training_min, checkpoint_offset_min,
                    checkpoint_pct, earliest_checkpoint_min, day_boundary_min,
                    protein_powder_food_id, shake_milk_low_food_id, shake_milk_high_food_id,
                    shake_big_ml, shake_small_ml, shake_powder_g, tolerance_pct, shakes_enabled, '
                    . implode(', ', self::THRESHOLDS) . '
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
            ($row['protein_powder_food_id'] ?? null) === null ? null : Row::int($row, 'protein_powder_food_id'),
            ($row['shake_milk_low_food_id'] ?? null) === null ? null : Row::int($row, 'shake_milk_low_food_id'),
            ($row['shake_milk_high_food_id'] ?? null) === null ? null : Row::int($row, 'shake_milk_high_food_id'),
            [
                'bigMl' => Row::int($row, 'shake_big_ml'),
                'smallMl' => Row::int($row, 'shake_small_ml'),
                'powderG' => Row::int($row, 'shake_powder_g'),
            ],
            Row::int($row, 'tolerance_pct'),
            array_combine(
                array_keys(self::THRESHOLDS),
                array_map(static fn (string $column): int => Row::int($row, $column), array_values(self::THRESHOLDS)),
            ),
            Row::int($row, 'shakes_enabled') === 1,
        );
    }

    public function updateTheme(int $userId, string $theme, DateTimeImmutable $now): void
    {
        $this->pdo->prepare('UPDATE user_settings SET theme = ?, updated_at = ? WHERE user_id = ?')
            ->execute([$theme, Db::dateTime($now), $userId]);
    }

    /**
     * @param array<string, int|null> $values column => value; columns must be in the allowlist
     */
    public function update(int $userId, array $values, DateTimeImmutable $now): void
    {
        if ($values === []) {
            return;
        }
        $sets = [];
        $params = [];
        foreach ($values as $column => $value) {
            if (!in_array($column, self::UPDATABLE, true)) {
                throw new RuntimeException('Column not updatable');
            }
            $sets[] = $column . ' = ?';
            $params[] = $value;
        }
        $params[] = Db::dateTime($now);
        $params[] = $userId;
        $this->pdo->prepare('UPDATE user_settings SET ' . implode(', ', $sets) . ', updated_at = ? WHERE user_id = ?')
            ->execute($params);
    }

    public function updateProteinDefault(int $userId, int $protein, DateTimeImmutable $now): void
    {
        $this->pdo->prepare('UPDATE user_settings SET protein_default = ?, updated_at = ? WHERE user_id = ?')
            ->execute([$protein, Db::dateTime($now), $userId]);
    }
}

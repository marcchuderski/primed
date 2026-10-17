-- 009_settings: rating tolerance and suggestion thresholds (7.1, docs/DEFAULTS.md).

ALTER TABLE user_settings
    ADD COLUMN tolerance_pct TINYINT UNSIGNED NOT NULL DEFAULT 5 AFTER shake_powder_g,
    ADD COLUMN sg_min_protein_gap SMALLINT UNSIGNED NOT NULL DEFAULT 25 AFTER tolerance_pct,
    ADD COLUMN sg_big_shake_protein SMALLINT UNSIGNED NOT NULL DEFAULT 35 AFTER sg_min_protein_gap,
    ADD COLUMN sg_big_shake_kcal SMALLINT UNSIGNED NOT NULL DEFAULT 500 AFTER sg_big_shake_protein,
    ADD COLUMN sg_light_meal_kcal SMALLINT UNSIGNED NOT NULL DEFAULT 700 AFTER sg_big_shake_kcal,
    ADD COLUMN sg_rest_shake_from SMALLINT UNSIGNED NOT NULL DEFAULT 1140 COMMENT '19:00' AFTER sg_light_meal_kcal,
    ADD COLUMN sg_rich_milk_kcal SMALLINT UNSIGNED NOT NULL DEFAULT 400 AFTER sg_rest_shake_from,
    ADD COLUMN sg_over_kcal_protein SMALLINT UNSIGNED NOT NULL DEFAULT 30 AFTER sg_rich_milk_kcal;

INSERT INTO schema_migrations (version, applied_at) VALUES ('009_settings', UTC_TIMESTAMP());

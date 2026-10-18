-- 011_shake_liquids: fixed shake sizes (400/200 ml) and a choice of liquids (D-139).
-- Milk values now come from fixed reference values, so the milk products and sizes are no longer settings.

ALTER TABLE user_settings
    DROP FOREIGN KEY fk_settings_milk_low,
    DROP FOREIGN KEY fk_settings_milk_high;

ALTER TABLE user_settings
    DROP COLUMN shake_milk_low_food_id,
    DROP COLUMN shake_milk_high_food_id,
    DROP COLUMN shake_big_ml,
    DROP COLUMN shake_small_ml,
    ADD COLUMN shake_liquid_milk_low TINYINT(1) NOT NULL DEFAULT 1 AFTER shakes_enabled,
    ADD COLUMN shake_liquid_milk_high TINYINT(1) NOT NULL DEFAULT 1 AFTER shake_liquid_milk_low,
    ADD COLUMN shake_liquid_water TINYINT(1) NOT NULL DEFAULT 1 AFTER shake_liquid_milk_high;

INSERT INTO schema_migrations (version, applied_at) VALUES ('011_shake_liquids', UTC_TIMESTAMP());

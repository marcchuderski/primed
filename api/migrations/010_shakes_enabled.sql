-- 010_shakes_enabled: shakes and shake rules can be switched off (Einstellungen › Shakes).

ALTER TABLE user_settings
    ADD COLUMN shakes_enabled TINYINT(1) NOT NULL DEFAULT 1 AFTER shake_milk_high_food_id;

INSERT INTO schema_migrations (version, applied_at) VALUES ('010_shakes_enabled', UTC_TIMESTAMP());

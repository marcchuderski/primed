-- 007_shakes: shake composition (D-040) and entry kind.

ALTER TABLE user_settings
    ADD COLUMN protein_powder_food_id INT UNSIGNED NULL AFTER day_boundary_min,
    ADD COLUMN shake_milk_low_food_id INT UNSIGNED NULL COMMENT 'Milch 1,5 %' AFTER protein_powder_food_id,
    ADD COLUMN shake_milk_high_food_id INT UNSIGNED NULL COMMENT 'Milch 3,5 %' AFTER shake_milk_low_food_id,
    ADD COLUMN shake_big_ml SMALLINT UNSIGNED NOT NULL DEFAULT 400 AFTER shake_milk_high_food_id,
    ADD COLUMN shake_small_ml SMALLINT UNSIGNED NOT NULL DEFAULT 200 AFTER shake_big_ml,
    ADD COLUMN shake_powder_g SMALLINT UNSIGNED NOT NULL DEFAULT 30 AFTER shake_small_ml,
    ADD CONSTRAINT fk_settings_powder FOREIGN KEY (protein_powder_food_id) REFERENCES foods (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_settings_milk_low FOREIGN KEY (shake_milk_low_food_id) REFERENCES foods (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_settings_milk_high FOREIGN KEY (shake_milk_high_food_id) REFERENCES foods (id) ON DELETE SET NULL;

ALTER TABLE entries
    ADD COLUMN kind ENUM('food', 'dish', 'shake') NOT NULL DEFAULT 'food' AFTER time_min;

-- Link existing users' seeded milks and protein powder.
UPDATE user_settings s
   SET s.protein_powder_food_id = (SELECT f.id FROM foods f WHERE f.user_id = s.user_id AND f.barcode = '4250519647234' AND f.deleted_at IS NULL LIMIT 1),
       s.shake_milk_low_food_id = (SELECT f.id FROM foods f WHERE f.user_id = s.user_id AND f.name = 'Milch 1,5 %' AND f.deleted_at IS NULL LIMIT 1),
       s.shake_milk_high_food_id = (SELECT f.id FROM foods f WHERE f.user_id = s.user_id AND f.name = 'Milch 3,5 %' AND f.deleted_at IS NULL LIMIT 1);

INSERT INTO schema_migrations (version, applied_at) VALUES ('007_shakes', UTC_TIMESTAMP());

-- 002_days: personal settings, day types, week template, days (2.1).
-- Times of day are stored as minutes since midnight (Europe/Berlin wall clock).

ALTER TABLE user_settings
    ADD COLUMN protein_default SMALLINT UNSIGNED NOT NULL DEFAULT 150 AFTER theme,
    ADD COLUMN default_duration_min SMALLINT UNSIGNED NOT NULL DEFAULT 90 AFTER protein_default,
    ADD COLUMN earliest_training_min SMALLINT UNSIGNED NOT NULL DEFAULT 540 COMMENT '09:00' AFTER default_duration_min,
    ADD COLUMN checkpoint_offset_min SMALLINT UNSIGNED NOT NULL DEFAULT 180 COMMENT 'training start - 3 h' AFTER earliest_training_min,
    ADD COLUMN checkpoint_pct TINYINT UNSIGNED NOT NULL DEFAULT 70 AFTER checkpoint_offset_min,
    ADD COLUMN earliest_checkpoint_min SMALLINT UNSIGNED NOT NULL DEFAULT 360 COMMENT '06:00' AFTER checkpoint_pct,
    ADD COLUMN day_boundary_min SMALLINT UNSIGNED NOT NULL DEFAULT 120 COMMENT 'logical day ends at 02:00' AFTER earliest_checkpoint_min;

CREATE TABLE day_types (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    name VARCHAR(40) NOT NULL,
    kcal SMALLINT UNSIGNED NOT NULL,
    protein SMALLINT UNSIGNED NULL COMMENT 'NULL = protein default from user_settings',
    carbs SMALLINT UNSIGNED NOT NULL,
    sugar_ref SMALLINT UNSIGNED NOT NULL DEFAULT 50,
    is_training TINYINT(1) NOT NULL,
    sort SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    deleted_at DATETIME NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_day_types_user (user_id, deleted_at, sort),
    CONSTRAINT fk_day_types_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE week_template (
    user_id INT UNSIGNED NOT NULL,
    weekday TINYINT UNSIGNED NOT NULL COMMENT '1 = Monday … 7 = Sunday (ISO 8601)',
    day_type_id INT UNSIGNED NOT NULL,
    training_start SMALLINT UNSIGNED NULL COMMENT 'minutes since midnight',
    duration_min SMALLINT UNSIGNED NULL,
    PRIMARY KEY (user_id, weekday),
    CONSTRAINT fk_week_template_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_week_template_day_type FOREIGN KEY (day_type_id) REFERENCES day_types (id) ON DELETE RESTRICT,
    CONSTRAINT chk_week_template_weekday CHECK (weekday BETWEEN 1 AND 7)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE days (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    date DATE NOT NULL COMMENT 'logical day (ends at day_boundary_min of the next calendar day)',
    day_type_id INT UNSIGNED NULL,
    day_type_name VARCHAR(40) NOT NULL COMMENT 'snapshot',
    is_training TINYINT(1) NOT NULL,
    training_start SMALLINT UNSIGNED NULL,
    duration_min SMALLINT UNSIGNED NULL,
    target_kcal SMALLINT UNSIGNED NOT NULL,
    target_protein SMALLINT UNSIGNED NOT NULL,
    target_carbs SMALLINT UNSIGNED NOT NULL,
    target_sugar SMALLINT UNSIGNED NOT NULL,
    source ENUM('template', 'manual') NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_days_user_date (user_id, date),
    CONSTRAINT fk_days_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_days_day_type FOREIGN KEY (day_type_id) REFERENCES day_types (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (version, applied_at) VALUES ('002_days', UTC_TIMESTAMP());

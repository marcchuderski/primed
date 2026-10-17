-- 003_foods_entries: personal food library and diary entries with nutrient snapshots (2.5).
-- Nutrients are stored per basis (per 100 g, per 100 ml or per piece); entries store a snapshot.

CREATE TABLE foods (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    type ENUM('product', 'reference', 'ingredient') NOT NULL,
    name VARCHAR(120) NOT NULL,
    brand VARCHAR(80) NULL,
    barcode VARCHAR(14) NULL,
    category ENUM('snacks', 'dairy', 'bread', 'produce', 'drinks') NOT NULL,
    basis ENUM('per_100g', 'per_100ml', 'per_unit') NOT NULL,
    kcal DECIMAL(6,1) NOT NULL,
    protein DECIMAL(5,1) NOT NULL,
    carbs DECIMAL(5,1) NOT NULL,
    sugar DECIMAL(5,1) NOT NULL,
    fat DECIMAL(5,1) NOT NULL,
    package_amount DECIMAL(7,1) NULL COMMENT 'in g, ml or pieces depending on basis',
    source ENUM('seed', 'manual', 'off', 'bls') NOT NULL,
    usage_count INT UNSIGNED NOT NULL DEFAULT 0,
    last_amount DECIMAL(7,2) NULL,
    last_unit VARCHAR(10) NULL,
    deleted_at DATETIME NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_foods_user_barcode (user_id, barcode),
    KEY idx_foods_user (user_id, deleted_at, usage_count),
    CONSTRAINT fk_foods_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE entries (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    date DATE NOT NULL COMMENT 'logical day',
    time_min SMALLINT UNSIGNED NOT NULL COMMENT 'wall clock minutes since midnight (Europe/Berlin)',
    food_id INT UNSIGNED NULL,
    dish_id INT UNSIGNED NULL COMMENT 'meal prep portion (phase 4)',
    name_snapshot VARCHAR(120) NOT NULL,
    amount DECIMAL(7,2) NOT NULL COMMENT 'as entered',
    unit ENUM('g', 'ml', 'el', 'tl', 'packung', 'stueck', 'portion') NOT NULL,
    quantity DECIMAL(9,2) NOT NULL COMMENT 'converted: g, ml, pieces or portions',
    kcal DECIMAL(7,1) NOT NULL,
    protein DECIMAL(6,1) NOT NULL,
    carbs DECIMAL(6,1) NOT NULL,
    sugar DECIMAL(6,1) NOT NULL,
    fat DECIMAL(6,1) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_entries_user_date (user_id, date),
    KEY idx_entries_food (food_id),
    CONSTRAINT fk_entries_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_entries_food FOREIGN KEY (food_id) REFERENCES foods (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (version, applied_at) VALUES ('003_foods_entries', UTC_TIMESTAMP());

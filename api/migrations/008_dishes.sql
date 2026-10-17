-- 008_dishes: meal prep dishes with ingredient snapshots (phase 4). Portions left are derived from entries.

CREATE TABLE dishes (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    name VARCHAR(120) NOT NULL,
    cooked_on DATE NOT NULL,
    portions_total DECIMAL(4,1) NOT NULL,
    kcal DECIMAL(8,1) NOT NULL COMMENT 'whole dish',
    protein DECIMAL(7,1) NOT NULL,
    carbs DECIMAL(7,1) NOT NULL,
    sugar DECIMAL(7,1) NOT NULL,
    fat DECIMAL(7,1) NOT NULL,
    discarded_at DATETIME NULL COMMENT '"Rest entsorgen"',
    based_on_dish_id INT UNSIGNED NULL COMMENT '"Nochmal kochen"',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_dishes_user (user_id, cooked_on),
    CONSTRAINT fk_dishes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_dishes_based_on FOREIGN KEY (based_on_dish_id) REFERENCES dishes (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE dish_ingredients (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    dish_id INT UNSIGNED NOT NULL,
    food_id INT UNSIGNED NULL,
    sort SMALLINT UNSIGNED NOT NULL,
    name_snapshot VARCHAR(120) NOT NULL,
    food_type VARCHAR(12) NOT NULL COMMENT 'product/reference/ingredient at the time of cooking',
    amount DECIMAL(7,2) NOT NULL,
    unit ENUM('g', 'ml', 'el', 'tl', 'packung', 'stueck') NOT NULL,
    quantity DECIMAL(9,2) NOT NULL,
    kcal DECIMAL(7,1) NOT NULL,
    protein DECIMAL(6,1) NOT NULL,
    carbs DECIMAL(6,1) NOT NULL,
    sugar DECIMAL(6,1) NOT NULL,
    fat DECIMAL(6,1) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_dish_ingredients_dish (dish_id, sort),
    CONSTRAINT fk_dish_ingredients_dish FOREIGN KEY (dish_id) REFERENCES dishes (id) ON DELETE CASCADE,
    CONSTRAINT fk_dish_ingredients_food FOREIGN KEY (food_id) REFERENCES foods (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE entries
    ADD KEY idx_entries_dish (dish_id),
    ADD CONSTRAINT fk_entries_dish FOREIGN KEY (dish_id) REFERENCES dishes (id) ON DELETE SET NULL;

INSERT INTO schema_migrations (version, applied_at) VALUES ('008_dishes', UTC_TIMESTAMP());

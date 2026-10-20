-- 016_categories_v2: new category structure (D-172).
-- bread → grains; basics is split up: the former BLS start values by name, everything else → other.
-- Milk (start milk, milk reference values) → dairy, egg reference value → meat, sweet bakery reference values
-- → snacks. Only untouched seed/reference rows are moved by name; own entries keep their category.
-- The Open Food Facts cache is emptied: it stores the old categories and lacks food groups.

ALTER TABLE foods
    MODIFY category ENUM('snacks', 'dairy', 'bread', 'produce', 'drinks', 'basics', 'sauces', 'supplements', 'meals',
                         'meat', 'grains', 'other') NOT NULL;

ALTER TABLE reference_foods
    MODIFY category ENUM('snacks', 'dairy', 'bread', 'produce', 'drinks', 'basics', 'sauces', 'supplements', 'meals',
                         'meat', 'grains', 'other') NOT NULL;

UPDATE foods SET category = 'grains', updated_at = UTC_TIMESTAMP() WHERE category = 'bread';

UPDATE foods SET category = 'meat', updated_at = UTC_TIMESTAMP()
 WHERE category = 'basics' AND source = 'bls' AND name IN ('Hähnchenbrust, roh', 'Ei (Hühnerei), roh');

UPDATE foods SET category = 'grains', updated_at = UTC_TIMESTAMP()
 WHERE category = 'basics' AND source = 'bls' AND name IN ('Reis, roh', 'Nudeln, roh', 'Haferflocken');

UPDATE foods SET category = 'sauces', updated_at = UTC_TIMESTAMP()
 WHERE category = 'basics' AND source = 'bls' AND name IN ('Olivenöl', 'Butter');

UPDATE foods SET category = 'other', updated_at = UTC_TIMESTAMP() WHERE category = 'basics';

UPDATE foods SET category = 'dairy', updated_at = UTC_TIMESTAMP()
 WHERE category = 'drinks' AND source = 'seed' AND system_key IS NOT NULL;

UPDATE reference_foods SET category = 'snacks'
 WHERE category = 'bread' AND name IN ('Berliner', 'Apfeltasche', 'Nussschnecke', 'Rosinenschnecke', 'Plunderteilchen',
                                       'Donut', 'Muffin', 'Amerikaner', 'Streuselkuchen', 'Käsekuchen', 'Bienenstich',
                                       'Butterkuchen', 'Obstkuchen', 'Marmorkuchen', 'Schwarzwälder Kirschtorte');

UPDATE reference_foods SET category = 'grains' WHERE category = 'bread';

UPDATE reference_foods SET category = 'meat' WHERE category = 'basics' AND name = 'Ei';

UPDATE reference_foods SET category = 'dairy' WHERE category = 'drinks' AND name IN ('Milch 1,5 %', 'Milch 3,5 %');

UPDATE reference_foods SET category = 'other' WHERE category IN ('basics', 'bread');

ALTER TABLE foods
    MODIFY category ENUM('meat', 'dairy', 'grains', 'produce', 'sauces', 'snacks', 'drinks', 'meals', 'supplements',
                         'other') NOT NULL;

ALTER TABLE reference_foods
    MODIFY category ENUM('meat', 'dairy', 'grains', 'produce', 'sauces', 'snacks', 'drinks', 'meals', 'supplements',
                         'other') NOT NULL;

DELETE FROM off_cache;

INSERT INTO schema_migrations (version, applied_at) VALUES ('016_categories_v2', UTC_TIMESTAMP());

-- 014_supplements_meals: categories "Supplements" and "Fertiggerichte & Restaurant" (D-165).
-- The start protein powder moves to Supplements, but only where it is still in the old default category.

ALTER TABLE foods
    MODIFY category ENUM('snacks', 'dairy', 'bread', 'produce', 'drinks', 'basics', 'sauces', 'supplements', 'meals')
        NOT NULL;

UPDATE foods SET category = 'supplements', updated_at = UTC_TIMESTAMP()
 WHERE source = 'seed' AND barcode = '4250519647234' AND category = 'drinks';

INSERT INTO schema_migrations (version, applied_at) VALUES ('014_supplements_meals', UTC_TIMESTAMP());

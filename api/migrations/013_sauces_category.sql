-- 013_sauces_category: category "Öle & Saucen" for oils, fats, sauces and dressings (D-162).

ALTER TABLE foods
    MODIFY category ENUM('snacks', 'dairy', 'bread', 'produce', 'drinks', 'basics', 'sauces') NOT NULL;

INSERT INTO schema_migrations (version, applied_at) VALUES ('013_sauces_category', UTC_TIMESTAMP());

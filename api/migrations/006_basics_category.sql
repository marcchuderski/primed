-- 006_basics_category: category for staple foods (BLS reference values like rice, pasta, oil, eggs).

ALTER TABLE foods
    MODIFY category ENUM('snacks', 'dairy', 'bread', 'produce', 'drinks', 'basics') NOT NULL;

INSERT INTO schema_migrations (version, applied_at) VALUES ('006_basics_category', UTC_TIMESTAMP());

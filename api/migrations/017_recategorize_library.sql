-- 017_recategorize_library: one-time re-sort of the existing library into the categories of D-172 (D-173).
-- Rows are matched by barcode or name plus source and their current category, never by id: on other
-- installations nothing matches, and rows a user has already moved stay as they are.
-- Barcode products: category from OFF food groups via OffCategoryMap, corrected by hand where OFF has no or
-- wrong data (Rostbratwurst and Vollkornbrötchen without categories, Mischbrot listed as sweet pastry).

-- Open Food Facts products
UPDATE foods SET category = 'meat', updated_at = UTC_TIMESTAMP()
 WHERE source = 'off' AND category = 'snacks'
   AND barcode IN ('4061458234696', '4250241203425', '20036379', '4016623486691');

UPDATE foods SET category = 'grains', updated_at = UTC_TIMESTAMP()
 WHERE source = 'off' AND category = 'snacks' AND barcode IN ('4260248720009', '8710438088892', '9010158009559');

UPDATE foods SET category = 'sauces', updated_at = UTC_TIMESTAMP()
 WHERE source = 'off' AND category = 'snacks' AND barcode = '8850206011025';

UPDATE foods SET category = 'dairy', updated_at = UTC_TIMESTAMP()
 WHERE source = 'off' AND category = 'drinks' AND barcode = '4025839043154';

-- Own and former start products without barcode
UPDATE foods SET category = 'meals', updated_at = UTC_TIMESTAMP()
 WHERE source = 'manual' AND category = 'snacks' AND name = 'Gebratener Reis mit Hähnchenbrust';

UPDATE foods SET category = 'meat', updated_at = UTC_TIMESTAMP()
 WHERE source = 'seed' AND category = 'snacks' AND name = 'Lidl Chicken Nuggets';

INSERT INTO schema_migrations (version, applied_at) VALUES ('017_recategorize_library', UTC_TIMESTAMP());

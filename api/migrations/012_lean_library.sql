-- 012_lean_library: the start library shrinks to milk and the default protein powder (D-159).
-- 1) Milk rows get a fixed key, so the library can hide them while shakes are switched off.
-- 2) The BLS reference values and the six former start products are removed for every user.
--    Soft delete (deleted_at), the same as deleting in the app: entries keep their snapshot, dishes keep
--    their ingredients, and the rows could be restored. Own entries (source manual/off) are not touched,
--    and a food chosen as protein powder stays.

ALTER TABLE foods
    ADD COLUMN system_key ENUM('milk_low', 'milk_high') NULL
        COMMENT 'start milk; hidden in the library while shakes are off' AFTER source,
    ADD UNIQUE KEY uq_foods_user_system (user_id, system_key);

UPDATE foods SET system_key = 'milk_low'
 WHERE source = 'seed' AND type = 'reference' AND name = 'Milch 1,5 %' AND deleted_at IS NULL;

UPDATE foods SET system_key = 'milk_high'
 WHERE source = 'seed' AND type = 'reference' AND name = 'Milch 3,5 %' AND deleted_at IS NULL;

UPDATE foods SET deleted_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP()
 WHERE deleted_at IS NULL
   AND (
        (source = 'bls' AND type = 'reference')
        OR (source = 'seed' AND name IN ('REWE Quarkcreme', 'REWE Dinkelbrötchen', 'Lidl körniger Frischkäse',
                                         'DM Proteinriegel', 'Lidl Müsli-Riegel', 'Lidl Chicken Nuggets'))
       )
   AND id NOT IN (SELECT protein_powder_food_id FROM user_settings WHERE protein_powder_food_id IS NOT NULL);

INSERT INTO schema_migrations (version, applied_at) VALUES ('012_lean_library', UTC_TIMESTAMP());

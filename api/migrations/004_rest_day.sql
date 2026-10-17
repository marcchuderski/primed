-- 004_rest_day: the rest day type is fixed in the system (cannot be deleted or renamed), and 30 min trainings.

ALTER TABLE day_types
    ADD COLUMN system_key VARCHAR(20) NULL COMMENT 'rest = the fixed rest day type' AFTER user_id,
    ADD UNIQUE KEY uq_day_types_user_system_key (user_id, system_key);

UPDATE day_types d
  JOIN (SELECT user_id, MIN(id) AS id
          FROM day_types
         WHERE name = 'Ruhetag' AND is_training = 0 AND deleted_at IS NULL
         GROUP BY user_id) r ON r.id = d.id
   SET d.system_key = 'rest';

INSERT INTO schema_migrations (version, applied_at) VALUES ('004_rest_day', UTC_TIMESTAMP());

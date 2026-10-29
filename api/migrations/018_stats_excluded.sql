-- 018_stats_excluded: single days can be left out of the history statistics (D-180), e.g. holidays or illness.
-- The flag is set on its own (PUT /days/{date}/stats); saving the day type or targets never changes it.

ALTER TABLE days
    ADD COLUMN stats_excluded TINYINT(1) NOT NULL DEFAULT 0 AFTER source;

INSERT INTO schema_migrations (version, applied_at) VALUES ('018_stats_excluded', UTC_TIMESTAMP());

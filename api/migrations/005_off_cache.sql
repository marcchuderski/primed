-- 005_off_cache: cache for Open Food Facts lookups (not personal) and a simple per-user rate limit store (3.4).

CREATE TABLE off_cache (
    cache_key VARCHAR(80) NOT NULL COMMENT 'barcode:<ean> or search:<sha256 of normalized query>',
    payload MEDIUMTEXT NULL COMMENT 'normalized JSON; NULL = not found',
    fetched_at DATETIME NOT NULL,
    PRIMARY KEY (cache_key),
    KEY idx_off_cache_fetched (fetched_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rate_limits (
    user_id INT UNSIGNED NOT NULL,
    bucket VARCHAR(30) NOT NULL,
    window_start DATETIME NOT NULL,
    hits INT UNSIGNED NOT NULL,
    PRIMARY KEY (user_id, bucket),
    CONSTRAINT fk_rate_limits_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (version, applied_at) VALUES ('005_off_cache', UTC_TIMESTAMP());

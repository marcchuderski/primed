-- 001_init: users, sessions, login attempts, user settings.
-- Conventions: InnoDB, utf8mb4, all DATETIME values in UTC, one statement per ';' at line end.
-- Each migration records itself in schema_migrations (works for bin/migrate and phpMyAdmin alike).

CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(64) NOT NULL,
    applied_at DATETIME NOT NULL,
    PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    username VARCHAR(32) NOT NULL COMMENT 'lower-case, [a-z0-9._-]',
    display_name VARCHAR(64) NOT NULL,
    password_hash VARCHAR(255) NOT NULL COMMENT 'Argon2id',
    password_changed_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sessions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    token_hash BINARY(32) NOT NULL COMMENT 'SHA-256 of the session token; the token itself is never stored',
    created_at DATETIME NOT NULL,
    last_seen_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL COMMENT 'sliding idle expiry (30 days)',
    absolute_expires_at DATETIME NOT NULL COMMENT 'hard limit (90 days after login)',
    revoked_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sessions_token_hash (token_hash),
    KEY idx_sessions_user (user_id),
    KEY idx_sessions_expires (expires_at),
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE login_attempts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    username VARCHAR(64) NOT NULL COMMENT 'normalized as entered; may not exist',
    ip_hash BINARY(32) NOT NULL COMMENT 'HMAC-SHA256 of the client IP',
    attempted_at DATETIME(3) NOT NULL,
    success TINYINT(1) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_login_attempts_user_time (username, attempted_at),
    KEY idx_login_attempts_ip_time (ip_hash, attempted_at),
    KEY idx_login_attempts_time (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_settings (
    user_id INT UNSIGNED NOT NULL,
    theme ENUM('system', 'light', 'dark') NOT NULL DEFAULT 'system',
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (user_id),
    CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_migrations (version, applied_at) VALUES ('001_init', UTC_TIMESTAMP());

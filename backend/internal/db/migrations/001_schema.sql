-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(50)  UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(100) NOT NULL DEFAULT '',
    bio             TEXT         NOT NULL DEFAULT '',
    avatar_url      VARCHAR(500) NOT NULL DEFAULT '',
    is_admin        BOOLEAN      NOT NULL DEFAULT FALSE,
    is_moderator    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_hash     VARCHAR(255) UNIQUE NOT NULL,
    key_preview  VARCHAR(10)  NOT NULL,
    name         VARCHAR(100) NOT NULL DEFAULT '',
    last_used_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Models (the registry entries)
CREATE TABLE IF NOT EXISTS models (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                VARCHAR(120) UNIQUE NOT NULL,
    name                VARCHAR(255) NOT NULL,
    description         TEXT         NOT NULL DEFAULT '',
    architecture        VARCHAR(100) NOT NULL DEFAULT '',
    framework           VARCHAR(50)  NOT NULL DEFAULT '',
    license             VARCHAR(100) NOT NULL DEFAULT '',
    language            VARCHAR(100) NOT NULL DEFAULT '',
    uploader_id         UUID         REFERENCES users(id) ON DELETE SET NULL,
    verification_status VARCHAR(50)  NOT NULL DEFAULT 'unverified',
    tags                TEXT[]       NOT NULL DEFAULT '{}',
    download_count      BIGINT       NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_models_slug ON models(slug);
CREATE INDEX IF NOT EXISTS idx_models_architecture ON models(architecture);
CREATE INDEX IF NOT EXISTS idx_models_license ON models(license);
CREATE INDEX IF NOT EXISTS idx_models_verification ON models(verification_status);
CREATE INDEX IF NOT EXISTS idx_models_created ON models(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_models_downloads ON models(download_count DESC);

-- Releases (versioned model snapshots)
CREATE TABLE IF NOT EXISTS releases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id        UUID         NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    version         VARCHAR(50)  NOT NULL,
    description     TEXT         NOT NULL DEFAULT '',
    is_latest       BOOLEAN      NOT NULL DEFAULT FALSE,
    magnet_uri      TEXT         NOT NULL DEFAULT '',
    torrent_url     VARCHAR(500) NOT NULL DEFAULT '',
    info_hash       VARCHAR(40)  NOT NULL DEFAULT '',
    sha256          VARCHAR(64)  NOT NULL DEFAULT '',
    sha512          VARCHAR(128) NOT NULL DEFAULT '',
    blake3          VARCHAR(64)  NOT NULL DEFAULT '',
    total_size      BIGINT       NOT NULL DEFAULT 0,
    parameter_count BIGINT       NOT NULL DEFAULT 0,
    quantization    VARCHAR(50)  NOT NULL DEFAULT '',
    file_manifest   JSONB        NOT NULL DEFAULT '[]',
    uploader_id     UUID         REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(model_id, version)
);

CREATE INDEX IF NOT EXISTS idx_releases_model ON releases(model_id);
CREATE INDEX IF NOT EXISTS idx_releases_latest ON releases(model_id, is_latest) WHERE is_latest = TRUE;

-- Comments
CREATE TABLE IF NOT EXISTS comments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id   UUID        NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_model ON comments(model_id, created_at DESC);

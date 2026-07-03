-- ============================================================
-- TUTIEN GAME - Supabase Schema
-- Run this SQL in: Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Drop existing tables (if any) ──────────────────────────────────────────
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS auction_listings CASCADE;
DROP TABLE IF EXISTS inventories CASCADE;
DROP TABLE IF EXISTS cultivations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username               VARCHAR(50)  NOT NULL UNIQUE,
  email                  VARCHAR(255) NOT NULL UNIQUE,
  password               VARCHAR      NOT NULL,
  gender                 VARCHAR(10)  DEFAULT NULL CHECK (gender IN ('male', 'female') OR gender IS NULL),
  spirit_root            VARCHAR(50)  DEFAULT NULL,
  spirit_root_grade      VARCHAR(10)  DEFAULT NULL CHECK (spirit_root_grade IN ('Thiên', 'Địa', 'Huyền', 'Hoàng') OR spirit_root_grade IS NULL),
  is_character_created   BOOLEAN      NOT NULL DEFAULT FALSE,
  spirit_stones          INTEGER      NOT NULL DEFAULT 100 CHECK (spirit_stones >= 0),
  last_stone_collected_at TIMESTAMPTZ DEFAULT NULL,
  created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_username ON users (username);

-- ============================================================
-- TABLE: cultivations
-- ============================================================
CREATE TABLE cultivations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  is_training             BOOLEAN     NOT NULL DEFAULT FALSE,
  training_started_at     TIMESTAMPTZ DEFAULT NULL,
  exp_accumulated         FLOAT       NOT NULL DEFAULT 0,
  realm_index             INTEGER     NOT NULL DEFAULT 0 CHECK (realm_index >= 0 AND realm_index <= 4),
  sect_name               VARCHAR(100) DEFAULT NULL,
  sect_joined_at          TIMESTAMPTZ DEFAULT NULL,
  sect_contribution       FLOAT       NOT NULL DEFAULT 0 CHECK (sect_contribution >= 0),
  sect_rank               VARCHAR(20)  NOT NULL DEFAULT 'Tạp Dịch'
                            CHECK (sect_rank IN ('Tạp Dịch', 'Ngoại Môn', 'Nội Môn', 'Chân Truyền', 'Trưởng Lão', 'Tông Chủ')),
  sect_missions           JSONB       NOT NULL DEFAULT '[]',
  last_mission_refresh    TIMESTAMPTZ DEFAULT NULL,
  active_mission_id       VARCHAR(50)  DEFAULT NULL,
  last_stopped_at         TIMESTAMPTZ DEFAULT NULL,
  breakthrough_ready_at   TIMESTAMPTZ DEFAULT NULL,
  lifespan                FLOAT       NOT NULL DEFAULT 100,
  failed_breakthroughs    INTEGER     NOT NULL DEFAULT 0,
  daily_pills_consumed    JSONB       NOT NULL DEFAULT '{"count": 0, "date": ""}',
  is_exploring            BOOLEAN     NOT NULL DEFAULT FALSE,
  current_dungeon_id      VARCHAR(50)  DEFAULT NULL,
  explore_started_at      TIMESTAMPTZ DEFAULT NULL,
  created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cultivations_user_id ON cultivations (user_id);
CREATE INDEX idx_cultivations_realm ON cultivations (realm_index DESC, exp_accumulated DESC);

-- ============================================================
-- TABLE: inventories
-- ============================================================
CREATE TABLE inventories (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  max_slots               INTEGER     NOT NULL DEFAULT 50,
  items                   JSONB       NOT NULL DEFAULT '[]',
  equipment               JSONB       NOT NULL DEFAULT '{"weapon": null, "armor": null}',
  technique_passive_bonus FLOAT       NOT NULL DEFAULT 0 CHECK (technique_passive_bonus >= 0),
  active_buffs            JSONB       NOT NULL DEFAULT '[]',
  created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_inventories_user_id ON inventories (user_id);

-- ============================================================
-- TABLE: auction_listings
-- ============================================================
CREATE TABLE auction_listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_name     VARCHAR(50)  NOT NULL,
  item_id         VARCHAR(50)  NOT NULL,
  item_name       VARCHAR(100) NOT NULL,
  item_rarity     VARCHAR(20)  NOT NULL DEFAULT 'Thường',
  item_type       VARCHAR(30)  NOT NULL DEFAULT 'MATERIAL',
  quantity        INTEGER      NOT NULL CHECK (quantity >= 1),
  starting_price  INTEGER      NOT NULL CHECK (starting_price >= 1),
  current_bid     INTEGER      NOT NULL DEFAULT 0,
  buyout_price    INTEGER      DEFAULT NULL,
  bidder_id       UUID         DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  bidder_name     VARCHAR(50)  DEFAULT NULL,
  status          VARCHAR(20)  NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'sold', 'expired', 'cancelled', 'pending_claim')),
  expires_at      TIMESTAMPTZ  NOT NULL,
  seller_claimed  BOOLEAN      NOT NULL DEFAULT FALSE,
  buyer_claimed   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_auction_status ON auction_listings (status);
CREATE INDEX idx_auction_expires ON auction_listings (expires_at);
CREATE INDEX idx_auction_seller ON auction_listings (seller_id, status);
CREATE INDEX idx_auction_bidder ON auction_listings (bidder_id, status);
CREATE INDEX idx_auction_status_expires ON auction_listings (status, expires_at);

-- ============================================================
-- TABLE: refresh_tokens
-- ============================================================
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR      NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ  NOT NULL,
  is_revoked  BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens (token);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id, is_revoked);

-- ============================================================
-- Auto-update updated_at via trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_cultivations
  BEFORE UPDATE ON cultivations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_inventories
  BEFORE UPDATE ON inventories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_auction_listings
  BEFORE UPDATE ON auction_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Disable Row Level Security (backend uses service_role key)
-- ============================================================
ALTER TABLE users           DISABLE ROW LEVEL SECURITY;
ALTER TABLE cultivations    DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventories     DISABLE ROW LEVEL SECURITY;
ALTER TABLE auction_listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens  DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Done! All tables created successfully.
-- ============================================================

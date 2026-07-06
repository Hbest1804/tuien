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
-- RPC: place_auction_bid
-- ============================================================
CREATE OR REPLACE FUNCTION place_auction_bid(
  p_user_id UUID,
  p_user_name VARCHAR,
  p_listing_id UUID,
  p_bid_amount INT
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_listing auction_listings%ROWTYPE;
  v_user users%ROWTYPE;
  v_current_price INT;
  v_min_bid INT;
  v_active_refund INT := 0;
BEGIN
  SELECT * INTO v_listing FROM auction_listings WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'status', 404, 'message', 'Phiên đấu giá không tồn tại.');
  END IF;

  IF v_listing.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Phiên đấu giá đã kết thúc.');
  END IF;

  IF NOW() >= v_listing.expires_at THEN
    RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Phiên đấu giá đã hết hạn.');
  END IF;

  IF v_listing.seller_id = p_user_id THEN
    RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Không thể tự đấu giá vật phẩm của mình.');
  END IF;

  IF v_listing.buyout_price IS NOT NULL AND p_bid_amount >= v_listing.buyout_price THEN
    RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Giá thầu lớn hơn hoặc bằng giá mua ngay. Vui lòng Mua Ngay.');
  END IF;

  v_current_price := GREATEST(v_listing.current_bid, v_listing.starting_price);
  v_min_bid := CEIL(v_current_price * 1.05);
  IF p_bid_amount < v_min_bid THEN
    RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Giá thầu tối thiểu là ' || v_min_bid || ' Linh Thạch.');
  END IF;

  SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'status', 404, 'message', 'Người dùng không tồn tại.');
  END IF;

  IF v_listing.bidder_id = p_user_id THEN
    v_active_refund := v_listing.current_bid;
  END IF;

  IF (COALESCE(v_user.spirit_stones, 0) + v_active_refund) < p_bid_amount THEN
    RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Không đủ Linh Thạch!');
  END IF;

  IF v_listing.bidder_id IS NOT NULL AND v_listing.current_bid > 0 THEN
    IF v_listing.bidder_id = p_user_id THEN
      v_user.spirit_stones := COALESCE(v_user.spirit_stones, 0) + v_listing.current_bid;
    ELSE
      UPDATE users SET spirit_stones = COALESCE(spirit_stones, 0) + v_listing.current_bid WHERE id = v_listing.bidder_id;
    END IF;
  END IF;

  v_user.spirit_stones := COALESCE(v_user.spirit_stones, 0) - p_bid_amount;
  UPDATE users SET spirit_stones = v_user.spirit_stones WHERE id = p_user_id;

  UPDATE auction_listings 
  SET current_bid = p_bid_amount, bidder_id = p_user_id, bidder_name = p_user_name, updated_at = NOW() 
  WHERE id = p_listing_id RETURNING * INTO v_listing;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Đặt thầu ' || p_bid_amount || ' Linh Thạch thành công!', 
    'spiritStones', v_user.spirit_stones,
    'listing', to_jsonb(v_listing)
  );
END;
$$;

-- ============================================================
-- RPC: auction_buyout
-- ============================================================
CREATE OR REPLACE FUNCTION auction_buyout(
  p_user_id UUID,
  p_user_name VARCHAR,
  p_listing_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_listing auction_listings%ROWTYPE;
  v_user users%ROWTYPE;
  v_active_refund INT := 0;
  v_fee INT;
  v_seller_receives INT;
  v_inventory inventories%ROWTYPE;
  v_items JSONB;
  v_item JSONB;
  v_found BOOLEAN := false;
  v_new_items JSONB := '[]'::JSONB;
BEGIN
  SELECT * INTO v_listing FROM auction_listings WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'status', 404, 'message', 'Phiên đấu giá không tồn tại.');
  END IF;

  IF v_listing.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Phiên đấu giá đã kết thúc.');
  END IF;

  IF NOW() >= v_listing.expires_at THEN
    RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Phiên đấu giá đã hết hạn.');
  END IF;

  IF v_listing.buyout_price IS NULL THEN
    RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Phiên này không hỗ trợ mua ngay.');
  END IF;

  IF v_listing.seller_id = p_user_id THEN
    RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Không thể tự mua.');
  END IF;

  SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'status', 404, 'message', 'Người dùng không tồn tại.');
  END IF;

  IF v_listing.bidder_id = p_user_id THEN
    v_active_refund := v_listing.current_bid;
  END IF;

  IF (COALESCE(v_user.spirit_stones, 0) + v_active_refund) < v_listing.buyout_price THEN
    RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Không đủ Linh Thạch!');
  END IF;
  
  SELECT * INTO v_inventory FROM inventories WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO inventories (user_id) VALUES (p_user_id) RETURNING * INTO v_inventory;
  END IF;
  
  v_items := v_inventory.items;
  IF v_items IS NULL OR jsonb_typeof(v_items) != 'array' THEN
    v_items := '[]'::JSONB;
  END IF;
  
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    IF v_item->>'itemId' = v_listing.item_id THEN
      v_item := jsonb_set(v_item, '{quantity}', to_jsonb((v_item->>'quantity')::int + v_listing.quantity));
      v_found := true;
    END IF;
    v_new_items := v_new_items || v_item;
  END LOOP;
  
  IF NOT v_found THEN
    IF jsonb_array_length(v_items) >= v_inventory.max_slots THEN
      RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Túi đồ đã đầy!');
    END IF;
    v_new_items := v_new_items || jsonb_build_object('itemId', v_listing.item_id, 'quantity', v_listing.quantity);
  END IF;

  IF v_listing.bidder_id IS NOT NULL AND v_listing.current_bid > 0 THEN
    IF v_listing.bidder_id = p_user_id THEN
      v_user.spirit_stones := COALESCE(v_user.spirit_stones, 0) + v_listing.current_bid;
    ELSE
      UPDATE users SET spirit_stones = COALESCE(spirit_stones, 0) + v_listing.current_bid WHERE id = v_listing.bidder_id;
    END IF;
  END IF;

  v_user.spirit_stones := COALESCE(v_user.spirit_stones, 0) - v_listing.buyout_price;
  UPDATE users SET spirit_stones = v_user.spirit_stones WHERE id = p_user_id;

  v_fee := CEIL(v_listing.buyout_price * 0.05);
  v_seller_receives := v_listing.buyout_price - v_fee;
  UPDATE users SET spirit_stones = COALESCE(spirit_stones, 0) + v_seller_receives WHERE id = v_listing.seller_id;

  UPDATE inventories SET items = v_new_items, updated_at = NOW() WHERE id = v_inventory.id;

  UPDATE auction_listings 
  SET status = 'sold', bidder_id = p_user_id, bidder_name = p_user_name, current_bid = v_listing.buyout_price,
      seller_claimed = true, buyer_claimed = true, updated_at = NOW()
  WHERE id = p_listing_id RETURNING * INTO v_listing;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Mua thành công ' || v_listing.quantity || ' ' || v_listing.item_name || ' với giá ' || v_listing.buyout_price || ' Linh Thạch!', 
    'spiritStones', v_user.spirit_stones,
    'listing', to_jsonb(v_listing)
  );
END;
$$;

-- ============================================================
-- Done! All tables created successfully.
-- ============================================================

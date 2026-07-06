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
-- ============================================================
-- RPC: collect_idle_stones
-- ============================================================
CREATE OR REPLACE FUNCTION collect_idle_stones(
  p_user_id UUID,
  p_realm_index INT
) RETURNS JSONB
LANGUAGE plpgsql
AS $BODY
DECLARE
  v_user users%ROWTYPE;
  v_idle_stones_array INT[] := ARRAY[1, 2, 4, 8, 15];
  v_rate INT;
  v_last_collected TIMESTAMPTZ;
  v_elapsed_ms FLOAT;
  v_elapsed_minutes FLOAT;
  v_capped_minutes FLOAT;
  v_pending INT;
  v_new_last_collected TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'status', 404, 'message', 'User không tồn tại');
  END IF;

  v_last_collected := COALESCE(v_user.last_stone_collected_at, v_user.created_at, NOW());
  v_elapsed_ms := EXTRACT(EPOCH FROM (NOW() - v_last_collected)) * 1000;
  v_elapsed_minutes := v_elapsed_ms / 60000;
  
  IF v_elapsed_minutes < 0 THEN 
    v_elapsed_minutes := 0; 
  END IF;

  v_capped_minutes := LEAST(v_elapsed_minutes, 1440); -- 24 * 60 = 1440
  
  IF p_realm_index < 0 THEN p_realm_index := 0; END IF;
  IF p_realm_index > 4 THEN p_realm_index := 4; END IF;
  
  v_rate := v_idle_stones_array[p_realm_index + 1];
  
  v_pending := FLOOR(v_capped_minutes * v_rate);
  
  IF v_pending <= 0 THEN
    RETURN jsonb_build_object('success', true, 'pending', 0, 'spiritStones', v_user.spirit_stones, 'message', 'Chưa có Linh Thạch để thu thập.');
  END IF;

  IF v_elapsed_minutes >= 1440 THEN
    v_new_last_collected := NOW();
  ELSE
    v_new_last_collected := v_last_collected + (v_pending::FLOAT / v_rate) * interval '1 minute';
  END IF;

  UPDATE users 
  SET spirit_stones = COALESCE(spirit_stones, 0) + v_pending, 
      last_stone_collected_at = v_new_last_collected,
      updated_at = NOW()
  WHERE id = p_user_id RETURNING * INTO v_user;

  RETURN jsonb_build_object('success', true, 'pending', v_pending, 'spiritStones', v_user.spirit_stones, 'message', 'Thu thập được ' || v_pending || ' Linh Thạch!');
END;
$BODY;

-- ============================================================
-- RPC: list_auction_item
-- ============================================================
CREATE OR REPLACE FUNCTION list_auction_item(
  p_user_id UUID,
  p_user_name VARCHAR,
  p_item_id VARCHAR,
  p_item_name VARCHAR,
  p_item_rarity VARCHAR,
  p_item_type VARCHAR,
  p_quantity INT,
  p_starting_price INT,
  p_buyout_price INT,
  p_duration_hours INT
) RETURNS JSONB
LANGUAGE plpgsql
AS $BODY
DECLARE
  v_inventory inventories%ROWTYPE;
  v_items JSONB;
  v_item JSONB;
  v_found BOOLEAN := false;
  v_new_items JSONB := '[]'::JSONB;
  v_listing auction_listings%ROWTYPE;
  v_idx INT := 0;
BEGIN
  SELECT * INTO v_inventory FROM inventories WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Không đủ vật phẩm trong túi đồ.');
  END IF;

  v_items := v_inventory.items;
  IF v_items IS NULL OR jsonb_typeof(v_items) != 'array' THEN
    RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Không đủ vật phẩm trong túi đồ.');
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    IF v_item->>'itemId' = p_item_id THEN
      IF (v_item->>'quantity')::int >= p_quantity THEN
        v_found := true;
        IF (v_item->>'quantity')::int > p_quantity THEN
          v_item := jsonb_set(v_item, '{quantity}', to_jsonb((v_item->>'quantity')::int - p_quantity));
          v_new_items := v_new_items || v_item;
        END IF;
      ELSE
        RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Không đủ vật phẩm trong túi đồ.');
      END IF;
    ELSE
      v_new_items := v_new_items || v_item;
    END IF;
  END LOOP;

  IF NOT v_found THEN
    RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Không đủ vật phẩm trong túi đồ.');
  END IF;

  UPDATE inventories SET items = v_new_items, updated_at = NOW() WHERE id = v_inventory.id;

  INSERT INTO auction_listings (
    seller_id, seller_name, item_id, item_name, item_rarity, item_type,
    quantity, starting_price, current_bid, buyout_price, expires_at, status
  ) VALUES (
    p_user_id, p_user_name, p_item_id, p_item_name, p_item_rarity, p_item_type,
    p_quantity, p_starting_price, 0, p_buyout_price, NOW() + (p_duration_hours || ' hours')::interval, 'active'
  ) RETURNING * INTO v_listing;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Đã đăng bán ' || p_quantity || ' ' || p_item_name || ' với giá khởi điểm ' || p_starting_price || ' Linh Thạch.',
    'listing', to_jsonb(v_listing)
  );
END;
$BODY;

-- ============================================================
-- RPC: cancel_auction_listing
-- ============================================================
CREATE OR REPLACE FUNCTION cancel_auction_listing(
  p_user_id UUID,
  p_listing_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
AS $BODY
DECLARE
  v_listing auction_listings%ROWTYPE;
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

  IF v_listing.seller_id != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'status', 403, 'message', 'Chỉ người bán mới có thể huỷ.');
  END IF;

  IF v_listing.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Phiên đấu giá đã kết thúc, không thể huỷ.');
  END IF;

  IF v_listing.bidder_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Đã có người đặt thầu, không thể huỷ.');
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

  UPDATE inventories SET items = v_new_items, updated_at = NOW() WHERE id = v_inventory.id;
  UPDATE auction_listings SET status = 'cancelled', updated_at = NOW() WHERE id = p_listing_id RETURNING * INTO v_listing;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Đã huỷ đấu giá và thu hồi ' || v_listing.quantity || ' ' || v_listing.item_name || '.',
    'listing', to_jsonb(v_listing)
  );
END;
$BODY;

-- ============================================================
-- RPC: claim_auction_listing
-- ============================================================
CREATE OR REPLACE FUNCTION claim_auction_listing(
  p_user_id UUID,
  p_listing_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
AS $BODY
DECLARE
  v_listing auction_listings%ROWTYPE;
  v_user users%ROWTYPE;
  v_inventory inventories%ROWTYPE;
  v_items JSONB;
  v_item JSONB;
  v_found BOOLEAN := false;
  v_new_items JSONB := '[]'::JSONB;
  v_is_seller BOOLEAN;
  v_is_buyer BOOLEAN;
  v_message VARCHAR := '';
  v_fee INT;
  v_seller_receives INT;
BEGIN
  SELECT * INTO v_listing FROM auction_listings WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'status', 404, 'message', 'Phiên đấu giá không tồn tại.');
  END IF;

  IF v_listing.status = 'active' AND NOW() >= v_listing.expires_at THEN
    IF v_listing.bidder_id IS NOT NULL THEN
      v_listing.status := 'pending_claim';
    ELSE
      v_listing.status := 'expired';
    END IF;
    UPDATE auction_listings SET status = v_listing.status, updated_at = NOW() WHERE id = p_listing_id;
  END IF;

  v_is_seller := v_listing.seller_id = p_user_id;
  v_is_buyer := v_listing.bidder_id = p_user_id;

  IF NOT v_is_seller AND NOT v_is_buyer THEN
    RETURN jsonb_build_object('success', false, 'status', 403, 'message', 'Bạn không liên quan đến phiên đấu giá này.');
  END IF;

  SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'status', 404, 'message', 'Người dùng không tồn tại.');
  END IF;

  IF v_is_seller AND NOT v_listing.seller_claimed AND v_listing.status = 'pending_claim' THEN
    v_fee := CEIL(v_listing.current_bid * 0.05);
    v_seller_receives := v_listing.current_bid - v_fee;
    
    v_user.spirit_stones := COALESCE(v_user.spirit_stones, 0) + v_seller_receives;
    UPDATE users SET spirit_stones = v_user.spirit_stones, updated_at = NOW() WHERE id = p_user_id;
    
    v_listing.seller_claimed := true;
    v_message := 'Nhận được ' || v_seller_receives || ' Linh Thạch (đã trừ phí ' || v_fee || ').';
  END IF;

  IF (v_is_buyer AND NOT v_listing.buyer_claimed AND v_listing.status = 'pending_claim') OR 
     (v_is_seller AND NOT v_listing.seller_claimed AND v_listing.status = 'expired') THEN
    
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

    UPDATE inventories SET items = v_new_items, updated_at = NOW() WHERE id = v_inventory.id;

    IF v_is_buyer AND NOT v_listing.buyer_claimed AND v_listing.status = 'pending_claim' THEN
      v_listing.buyer_claimed := true;
      v_message := 'Nhận được ' || v_listing.quantity || ' ' || v_listing.item_name || ' vào túi đồ!';
    END IF;

    IF v_is_seller AND NOT v_listing.seller_claimed AND v_listing.status = 'expired' THEN
      v_listing.seller_claimed := true;
      v_message := 'Không ai mua. Đã thu hồi ' || v_listing.quantity || ' ' || v_listing.item_name || '.';
    END IF;
  END IF;

  IF v_listing.seller_claimed AND v_listing.buyer_claimed THEN
    v_listing.status := 'sold';
  END IF;

  IF v_listing.seller_claimed AND v_listing.status = 'expired' THEN
    v_listing.status := 'cancelled';
  END IF;

  UPDATE auction_listings 
  SET status = v_listing.status, seller_claimed = v_listing.seller_claimed, buyer_claimed = v_listing.buyer_claimed, updated_at = NOW() 
  WHERE id = p_listing_id RETURNING * INTO v_listing;

  IF v_message = '' THEN
    v_message := 'Không có gì để claim.';
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'message', v_message,
    'spiritStones', v_user.spirit_stones,
    'listing', to_jsonb(v_listing)
  );
END;
$BODY;

-- ============================================================
-- Done! All tables and RPCs created successfully.
-- ============================================================
-- ============================================================
-- RPC: buy_shop_item
-- ============================================================
CREATE OR REPLACE FUNCTION buy_shop_item(
  p_user_id UUID,
  p_item_id VARCHAR,
  p_quantity INT,
  p_total_cost INT
) RETURNS JSONB
LANGUAGE plpgsql
AS $BODY
DECLARE
  v_user users%ROWTYPE;
  v_inventory inventories%ROWTYPE;
  v_items JSONB;
  v_item JSONB;
  v_found BOOLEAN := false;
  v_new_items JSONB := '[]'::JSONB;
BEGIN
  SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'User không tồn tại'); END IF;

  IF COALESCE(v_user.spirit_stones, 0) < p_total_cost THEN
    RETURN jsonb_build_object('success', false, 'message', 'Không đủ Linh Thạch!');
  END IF;

  SELECT * INTO v_inventory FROM inventories WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO inventories (user_id) VALUES (p_user_id) RETURNING * INTO v_inventory;
  END IF;

  v_items := v_inventory.items;
  IF v_items IS NULL OR jsonb_typeof(v_items) != 'array' THEN v_items := '[]'::JSONB; END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    IF v_item->>'itemId' = p_item_id THEN
      v_item := jsonb_set(v_item, '{quantity}', to_jsonb((v_item->>'quantity')::int + p_quantity));
      v_found := true;
    END IF;
    v_new_items := v_new_items || v_item;
  END LOOP;

  IF NOT v_found THEN
    IF jsonb_array_length(v_items) >= v_inventory.max_slots THEN
      RETURN jsonb_build_object('success', false, 'message', 'Túi đồ đã đầy!');
    END IF;
    v_new_items := v_new_items || jsonb_build_object('itemId', p_item_id, 'quantity', p_quantity);
  END IF;

  UPDATE users SET spirit_stones = COALESCE(spirit_stones, 0) - p_total_cost, updated_at = NOW() WHERE id = p_user_id RETURNING * INTO v_user;
  UPDATE inventories SET items = v_new_items, updated_at = NOW() WHERE id = v_inventory.id;

  RETURN jsonb_build_object('success', true, 'spiritStones', v_user.spirit_stones);
END;
$BODY;

-- ============================================================
-- RPC: sell_shop_item
-- ============================================================
CREATE OR REPLACE FUNCTION sell_shop_item(
  p_user_id UUID,
  p_item_id VARCHAR,
  p_quantity INT,
  p_total_earned INT
) RETURNS JSONB
LANGUAGE plpgsql
AS $BODY
DECLARE
  v_user users%ROWTYPE;
  v_inventory inventories%ROWTYPE;
  v_items JSONB;
  v_item JSONB;
  v_found BOOLEAN := false;
  v_new_items JSONB := '[]'::JSONB;
BEGIN
  SELECT * INTO v_inventory FROM inventories WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Không đủ vật phẩm trong túi đồ.'); END IF;

  v_items := v_inventory.items;
  IF v_items IS NULL OR jsonb_typeof(v_items) != 'array' THEN v_items := '[]'::JSONB; END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    IF v_item->>'itemId' = p_item_id THEN
      IF (v_item->>'quantity')::int >= p_quantity THEN
        v_found := true;
        IF (v_item->>'quantity')::int > p_quantity THEN
          v_item := jsonb_set(v_item, '{quantity}', to_jsonb((v_item->>'quantity')::int - p_quantity));
          v_new_items := v_new_items || v_item;
        END IF;
      ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Không đủ vật phẩm trong túi đồ.');
      END IF;
    ELSE
      v_new_items := v_new_items || v_item;
    END IF;
  END LOOP;

  IF NOT v_found THEN RETURN jsonb_build_object('success', false, 'message', 'Không đủ vật phẩm trong túi đồ.'); END IF;

  SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;
  
  UPDATE inventories SET items = v_new_items, updated_at = NOW() WHERE id = v_inventory.id;
  UPDATE users SET spirit_stones = COALESCE(spirit_stones, 0) + p_total_earned, updated_at = NOW() WHERE id = p_user_id RETURNING * INTO v_user;

  RETURN jsonb_build_object('success', true, 'spiritStones', v_user.spirit_stones);
END;
$BODY;

-- ============================================================
-- RPC: exchange_pavilion_item
-- ============================================================
CREATE OR REPLACE FUNCTION exchange_pavilion_item(
  p_user_id UUID,
  p_item_id VARCHAR,
  p_price INT
) RETURNS JSONB
LANGUAGE plpgsql
AS $BODY
DECLARE
  v_cult cultivations%ROWTYPE;
  v_inventory inventories%ROWTYPE;
  v_items JSONB;
  v_item JSONB;
  v_found BOOLEAN := false;
  v_new_items JSONB := '[]'::JSONB;
BEGIN
  SELECT * INTO v_cult FROM cultivations WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR COALESCE(v_cult.sect_contribution, 0) < p_price THEN
    RETURN jsonb_build_object('success', false, 'message', 'Không đủ Điểm Cống Hiến.');
  END IF;

  SELECT * INTO v_inventory FROM inventories WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO inventories (user_id) VALUES (p_user_id) RETURNING * INTO v_inventory;
  END IF;

  v_items := v_inventory.items;
  IF v_items IS NULL OR jsonb_typeof(v_items) != 'array' THEN v_items := '[]'::JSONB; END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    IF v_item->>'itemId' = p_item_id THEN
      v_item := jsonb_set(v_item, '{quantity}', to_jsonb((v_item->>'quantity')::int + 1));
      v_found := true;
    END IF;
    v_new_items := v_new_items || v_item;
  END LOOP;

  IF NOT v_found THEN
    IF jsonb_array_length(v_items) >= v_inventory.max_slots THEN
      RETURN jsonb_build_object('success', false, 'message', 'Túi đồ đã đầy!');
    END IF;
    v_new_items := v_new_items || jsonb_build_object('itemId', p_item_id, 'quantity', 1);
  END IF;

  UPDATE cultivations SET sect_contribution = COALESCE(sect_contribution, 0) - p_price, updated_at = NOW() WHERE id = v_cult.id RETURNING * INTO v_cult;
  UPDATE inventories SET items = v_new_items, updated_at = NOW() WHERE id = v_inventory.id;

  RETURN jsonb_build_object('success', true, 'remainingContribution', v_cult.sect_contribution);
END;
$BODY;

-- ============================================================
-- RPC: claim_dungeon_rewards_tx
-- ============================================================
CREATE OR REPLACE FUNCTION claim_dungeon_rewards_tx(
  p_user_id UUID,
  p_spirit_stones INT,
  p_item_drops JSONB
) RETURNS JSONB
LANGUAGE plpgsql
AS $BODY
DECLARE
  v_user users%ROWTYPE;
  v_inventory inventories%ROWTYPE;
  v_items JSONB;
  v_item JSONB;
  v_drop JSONB;
  v_found BOOLEAN;
  v_new_items JSONB;
BEGIN
  IF p_spirit_stones > 0 THEN
    SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;
    UPDATE users SET spirit_stones = COALESCE(spirit_stones, 0) + p_spirit_stones, updated_at = NOW() WHERE id = p_user_id;
  END IF;

  IF jsonb_array_length(p_item_drops) > 0 THEN
    SELECT * INTO v_inventory FROM inventories WHERE user_id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN
      INSERT INTO inventories (user_id) VALUES (p_user_id) RETURNING * INTO v_inventory;
    END IF;

    v_items := v_inventory.items;
    IF v_items IS NULL OR jsonb_typeof(v_items) != 'array' THEN v_items := '[]'::JSONB; END IF;
    
    FOR v_drop IN SELECT * FROM jsonb_array_elements(p_item_drops) LOOP
      v_found := false;
      v_new_items := '[]'::JSONB;
      
      FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
        IF v_item->>'itemId' = v_drop->>'itemId' THEN
          v_item := jsonb_set(v_item, '{quantity}', to_jsonb((v_item->>'quantity')::int + (v_drop->>'quantity')::int));
          v_found := true;
        END IF;
        v_new_items := v_new_items || v_item;
      END LOOP;
      
      IF NOT v_found THEN
        IF jsonb_array_length(v_new_items) < v_inventory.max_slots THEN
          v_new_items := v_new_items || jsonb_build_object('itemId', v_drop->>'itemId', 'quantity', (v_drop->>'quantity')::int);
        END IF;
      END IF;
      
      v_items := v_new_items;
    END LOOP;

    UPDATE inventories SET items = v_items, updated_at = NOW() WHERE id = v_inventory.id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$BODY;

-- ============================================================
-- RPC: commit_breakthrough
-- ============================================================
CREATE OR REPLACE FUNCTION commit_breakthrough(
  p_user_id UUID,
  p_items_used JSONB,
  p_expected_realm_index INT,
  p_new_realm_index INT,
  p_new_exp FLOAT,
  p_new_lifespan INT,
  p_failed_breakthroughs INT,
  p_heart_demon_duration_ms BIGINT
) RETURNS JSONB
LANGUAGE plpgsql
AS $BODY
DECLARE
  v_cult cultivations%ROWTYPE;
  v_inventory inventories%ROWTYPE;
  v_items JSONB;
  v_item JSONB;
  v_new_items JSONB := '[]'::JSONB;
  v_item_id VARCHAR;
  v_qty INT;
  v_active_buffs JSONB;
  v_buff JSONB;
  v_new_buffs JSONB := '[]'::JSONB;
  v_demon_found BOOLEAN := false;
BEGIN
  SELECT * INTO v_cult FROM cultivations WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_cult.realm_index != p_expected_realm_index THEN
    RETURN jsonb_build_object('success', false, 'message', 'Dữ liệu tu vi không đồng bộ.');
  END IF;

  SELECT * INTO v_inventory FROM inventories WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO inventories (user_id) VALUES (p_user_id) RETURNING * INTO v_inventory;
  END IF;

  v_items := v_inventory.items;
  IF v_items IS NULL OR jsonb_typeof(v_items) != 'array' THEN v_items := '[]'::JSONB; END IF;

  FOR v_item_id, v_qty IN SELECT key, value::int FROM jsonb_each(p_items_used) LOOP
    DECLARE
      v_found_item BOOLEAN := false;
    BEGIN
      v_new_items := '[]'::JSONB;
      FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
        IF v_item->>'itemId' = v_item_id THEN
          IF (v_item->>'quantity')::int >= v_qty THEN
            v_found_item := true;
            IF (v_item->>'quantity')::int > v_qty THEN
              v_item := jsonb_set(v_item, '{quantity}', to_jsonb((v_item->>'quantity')::int - v_qty));
              v_new_items := v_new_items || v_item;
            END IF;
          ELSE
            RETURN jsonb_build_object('success', false, 'message', 'Không đủ vật phẩm ' || v_item_id);
          END IF;
        ELSE
          v_new_items := v_new_items || v_item;
        END IF;
      END LOOP;
      IF NOT v_found_item THEN
        RETURN jsonb_build_object('success', false, 'message', 'Không tìm thấy vật phẩm ' || v_item_id);
      END IF;
      v_items := v_new_items;
    END;
  END LOOP;

  v_active_buffs := v_inventory.active_buffs;
  IF v_active_buffs IS NULL OR jsonb_typeof(v_active_buffs) != 'array' THEN v_active_buffs := '[]'::JSONB; END IF;
  
  IF p_heart_demon_duration_ms > 0 THEN
    FOR v_buff IN SELECT * FROM jsonb_array_elements(v_active_buffs) LOOP
      IF v_buff->>'buffType' = 'SPEED_HEART_DEMON' THEN
        v_buff := jsonb_set(v_buff, '{expiresAt}', to_jsonb(
          TO_CHAR(TO_TIMESTAMP((GREATEST(EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM (v_buff->>'expiresAt')::TIMESTAMPTZ) * 1000) + p_heart_demon_duration_ms) / 1000.0), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
        ));
        v_demon_found := true;
      END IF;
      v_new_buffs := v_new_buffs || v_buff;
    END LOOP;
    
    IF NOT v_demon_found THEN
      v_new_buffs := v_new_buffs || jsonb_build_object(
        'buffType', 'SPEED_HEART_DEMON', 
        'multiplier', 0.5, 
        'expiresAt', TO_CHAR(NOW() + (p_heart_demon_duration_ms || ' milliseconds')::interval, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      );
    END IF;
  ELSE
    v_new_buffs := v_active_buffs;
  END IF;

  UPDATE cultivations 
  SET realm_index = p_new_realm_index, exp_accumulated = p_new_exp, lifespan = p_new_lifespan, 
      failed_breakthroughs = p_failed_breakthroughs, breakthrough_ready_at = NULL, last_stopped_at = NOW(), updated_at = NOW() 
  WHERE id = v_cult.id;
  
  UPDATE inventories SET items = v_items, active_buffs = v_new_buffs, updated_at = NOW() WHERE id = v_inventory.id;

  RETURN jsonb_build_object('success', true);
END;
$BODY;

-- ============================================================
-- RPC: commit_use_item
-- ============================================================
CREATE OR REPLACE FUNCTION commit_use_item(
  p_user_id UUID,
  p_item_id VARCHAR,
  p_quantity INT,
  p_new_exp FLOAT,
  p_new_lifespan INT,
  p_breakthrough_ready_at TIMESTAMPTZ,
  p_heart_demon_duration_ms BIGINT,
  p_speed_buff JSONB
) RETURNS JSONB
LANGUAGE plpgsql
AS $BODY
DECLARE
  v_cult cultivations%ROWTYPE;
  v_inventory inventories%ROWTYPE;
  v_items JSONB;
  v_item JSONB;
  v_new_items JSONB := '[]'::JSONB;
  v_active_buffs JSONB;
  v_buff JSONB;
  v_new_buffs JSONB := '[]'::JSONB;
  v_demon_found BOOLEAN := false;
  v_speed_found BOOLEAN := false;
  v_found BOOLEAN := false;
BEGIN
  SELECT * INTO v_cult FROM cultivations WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Không tìm thấy dữ liệu tu vi.'); END IF;

  SELECT * INTO v_inventory FROM inventories WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Không tìm thấy túi đồ.'); END IF;

  v_items := v_inventory.items;
  IF v_items IS NULL OR jsonb_typeof(v_items) != 'array' THEN v_items := '[]'::JSONB; END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    IF v_item->>'itemId' = p_item_id THEN
      IF (v_item->>'quantity')::int >= p_quantity THEN
        v_found := true;
        IF (v_item->>'quantity')::int > p_quantity THEN
          v_item := jsonb_set(v_item, '{quantity}', to_jsonb((v_item->>'quantity')::int - p_quantity));
          v_new_items := v_new_items || v_item;
        END IF;
      ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Không đủ vật phẩm.');
      END IF;
    ELSE
      v_new_items := v_new_items || v_item;
    END IF;
  END LOOP;

  IF NOT v_found THEN RETURN jsonb_build_object('success', false, 'message', 'Không tìm thấy vật phẩm.'); END IF;
  v_items := v_new_items;

  v_active_buffs := v_inventory.active_buffs;
  IF v_active_buffs IS NULL OR jsonb_typeof(v_active_buffs) != 'array' THEN v_active_buffs := '[]'::JSONB; END IF;
  
  IF p_heart_demon_duration_ms > 0 THEN
    v_new_buffs := '[]'::JSONB;
    FOR v_buff IN SELECT * FROM jsonb_array_elements(v_active_buffs) LOOP
      IF v_buff->>'buffType' = 'SPEED_HEART_DEMON' THEN
        v_buff := jsonb_set(v_buff, '{expiresAt}', to_jsonb(
          TO_CHAR(TO_TIMESTAMP((GREATEST(EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM (v_buff->>'expiresAt')::TIMESTAMPTZ) * 1000) + p_heart_demon_duration_ms) / 1000.0), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
        ));
        v_demon_found := true;
      END IF;
      v_new_buffs := v_new_buffs || v_buff;
    END LOOP;
    IF NOT v_demon_found THEN
      v_new_buffs := v_new_buffs || jsonb_build_object('buffType', 'SPEED_HEART_DEMON', 'multiplier', 0.5, 'expiresAt', TO_CHAR(NOW() + (p_heart_demon_duration_ms || ' milliseconds')::interval, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
    END IF;
    v_active_buffs := v_new_buffs;
  END IF;

  IF p_speed_buff IS NOT NULL THEN
    v_new_buffs := '[]'::JSONB;
    v_speed_found := false;
    FOR v_buff IN SELECT * FROM jsonb_array_elements(v_active_buffs) LOOP
      IF v_buff->>'buffType' = p_speed_buff->>'buffType' THEN
        v_buff := jsonb_set(v_buff, '{expiresAt}', to_jsonb(
          TO_CHAR(TO_TIMESTAMP((GREATEST(EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM (v_buff->>'expiresAt')::TIMESTAMPTZ) * 1000) + (p_speed_buff->>'durationHours')::FLOAT * 3600 * 1000) / 1000.0), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
        ));
        v_speed_found := true;
      END IF;
      v_new_buffs := v_new_buffs || v_buff;
    END LOOP;
    IF NOT v_speed_found THEN
      v_new_buffs := v_new_buffs || jsonb_build_object(
        'buffType', p_speed_buff->>'buffType', 
        'multiplier', p_speed_buff->>'multiplier', 
        'expiresAt', TO_CHAR(NOW() + ((p_speed_buff->>'durationHours')::FLOAT || ' hours')::interval, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      );
    END IF;
    v_active_buffs := v_new_buffs;
  END IF;

  UPDATE cultivations 
  SET exp_accumulated = p_new_exp, lifespan = p_new_lifespan, breakthrough_ready_at = p_breakthrough_ready_at, updated_at = NOW() 
  WHERE id = v_cult.id;
  
  UPDATE inventories SET items = v_items, active_buffs = v_active_buffs, updated_at = NOW() WHERE id = v_inventory.id;

  RETURN jsonb_build_object('success', true);
END;
$BODY;

-- ============================================================
-- Done! All tables and RPCs created successfully.
-- ============================================================

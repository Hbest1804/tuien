-- ════════════════════════════════════════════════════════════════════════════════
-- TUTIEN GAME — Full Database Schema (All-in-One)
-- Supabase Dashboard > SQL Editor > Paste & Run
--
-- Gồm cả Phase 1 (Core) + Phase 2 (Advanced Features)
-- Script dùng IF NOT EXISTS nên có thể chạy lại an toàn trên DB đã có sẵn.
-- ════════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ════════════════════════════════════════════════════════════════════════════════
-- PHẦN 1: BẢNG CỐT LÕI (CORE TABLES)
-- ════════════════════════════════════════════════════════════════════════════════

-- ── users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  username                VARCHAR(50)  NOT NULL UNIQUE,
  email                   VARCHAR(255) NOT NULL UNIQUE,
  password                VARCHAR      NOT NULL,
  gender                  VARCHAR(10)  DEFAULT NULL CHECK (gender IN ('male', 'female') OR gender IS NULL),
  spirit_root             VARCHAR(50)  DEFAULT NULL,
  spirit_root_grade       VARCHAR(10)  DEFAULT NULL CHECK (spirit_root_grade IN ('Thiên', 'Địa', 'Huyền', 'Hoàng') OR spirit_root_grade IS NULL),
  is_character_created    BOOLEAN      NOT NULL DEFAULT FALSE,
  spirit_stones           INTEGER      NOT NULL DEFAULT 100 CHECK (spirit_stones >= 0),
  last_stone_collected_at TIMESTAMPTZ  DEFAULT NULL,
  -- Auth / Security
  reset_otp               VARCHAR(6)   DEFAULT NULL,
  reset_otp_expires_at    TIMESTAMPTZ  DEFAULT NULL,
  -- Admin
  role                    VARCHAR(10)  NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'admin')),
  is_banned               BOOLEAN      NOT NULL DEFAULT FALSE,
  is_muted                BOOLEAN      NOT NULL DEFAULT FALSE,
  -- VIP / Tiên Ngọc
  jade_coins              INTEGER      NOT NULL DEFAULT 0,
  vip_level               INTEGER      NOT NULL DEFAULT 0,
  vip_expiry_at           TIMESTAMPTZ  DEFAULT NULL,
  created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email    ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_role     ON users (role);

-- ── cultivations ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cultivations (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  is_training           BOOLEAN      NOT NULL DEFAULT FALSE,
  training_started_at   TIMESTAMPTZ  DEFAULT NULL,
  exp_accumulated       FLOAT        NOT NULL DEFAULT 0,
  realm_index           INTEGER      NOT NULL DEFAULT 0 CHECK (realm_index >= 0 AND realm_index <= 4),
  sect_name             VARCHAR(100) DEFAULT NULL,
  sect_joined_at        TIMESTAMPTZ  DEFAULT NULL,
  sect_contribution     FLOAT        NOT NULL DEFAULT 0 CHECK (sect_contribution >= 0),
  sect_rank             VARCHAR(20)  NOT NULL DEFAULT 'Tạp Dịch'
                          CHECK (sect_rank IN ('Tạp Dịch', 'Ngoại Môn', 'Nội Môn', 'Chân Truyền', 'Trưởng Lão', 'Tông Chủ')),
  sect_missions         JSONB        NOT NULL DEFAULT '[]',
  last_mission_refresh  TIMESTAMPTZ  DEFAULT NULL,
  active_mission_id     VARCHAR(50)  DEFAULT NULL,
  last_stopped_at       TIMESTAMPTZ  DEFAULT NULL,
  breakthrough_ready_at TIMESTAMPTZ  DEFAULT NULL,
  lifespan              FLOAT        NOT NULL DEFAULT 100,
  failed_breakthroughs  INTEGER      NOT NULL DEFAULT 0,
  daily_pills_consumed  JSONB        NOT NULL DEFAULT '{"count": 0, "date": ""}',
  -- Dungeon
  is_exploring          BOOLEAN      NOT NULL DEFAULT FALSE,
  current_dungeon_id    VARCHAR(50)  DEFAULT NULL,
  explore_started_at    TIMESTAMPTZ  DEFAULT NULL,
  -- Phase 2: Dungeon multi-floor
  current_floor         INTEGER      DEFAULT NULL,
  floor_events          JSONB        NOT NULL DEFAULT '[]',
  -- Phase 2: Đệ tử / Đạo Lữ
  master_id             UUID         REFERENCES users(id) ON DELETE SET NULL,
  disciples             JSONB        NOT NULL DEFAULT '[]',
  partner_id            UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cultivations_user_id ON cultivations (user_id);
CREATE INDEX IF NOT EXISTS idx_cultivations_realm   ON cultivations (realm_index DESC, exp_accumulated DESC);

-- ── inventories ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventories (
  id                      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID    NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  max_slots               INTEGER NOT NULL DEFAULT 50,
  items                   JSONB   NOT NULL DEFAULT '[]',
  equipment               JSONB   NOT NULL DEFAULT '{"weapon": null, "armor": null}',
  technique_passive_bonus FLOAT   NOT NULL DEFAULT 0 CHECK (technique_passive_bonus >= 0),
  active_buffs            JSONB   NOT NULL DEFAULT '[]',
  -- Phase 2: Enchant system
  enchants                JSONB   NOT NULL DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventories_user_id ON inventories (user_id);

-- ── auction_listings ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auction_listings (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_name    VARCHAR(50) NOT NULL,
  item_id        VARCHAR(50) NOT NULL,
  item_name      VARCHAR(100) NOT NULL,
  item_rarity    VARCHAR(20) NOT NULL DEFAULT 'Thường',
  item_type      VARCHAR(30) NOT NULL DEFAULT 'MATERIAL',
  quantity       INTEGER     NOT NULL CHECK (quantity >= 1),
  starting_price INTEGER     NOT NULL CHECK (starting_price >= 1),
  current_bid    INTEGER     NOT NULL DEFAULT 0,
  buyout_price   INTEGER     DEFAULT NULL,
  bidder_id      UUID        DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  bidder_name    VARCHAR(50) DEFAULT NULL,
  status         VARCHAR(20) NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'sold', 'expired', 'cancelled', 'pending_claim')),
  expires_at     TIMESTAMPTZ NOT NULL,
  seller_claimed BOOLEAN     NOT NULL DEFAULT FALSE,
  buyer_claimed  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auction_status         ON auction_listings (status);
CREATE INDEX IF NOT EXISTS idx_auction_expires        ON auction_listings (expires_at);
CREATE INDEX IF NOT EXISTS idx_auction_seller         ON auction_listings (seller_id, status);
CREATE INDEX IF NOT EXISTS idx_auction_bidder         ON auction_listings (bidder_id, status);
CREATE INDEX IF NOT EXISTS idx_auction_status_expires ON auction_listings (status, expires_at);

-- ── refresh_tokens ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR     NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens (token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user  ON refresh_tokens (user_id, is_revoked);

-- ════════════════════════════════════════════════════════════════════════════════
-- PHẦN 2: BẢNG PHASE 2 (ADVANCED FEATURES)
-- ════════════════════════════════════════════════════════════════════════════════

-- ── pvp_records ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pvp_records (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID    NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL DEFAULT 1200,
  wins       INTEGER NOT NULL DEFAULT 0,
  losses     INTEGER NOT NULL DEFAULT 0,
  history    JSONB   NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pvp_records_user_id ON pvp_records (user_id);
CREATE INDEX IF NOT EXISTS idx_pvp_records_rating  ON pvp_records (rating DESC);

-- ── sect_wars ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sect_wars (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  declared_by      TEXT    NOT NULL,
  linh_mach_states JSONB   NOT NULL DEFAULT '{}',
  sect_scores      JSONB   NOT NULL DEFAULT '{}',
  attack_log       JSONB   NOT NULL DEFAULT '[]',
  settled          BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sect_wars_created_at ON sect_wars (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sect_wars_settled     ON sect_wars (settled) WHERE settled = false;

-- ── sects (kiến trúc tông môn) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  buildings  JSONB NOT NULL DEFAULT '{}',
  resources  JSONB NOT NULL DEFAULT '{"linh_thach": 0}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sects_name ON sects (name);

-- ── achievements ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  unlocked   JSONB NOT NULL DEFAULT '[]',
  progress   JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements (user_id);

-- ── daily_quest_progress ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_quest_progress (
  id              UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID  NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  date            DATE  NOT NULL DEFAULT CURRENT_DATE,
  completed_tasks JSONB NOT NULL DEFAULT '[]',
  progress        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dqprogress_user_id ON daily_quest_progress (user_id);

-- ── main_quest_progress ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS main_quest_progress (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  completed_quests JSONB       NOT NULL DEFAULT '[]',
  active_quest_id  VARCHAR(50) DEFAULT NULL,
  progress         JSONB       NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mqprogress_user_id ON main_quest_progress (user_id);

-- ── transaction_logs ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transaction_logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(50) NOT NULL,
  detail     JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_txlogs_user_id    ON transaction_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_txlogs_type        ON transaction_logs (type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_txlogs_created_at  ON transaction_logs (created_at DESC);

-- ── admin_audit_logs ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID         NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  admin_name  VARCHAR(50)  NOT NULL,
  action      VARCHAR(100) NOT NULL,
  target_id   UUID         DEFAULT NULL,
  target_name VARCHAR(100) DEFAULT NULL,
  details     JSONB        NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin   ON admin_audit_logs (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target  ON admin_audit_logs (target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_logs (created_at DESC);

-- ── mail_inbox ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mail_inbox (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_name  VARCHAR(50)  NOT NULL DEFAULT 'Hệ Thống',
  subject      VARCHAR(200) NOT NULL,
  body         TEXT         NOT NULL,
  attachment   JSONB        DEFAULT NULL,
  is_read      BOOLEAN      NOT NULL DEFAULT FALSE,
  is_claimed   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mail_recipient ON mail_inbox (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mail_unread    ON mail_inbox (recipient_id, is_read) WHERE is_read = FALSE;

-- ── server_config ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS server_config (
  key        VARCHAR(100) PRIMARY KEY,
  value      JSONB        NOT NULL,
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(50)  DEFAULT NULL
);

INSERT INTO server_config (key, value) VALUES
  ('global_buff',  '{"enabled": false, "multiplier": 1, "label": "", "expires_at": null}'),
  ('announcement', '{"enabled": false, "message": "", "type": "info"}')
ON CONFLICT (key) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════════
-- PHẦN 3: ROW LEVEL SECURITY
-- Backend dùng service_role key nên disable RLS cho tất cả bảng
-- ════════════════════════════════════════════════════════════════════════════════
ALTER TABLE users              DISABLE ROW LEVEL SECURITY;
ALTER TABLE cultivations       DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventories        DISABLE ROW LEVEL SECURITY;
ALTER TABLE auction_listings   DISABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens     DISABLE ROW LEVEL SECURITY;
ALTER TABLE pvp_records        DISABLE ROW LEVEL SECURITY;
ALTER TABLE sect_wars          DISABLE ROW LEVEL SECURITY;
ALTER TABLE sects              DISABLE ROW LEVEL SECURITY;
ALTER TABLE achievements       DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quest_progress   DISABLE ROW LEVEL SECURITY;
ALTER TABLE main_quest_progress    DISABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_logs   DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs   DISABLE ROW LEVEL SECURITY;
ALTER TABLE mail_inbox         DISABLE ROW LEVEL SECURITY;
ALTER TABLE server_config      DISABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════════════════════════════
-- PHẦN 4: TRIGGERS (auto updated_at)
-- ════════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Core tables
DROP TRIGGER IF EXISTS set_updated_at_users ON users;
CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_cultivations ON cultivations;
CREATE TRIGGER set_updated_at_cultivations
  BEFORE UPDATE ON cultivations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_inventories ON inventories;
CREATE TRIGGER set_updated_at_inventories
  BEFORE UPDATE ON inventories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_auction_listings ON auction_listings;
CREATE TRIGGER set_updated_at_auction_listings
  BEFORE UPDATE ON auction_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Phase 2 tables
DROP TRIGGER IF EXISTS set_updated_at_pvp_records ON pvp_records;
CREATE TRIGGER set_updated_at_pvp_records
  BEFORE UPDATE ON pvp_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_sects ON sects;
CREATE TRIGGER set_updated_at_sects
  BEFORE UPDATE ON sects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_achievements ON achievements;
CREATE TRIGGER set_updated_at_achievements
  BEFORE UPDATE ON achievements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_dq_progress ON daily_quest_progress;
CREATE TRIGGER set_updated_at_dq_progress
  BEFORE UPDATE ON daily_quest_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_mq_progress ON main_quest_progress;
CREATE TRIGGER set_updated_at_mq_progress
  BEFORE UPDATE ON main_quest_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Auto-update sect_rank theo sect_contribution ─────────────────────────────
CREATE OR REPLACE FUNCTION update_sect_rank()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sect_name IS NULL THEN
    NEW.sect_rank := 'Tạp Dịch';
  ELSE
    IF NEW.sect_contribution >= 10000 THEN      NEW.sect_rank := 'Tông Chủ';
    ELSIF NEW.sect_contribution >= 5000 THEN    NEW.sect_rank := 'Trưởng Lão';
    ELSIF NEW.sect_contribution >= 2000 THEN    NEW.sect_rank := 'Chân Truyền';
    ELSIF NEW.sect_contribution >= 500 THEN     NEW.sect_rank := 'Nội Môn';
    ELSIF NEW.sect_contribution >= 100 THEN     NEW.sect_rank := 'Ngoại Môn';
    ELSE                                        NEW.sect_rank := 'Tạp Dịch';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sect_rank ON cultivations;
CREATE TRIGGER trigger_update_sect_rank
  BEFORE INSERT OR UPDATE OF sect_contribution, sect_name ON cultivations
  FOR EACH ROW EXECUTE FUNCTION update_sect_rank();

-- ════════════════════════════════════════════════════════════════════════════════
-- PHẦN 5: RPC FUNCTIONS — CORE
-- ════════════════════════════════════════════════════════════════════════════════

-- ── place_auction_bid ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION place_auction_bid(
  p_user_id UUID, p_user_name VARCHAR, p_listing_id UUID, p_bid_amount INT
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_listing auction_listings%ROWTYPE;
  v_user users%ROWTYPE;
  v_current_price INT;
  v_min_bid INT;
  v_active_refund INT := 0;
BEGIN
  SELECT * INTO v_listing FROM auction_listings WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'status', 404, 'message', 'Phiên đấu giá không tồn tại.'); END IF;
  IF v_listing.status != 'active' THEN RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Phiên đấu giá đã kết thúc.'); END IF;
  IF NOW() >= v_listing.expires_at THEN RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Phiên đấu giá đã hết hạn.'); END IF;
  IF v_listing.seller_id = p_user_id THEN RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Không thể tự đấu giá vật phẩm của mình.'); END IF;
  IF v_listing.buyout_price IS NOT NULL AND p_bid_amount >= v_listing.buyout_price THEN
    RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Giá thầu lớn hơn hoặc bằng giá mua ngay. Vui lòng Mua Ngay.');
  END IF;
  v_current_price := GREATEST(v_listing.current_bid, v_listing.starting_price);
  v_min_bid := CEIL(v_current_price * 1.05);
  IF p_bid_amount < v_min_bid THEN RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Giá thầu tối thiểu là ' || v_min_bid || ' Linh Thạch.'); END IF;
  SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'status', 404, 'message', 'Người dùng không tồn tại.'); END IF;
  IF v_listing.bidder_id = p_user_id THEN v_active_refund := v_listing.current_bid; END IF;
  IF (COALESCE(v_user.spirit_stones, 0) + v_active_refund) < p_bid_amount THEN RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Không đủ Linh Thạch!'); END IF;
  IF v_listing.bidder_id IS NOT NULL AND v_listing.current_bid > 0 THEN
    IF v_listing.bidder_id = p_user_id THEN v_user.spirit_stones := COALESCE(v_user.spirit_stones, 0) + v_listing.current_bid;
    ELSE UPDATE users SET spirit_stones = COALESCE(spirit_stones, 0) + v_listing.current_bid WHERE id = v_listing.bidder_id; END IF;
  END IF;
  v_user.spirit_stones := COALESCE(v_user.spirit_stones, 0) - p_bid_amount;
  UPDATE users SET spirit_stones = v_user.spirit_stones WHERE id = p_user_id;
  UPDATE auction_listings SET current_bid = p_bid_amount, bidder_id = p_user_id, bidder_name = p_user_name, updated_at = NOW() WHERE id = p_listing_id RETURNING * INTO v_listing;
  RETURN jsonb_build_object('success', true, 'message', 'Đặt thầu ' || p_bid_amount || ' Linh Thạch thành công!', 'spiritStones', v_user.spirit_stones, 'listing', to_jsonb(v_listing));
END;
$$;

-- ── auction_buyout ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION auction_buyout(
  p_user_id UUID, p_user_name VARCHAR, p_listing_id UUID
) RETURNS JSONB LANGUAGE plpgsql AS $$
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
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'status', 404, 'message', 'Phiên đấu giá không tồn tại.'); END IF;
  IF v_listing.status != 'active' THEN RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Phiên đấu giá đã kết thúc.'); END IF;
  IF NOW() >= v_listing.expires_at THEN RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Phiên đấu giá đã hết hạn.'); END IF;
  IF v_listing.buyout_price IS NULL THEN RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Phiên này không hỗ trợ mua ngay.'); END IF;
  IF v_listing.seller_id = p_user_id THEN RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Không thể tự mua.'); END IF;
  SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'status', 404, 'message', 'Người dùng không tồn tại.'); END IF;
  IF v_listing.bidder_id = p_user_id THEN v_active_refund := v_listing.current_bid; END IF;
  IF (COALESCE(v_user.spirit_stones, 0) + v_active_refund) < v_listing.buyout_price THEN RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Không đủ Linh Thạch!'); END IF;
  SELECT * INTO v_inventory FROM inventories WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN INSERT INTO inventories (user_id) VALUES (p_user_id) RETURNING * INTO v_inventory; END IF;
  v_items := v_inventory.items;
  IF v_items IS NULL OR jsonb_typeof(v_items) != 'array' THEN v_items := '[]'::JSONB; END IF;
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    IF v_item->>'itemId' = v_listing.item_id THEN
      v_item := jsonb_set(v_item, '{quantity}', to_jsonb((v_item->>'quantity')::int + v_listing.quantity));
      v_found := true;
    END IF;
    v_new_items := v_new_items || v_item;
  END LOOP;
  IF NOT v_found THEN
    IF jsonb_array_length(v_items) >= v_inventory.max_slots THEN RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Túi đồ đã đầy!'); END IF;
    v_new_items := v_new_items || jsonb_build_object('itemId', v_listing.item_id, 'quantity', v_listing.quantity);
  END IF;
  IF v_listing.bidder_id IS NOT NULL AND v_listing.current_bid > 0 THEN
    IF v_listing.bidder_id = p_user_id THEN v_user.spirit_stones := COALESCE(v_user.spirit_stones, 0) + v_listing.current_bid;
    ELSE UPDATE users SET spirit_stones = COALESCE(spirit_stones, 0) + v_listing.current_bid WHERE id = v_listing.bidder_id; END IF;
  END IF;
  v_user.spirit_stones := COALESCE(v_user.spirit_stones, 0) - v_listing.buyout_price;
  UPDATE users SET spirit_stones = v_user.spirit_stones WHERE id = p_user_id;
  v_fee := CEIL(v_listing.buyout_price * 0.05);
  v_seller_receives := v_listing.buyout_price - v_fee;
  UPDATE users SET spirit_stones = COALESCE(spirit_stones, 0) + v_seller_receives WHERE id = v_listing.seller_id;
  UPDATE inventories SET items = v_new_items, updated_at = NOW() WHERE id = v_inventory.id;
  UPDATE auction_listings SET status = 'sold', bidder_id = p_user_id, bidder_name = p_user_name, current_bid = v_listing.buyout_price, seller_claimed = true, buyer_claimed = true, updated_at = NOW() WHERE id = p_listing_id RETURNING * INTO v_listing;
  RETURN jsonb_build_object('success', true, 'message', 'Mua thành công ' || v_listing.quantity || ' ' || v_listing.item_name || ' với giá ' || v_listing.buyout_price || ' Linh Thạch!', 'spiritStones', v_user.spirit_stones, 'listing', to_jsonb(v_listing));
END;
$$;

-- ── list_auction_item ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION list_auction_item(
  p_user_id UUID, p_user_name VARCHAR, p_item_id VARCHAR, p_item_name VARCHAR,
  p_item_rarity VARCHAR, p_item_type VARCHAR, p_quantity INT, p_starting_price INT,
  p_buyout_price INT, p_duration_hours INT
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_inventory inventories%ROWTYPE;
  v_items JSONB;
  v_item JSONB;
  v_found BOOLEAN := false;
  v_new_items JSONB := '[]'::JSONB;
  v_listing auction_listings%ROWTYPE;
BEGIN
  SELECT * INTO v_inventory FROM inventories WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Không đủ vật phẩm trong túi đồ.'); END IF;
  IF v_inventory.equipment->>'weapon' = p_item_id OR v_inventory.equipment->>'armor' = p_item_id THEN
    RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Không thể đăng bán vật phẩm đang trang bị.');
  END IF;
  v_items := v_inventory.items;
  IF v_items IS NULL OR jsonb_typeof(v_items) != 'array' THEN RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Không đủ vật phẩm trong túi đồ.'); END IF;
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    IF v_item->>'itemId' = p_item_id THEN
      IF (v_item->>'quantity')::int >= p_quantity THEN
        v_found := true;
        IF (v_item->>'quantity')::int > p_quantity THEN
          v_item := jsonb_set(v_item, '{quantity}', to_jsonb((v_item->>'quantity')::int - p_quantity));
          v_new_items := v_new_items || v_item;
        END IF;
      ELSE RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Không đủ vật phẩm trong túi đồ.'); END IF;
    ELSE v_new_items := v_new_items || v_item; END IF;
  END LOOP;
  IF NOT v_found THEN RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Không đủ vật phẩm trong túi đồ.'); END IF;
  UPDATE inventories SET items = v_new_items, updated_at = NOW() WHERE id = v_inventory.id;
  INSERT INTO auction_listings (seller_id, seller_name, item_id, item_name, item_rarity, item_type, quantity, starting_price, current_bid, buyout_price, expires_at, status)
  VALUES (p_user_id, p_user_name, p_item_id, p_item_name, p_item_rarity, p_item_type, p_quantity, p_starting_price, 0, p_buyout_price, NOW() + (p_duration_hours || ' hours')::interval, 'active')
  RETURNING * INTO v_listing;
  RETURN jsonb_build_object('success', true, 'message', 'Đã đăng bán ' || p_quantity || ' ' || p_item_name || ' với giá khởi điểm ' || p_starting_price || ' Linh Thạch.', 'listing', to_jsonb(v_listing));
END;
$$;

-- ── cancel_auction_listing ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION cancel_auction_listing(
  p_user_id UUID, p_listing_id UUID
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_listing auction_listings%ROWTYPE;
  v_inventory inventories%ROWTYPE;
  v_items JSONB; v_item JSONB; v_found BOOLEAN := false; v_new_items JSONB := '[]'::JSONB;
BEGIN
  SELECT * INTO v_listing FROM auction_listings WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'status', 404, 'message', 'Phiên đấu giá không tồn tại.'); END IF;
  IF v_listing.seller_id != p_user_id THEN RETURN jsonb_build_object('success', false, 'status', 403, 'message', 'Chỉ người bán mới có thể huỷ.'); END IF;
  IF v_listing.status != 'active' THEN RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Phiên đấu giá đã kết thúc, không thể huỷ.'); END IF;
  IF v_listing.bidder_id IS NOT NULL THEN RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Đã có người đặt thầu, không thể huỷ.'); END IF;
  SELECT * INTO v_inventory FROM inventories WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN INSERT INTO inventories (user_id) VALUES (p_user_id) RETURNING * INTO v_inventory; END IF;
  v_items := v_inventory.items;
  IF v_items IS NULL OR jsonb_typeof(v_items) != 'array' THEN v_items := '[]'::JSONB; END IF;
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    IF v_item->>'itemId' = v_listing.item_id THEN
      v_item := jsonb_set(v_item, '{quantity}', to_jsonb((v_item->>'quantity')::int + v_listing.quantity));
      v_found := true;
    END IF;
    v_new_items := v_new_items || v_item;
  END LOOP;
  IF NOT v_found THEN
    IF jsonb_array_length(v_items) >= v_inventory.max_slots THEN RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Túi đồ đã đầy!'); END IF;
    v_new_items := v_new_items || jsonb_build_object('itemId', v_listing.item_id, 'quantity', v_listing.quantity);
  END IF;
  UPDATE inventories SET items = v_new_items, updated_at = NOW() WHERE id = v_inventory.id;
  UPDATE auction_listings SET status = 'cancelled', updated_at = NOW() WHERE id = p_listing_id RETURNING * INTO v_listing;
  RETURN jsonb_build_object('success', true, 'message', 'Đã huỷ đấu giá và thu hồi ' || v_listing.quantity || ' ' || v_listing.item_name || '.', 'listing', to_jsonb(v_listing));
END;
$$;

-- ── claim_auction_listing ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION claim_auction_listing(
  p_user_id UUID, p_listing_id UUID
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_listing auction_listings%ROWTYPE;
  v_user users%ROWTYPE;
  v_inventory inventories%ROWTYPE;
  v_items JSONB; v_item JSONB; v_found BOOLEAN := false; v_new_items JSONB := '[]'::JSONB;
  v_is_seller BOOLEAN; v_is_buyer BOOLEAN; v_message VARCHAR := '';
  v_fee INT; v_seller_receives INT;
BEGIN
  SELECT * INTO v_listing FROM auction_listings WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'status', 404, 'message', 'Phiên đấu giá không tồn tại.'); END IF;
  IF v_listing.status = 'active' AND NOW() >= v_listing.expires_at THEN
    IF v_listing.bidder_id IS NOT NULL THEN v_listing.status := 'pending_claim';
    ELSE v_listing.status := 'expired'; END IF;
    UPDATE auction_listings SET status = v_listing.status, updated_at = NOW() WHERE id = p_listing_id;
  END IF;
  v_is_seller := v_listing.seller_id = p_user_id;
  v_is_buyer  := v_listing.bidder_id = p_user_id;
  IF NOT v_is_seller AND NOT v_is_buyer THEN RETURN jsonb_build_object('success', false, 'status', 403, 'message', 'Bạn không liên quan đến phiên đấu giá này.'); END IF;
  SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'status', 404, 'message', 'Người dùng không tồn tại.'); END IF;
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
    IF NOT FOUND THEN INSERT INTO inventories (user_id) VALUES (p_user_id) RETURNING * INTO v_inventory; END IF;
    v_items := v_inventory.items;
    IF v_items IS NULL OR jsonb_typeof(v_items) != 'array' THEN v_items := '[]'::JSONB; END IF;
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
      IF v_item->>'itemId' = v_listing.item_id THEN
        v_item := jsonb_set(v_item, '{quantity}', to_jsonb((v_item->>'quantity')::int + v_listing.quantity));
        v_found := true;
      END IF;
      v_new_items := v_new_items || v_item;
    END LOOP;
    IF NOT v_found THEN
      IF jsonb_array_length(v_items) >= v_inventory.max_slots THEN RETURN jsonb_build_object('success', false, 'status', 400, 'message', 'Túi đồ đã đầy!'); END IF;
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
  IF v_listing.seller_claimed AND v_listing.buyer_claimed THEN v_listing.status := 'sold'; END IF;
  IF v_listing.seller_claimed AND v_listing.status = 'expired' THEN v_listing.status := 'cancelled'; END IF;
  UPDATE auction_listings SET status = v_listing.status, seller_claimed = v_listing.seller_claimed, buyer_claimed = v_listing.buyer_claimed, updated_at = NOW() WHERE id = p_listing_id RETURNING * INTO v_listing;
  IF v_message = '' THEN v_message := 'Không có gì để claim.'; END IF;
  RETURN jsonb_build_object('success', true, 'message', v_message, 'spiritStones', v_user.spirit_stones, 'listing', to_jsonb(v_listing));
END;
$$;

-- ── collect_idle_stones ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION collect_idle_stones(p_user_id UUID, p_realm_index INT)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_user users%ROWTYPE;
  v_idle_stones_array INT[] := ARRAY[1, 2, 4, 8, 15];
  v_rate INT; v_last_collected TIMESTAMPTZ; v_elapsed_minutes FLOAT;
  v_capped_minutes FLOAT; v_pending INT; v_new_last_collected TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'status', 404, 'message', 'User không tồn tại'); END IF;
  v_last_collected   := COALESCE(v_user.last_stone_collected_at, v_user.created_at, NOW());
  v_elapsed_minutes  := GREATEST(0, EXTRACT(EPOCH FROM (NOW() - v_last_collected)) / 60);
  v_capped_minutes   := LEAST(v_elapsed_minutes, 1440);
  p_realm_index      := GREATEST(0, LEAST(4, p_realm_index));
  v_rate             := v_idle_stones_array[p_realm_index + 1];
  v_pending          := FLOOR(v_capped_minutes * v_rate);
  IF v_pending <= 0 THEN RETURN jsonb_build_object('success', true, 'pending', 0, 'spiritStones', v_user.spirit_stones, 'message', 'Chưa có Linh Thạch để thu thập.'); END IF;
  v_new_last_collected := CASE WHEN v_elapsed_minutes >= 1440 THEN NOW()
    ELSE v_last_collected + (v_pending::FLOAT / v_rate) * interval '1 minute' END;
  UPDATE users SET spirit_stones = COALESCE(spirit_stones, 0) + v_pending, last_stone_collected_at = v_new_last_collected, updated_at = NOW() WHERE id = p_user_id RETURNING * INTO v_user;
  RETURN jsonb_build_object('success', true, 'pending', v_pending, 'spiritStones', v_user.spirit_stones, 'message', 'Thu thập được ' || v_pending || ' Linh Thạch!');
END;
$$;

-- ── buy_shop_item ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION buy_shop_item(
  p_user_id UUID, p_item_id VARCHAR, p_quantity INT, p_total_cost INT
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_user users%ROWTYPE; v_inventory inventories%ROWTYPE;
  v_items JSONB; v_item JSONB; v_found BOOLEAN := false; v_new_items JSONB := '[]'::JSONB;
BEGIN
  SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'User không tồn tại'); END IF;
  IF COALESCE(v_user.spirit_stones, 0) < p_total_cost THEN RETURN jsonb_build_object('success', false, 'message', 'Không đủ Linh Thạch!'); END IF;
  SELECT * INTO v_inventory FROM inventories WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN INSERT INTO inventories (user_id) VALUES (p_user_id) RETURNING * INTO v_inventory; END IF;
  v_items := v_inventory.items;
  IF v_items IS NULL OR jsonb_typeof(v_items) != 'array' THEN v_items := '[]'::JSONB; END IF;
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    IF v_item->>'itemId' = p_item_id THEN v_item := jsonb_set(v_item, '{quantity}', to_jsonb((v_item->>'quantity')::int + p_quantity)); v_found := true; END IF;
    v_new_items := v_new_items || v_item;
  END LOOP;
  IF NOT v_found THEN
    IF jsonb_array_length(v_items) >= v_inventory.max_slots THEN RETURN jsonb_build_object('success', false, 'message', 'Túi đồ đã đầy!'); END IF;
    v_new_items := v_new_items || jsonb_build_object('itemId', p_item_id, 'quantity', p_quantity);
  END IF;
  UPDATE users SET spirit_stones = COALESCE(spirit_stones, 0) - p_total_cost, updated_at = NOW() WHERE id = p_user_id RETURNING * INTO v_user;
  UPDATE inventories SET items = v_new_items, updated_at = NOW() WHERE id = v_inventory.id;
  RETURN jsonb_build_object('success', true, 'spiritStones', v_user.spirit_stones);
END;
$$;

-- ── sell_shop_item ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sell_shop_item(
  p_user_id UUID, p_item_id VARCHAR, p_quantity INT, p_total_earned INT
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_user users%ROWTYPE; v_inventory inventories%ROWTYPE;
  v_items JSONB; v_item JSONB; v_found BOOLEAN := false; v_new_items JSONB := '[]'::JSONB;
BEGIN
  SELECT * INTO v_inventory FROM inventories WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Không đủ vật phẩm trong túi đồ.'); END IF;
  IF v_inventory.equipment->>'weapon' = p_item_id OR v_inventory.equipment->>'armor' = p_item_id THEN RETURN jsonb_build_object('success', false, 'message', 'Không thể bán vật phẩm đang trang bị.'); END IF;
  v_items := v_inventory.items;
  IF v_items IS NULL OR jsonb_typeof(v_items) != 'array' THEN v_items := '[]'::JSONB; END IF;
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    IF v_item->>'itemId' = p_item_id THEN
      IF (v_item->>'quantity')::int >= p_quantity THEN v_found := true;
        IF (v_item->>'quantity')::int > p_quantity THEN v_item := jsonb_set(v_item, '{quantity}', to_jsonb((v_item->>'quantity')::int - p_quantity)); v_new_items := v_new_items || v_item; END IF;
      ELSE RETURN jsonb_build_object('success', false, 'message', 'Không đủ vật phẩm trong túi đồ.'); END IF;
    ELSE v_new_items := v_new_items || v_item; END IF;
  END LOOP;
  IF NOT v_found THEN RETURN jsonb_build_object('success', false, 'message', 'Không đủ vật phẩm trong túi đồ.'); END IF;
  SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;
  UPDATE inventories SET items = v_new_items, updated_at = NOW() WHERE id = v_inventory.id;
  UPDATE users SET spirit_stones = COALESCE(spirit_stones, 0) + p_total_earned, updated_at = NOW() WHERE id = p_user_id RETURNING * INTO v_user;
  RETURN jsonb_build_object('success', true, 'spiritStones', v_user.spirit_stones);
END;
$$;

-- ── exchange_pavilion_item ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION exchange_pavilion_item(
  p_user_id UUID, p_item_id VARCHAR, p_price INT
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_cult cultivations%ROWTYPE; v_inventory inventories%ROWTYPE;
  v_items JSONB; v_item JSONB; v_found BOOLEAN := false; v_new_items JSONB := '[]'::JSONB;
BEGIN
  SELECT * INTO v_cult FROM cultivations WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR COALESCE(v_cult.sect_contribution, 0) < p_price THEN RETURN jsonb_build_object('success', false, 'message', 'Không đủ Điểm Cống Hiến.'); END IF;
  SELECT * INTO v_inventory FROM inventories WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN INSERT INTO inventories (user_id) VALUES (p_user_id) RETURNING * INTO v_inventory; END IF;
  v_items := v_inventory.items;
  IF v_items IS NULL OR jsonb_typeof(v_items) != 'array' THEN v_items := '[]'::JSONB; END IF;
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    IF v_item->>'itemId' = p_item_id THEN v_item := jsonb_set(v_item, '{quantity}', to_jsonb((v_item->>'quantity')::int + 1)); v_found := true; END IF;
    v_new_items := v_new_items || v_item;
  END LOOP;
  IF NOT v_found THEN
    IF jsonb_array_length(v_items) >= v_inventory.max_slots THEN RETURN jsonb_build_object('success', false, 'message', 'Túi đồ đã đầy!'); END IF;
    v_new_items := v_new_items || jsonb_build_object('itemId', p_item_id, 'quantity', 1);
  END IF;
  UPDATE cultivations SET sect_contribution = COALESCE(sect_contribution, 0) - p_price, updated_at = NOW() WHERE id = v_cult.id RETURNING * INTO v_cult;
  UPDATE inventories SET items = v_new_items, updated_at = NOW() WHERE id = v_inventory.id;
  RETURN jsonb_build_object('success', true, 'remainingContribution', v_cult.sect_contribution);
END;
$$;

-- ── claim_dungeon_rewards_tx ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION claim_dungeon_rewards_tx(
  p_user_id UUID, p_spirit_stones INT, p_item_drops JSONB
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_user users%ROWTYPE; v_inventory inventories%ROWTYPE; v_cult cultivations%ROWTYPE;
  v_items JSONB; v_item JSONB; v_drop JSONB; v_found BOOLEAN; v_new_items JSONB;
BEGIN
  SELECT * INTO v_cult FROM cultivations WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR NOT v_cult.is_exploring THEN RETURN jsonb_build_object('success', false, 'message', 'Bạn không đang thám hiểm bí cảnh nào hoặc đã nhận thưởng rồi.'); END IF;
  UPDATE cultivations SET is_exploring = false, current_dungeon_id = null, explore_started_at = null, updated_at = NOW() WHERE user_id = p_user_id;
  IF p_spirit_stones > 0 THEN
    SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;
    UPDATE users SET spirit_stones = COALESCE(spirit_stones, 0) + p_spirit_stones, updated_at = NOW() WHERE id = p_user_id;
  END IF;
  IF jsonb_array_length(p_item_drops) > 0 THEN
    SELECT * INTO v_inventory FROM inventories WHERE user_id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN INSERT INTO inventories (user_id) VALUES (p_user_id) RETURNING * INTO v_inventory; END IF;
    v_items := v_inventory.items;
    IF v_items IS NULL OR jsonb_typeof(v_items) != 'array' THEN v_items := '[]'::JSONB; END IF;
    FOR v_drop IN SELECT * FROM jsonb_array_elements(p_item_drops) LOOP
      v_found := false; v_new_items := '[]'::JSONB;
      FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
        IF v_item->>'itemId' = v_drop->>'itemId' THEN v_item := jsonb_set(v_item, '{quantity}', to_jsonb((v_item->>'quantity')::int + (v_drop->>'quantity')::int)); v_found := true; END IF;
        v_new_items := v_new_items || v_item;
      END LOOP;
      IF NOT v_found THEN
        IF jsonb_array_length(v_new_items) < v_inventory.max_slots THEN v_new_items := v_new_items || jsonb_build_object('itemId', v_drop->>'itemId', 'quantity', (v_drop->>'quantity')::int); END IF;
      END IF;
      v_items := v_new_items;
    END LOOP;
    UPDATE inventories SET items = v_items, updated_at = NOW() WHERE id = v_inventory.id;
  END IF;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- ── commit_breakthrough ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION commit_breakthrough(
  p_user_id UUID, p_items_used JSONB, p_expected_realm_index INT,
  p_new_realm_index INT, p_new_exp FLOAT, p_new_lifespan INT,
  p_failed_breakthroughs INT, p_heart_demon_duration_ms BIGINT
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_cult cultivations%ROWTYPE; v_inventory inventories%ROWTYPE;
  v_items JSONB; v_item JSONB; v_new_items JSONB := '[]'::JSONB;
  v_item_id VARCHAR; v_qty INT;
  v_active_buffs JSONB; v_buff JSONB; v_new_buffs JSONB := '[]'::JSONB;
  v_demon_found BOOLEAN := false;
BEGIN
  SELECT * INTO v_cult FROM cultivations WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_cult.realm_index != p_expected_realm_index THEN RETURN jsonb_build_object('success', false, 'message', 'Dữ liệu tu vi không đồng bộ.'); END IF;
  SELECT * INTO v_inventory FROM inventories WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN INSERT INTO inventories (user_id) VALUES (p_user_id) RETURNING * INTO v_inventory; END IF;
  v_items := v_inventory.items;
  IF v_items IS NULL OR jsonb_typeof(v_items) != 'array' THEN v_items := '[]'::JSONB; END IF;
  FOR v_item_id, v_qty IN SELECT key, value::int FROM jsonb_each_text(p_items_used) LOOP
    IF v_inventory.equipment->>'weapon' = v_item_id OR v_inventory.equipment->>'armor' = v_item_id THEN RETURN jsonb_build_object('success', false, 'message', 'Không thể sử dụng vật phẩm đang trang bị để đột phá.'); END IF;
    DECLARE v_found_item BOOLEAN := false; BEGIN
      v_new_items := '[]'::JSONB;
      FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
        IF v_item->>'itemId' = v_item_id THEN
          IF (v_item->>'quantity')::int >= v_qty THEN
            v_found_item := true;
            IF (v_item->>'quantity')::int > v_qty THEN v_item := jsonb_set(v_item, '{quantity}', to_jsonb((v_item->>'quantity')::int - v_qty)); v_new_items := v_new_items || v_item; END IF;
          ELSE RETURN jsonb_build_object('success', false, 'message', 'Không đủ vật phẩm ' || v_item_id); END IF;
        ELSE v_new_items := v_new_items || v_item; END IF;
      END LOOP;
      IF NOT v_found_item THEN RETURN jsonb_build_object('success', false, 'message', 'Không tìm thấy vật phẩm ' || v_item_id); END IF;
      v_items := v_new_items;
    END;
  END LOOP;
  v_active_buffs := v_inventory.active_buffs;
  IF v_active_buffs IS NULL OR jsonb_typeof(v_active_buffs) != 'array' THEN v_active_buffs := '[]'::JSONB; END IF;
  IF p_heart_demon_duration_ms > 0 THEN
    FOR v_buff IN SELECT * FROM jsonb_array_elements(v_active_buffs) LOOP
      IF v_buff->>'buffType' = 'SPEED_HEART_DEMON' THEN
        v_buff := jsonb_set(v_buff, '{expiresAt}', to_jsonb(TO_CHAR(TO_TIMESTAMP((GREATEST(EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM (v_buff->>'expiresAt')::TIMESTAMPTZ) * 1000) + p_heart_demon_duration_ms) / 1000.0) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
        v_demon_found := true;
      END IF;
      v_new_buffs := v_new_buffs || v_buff;
    END LOOP;
    IF NOT v_demon_found THEN v_new_buffs := v_new_buffs || jsonb_build_object('buffType', 'SPEED_HEART_DEMON', 'multiplier', 0.5, 'expiresAt', TO_CHAR((NOW() + (p_heart_demon_duration_ms || ' milliseconds')::interval) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')); END IF;
  ELSE v_new_buffs := v_active_buffs; END IF;
  UPDATE cultivations SET realm_index = p_new_realm_index, exp_accumulated = p_new_exp, lifespan = p_new_lifespan, failed_breakthroughs = p_failed_breakthroughs, breakthrough_ready_at = NULL, last_stopped_at = NOW(), updated_at = NOW() WHERE id = v_cult.id;
  UPDATE inventories SET items = v_items, active_buffs = v_new_buffs, updated_at = NOW() WHERE id = v_inventory.id;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- ── commit_use_item ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION commit_use_item(
  p_user_id UUID, p_item_id VARCHAR, p_quantity INT,
  p_new_exp FLOAT, p_new_lifespan INT, p_breakthrough_ready_at TIMESTAMPTZ,
  p_heart_demon_duration_ms BIGINT, p_speed_buff JSONB, p_daily_pills_consumed JSONB
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_cult cultivations%ROWTYPE; v_inventory inventories%ROWTYPE;
  v_items JSONB; v_item JSONB; v_new_items JSONB := '[]'::JSONB;
  v_active_buffs JSONB; v_buff JSONB; v_new_buffs JSONB := '[]'::JSONB;
  v_demon_found BOOLEAN := false; v_speed_found BOOLEAN := false; v_found BOOLEAN := false;
BEGIN
  SELECT * INTO v_cult FROM cultivations WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Không tìm thấy dữ liệu tu vi.'); END IF;
  SELECT * INTO v_inventory FROM inventories WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Không tìm thấy túi đồ.'); END IF;
  v_items := v_inventory.items;
  IF v_items IS NULL OR jsonb_typeof(v_items) != 'array' THEN v_items := '[]'::JSONB; END IF;
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    IF v_item->>'itemId' = p_item_id THEN
      IF (v_item->>'quantity')::int >= p_quantity THEN v_found := true;
        IF (v_item->>'quantity')::int > p_quantity THEN v_item := jsonb_set(v_item, '{quantity}', to_jsonb((v_item->>'quantity')::int - p_quantity)); v_new_items := v_new_items || v_item; END IF;
      ELSE RETURN jsonb_build_object('success', false, 'message', 'Không đủ vật phẩm.'); END IF;
    ELSE v_new_items := v_new_items || v_item; END IF;
  END LOOP;
  IF NOT v_found THEN RETURN jsonb_build_object('success', false, 'message', 'Không tìm thấy vật phẩm.'); END IF;
  v_items := v_new_items;
  v_active_buffs := v_inventory.active_buffs;
  IF v_active_buffs IS NULL OR jsonb_typeof(v_active_buffs) != 'array' THEN v_active_buffs := '[]'::JSONB; END IF;
  IF p_heart_demon_duration_ms > 0 THEN
    v_new_buffs := '[]'::JSONB;
    FOR v_buff IN SELECT * FROM jsonb_array_elements(v_active_buffs) LOOP
      IF v_buff->>'buffType' = 'SPEED_HEART_DEMON' THEN v_buff := jsonb_set(v_buff, '{expiresAt}', to_jsonb(TO_CHAR(TO_TIMESTAMP((GREATEST(EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM (v_buff->>'expiresAt')::TIMESTAMPTZ) * 1000) + p_heart_demon_duration_ms) / 1000.0) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))); v_demon_found := true; END IF;
      v_new_buffs := v_new_buffs || v_buff;
    END LOOP;
    IF NOT v_demon_found THEN v_new_buffs := v_new_buffs || jsonb_build_object('buffType', 'SPEED_HEART_DEMON', 'multiplier', 0.5, 'expiresAt', TO_CHAR((NOW() + (p_heart_demon_duration_ms || ' milliseconds')::interval) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')); END IF;
    v_active_buffs := v_new_buffs;
  END IF;
  IF p_speed_buff IS NOT NULL THEN
    v_new_buffs := '[]'::JSONB; v_speed_found := false;
    FOR v_buff IN SELECT * FROM jsonb_array_elements(v_active_buffs) LOOP
      IF v_buff->>'buffType' = p_speed_buff->>'buffType' THEN v_buff := jsonb_set(v_buff, '{expiresAt}', to_jsonb(TO_CHAR(TO_TIMESTAMP((GREATEST(EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM (v_buff->>'expiresAt')::TIMESTAMPTZ) * 1000) + (p_speed_buff->>'durationHours')::FLOAT * 3600 * 1000) / 1000.0) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))); v_speed_found := true; END IF;
      v_new_buffs := v_new_buffs || v_buff;
    END LOOP;
    IF NOT v_speed_found THEN v_new_buffs := v_new_buffs || jsonb_build_object('buffType', p_speed_buff->>'buffType', 'multiplier', p_speed_buff->>'multiplier', 'expiresAt', TO_CHAR((NOW() + ((p_speed_buff->>'durationHours')::FLOAT || ' hours')::interval) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')); END IF;
    v_active_buffs := v_new_buffs;
  END IF;
  UPDATE cultivations SET exp_accumulated = p_new_exp, lifespan = p_new_lifespan, breakthrough_ready_at = p_breakthrough_ready_at, daily_pills_consumed = p_daily_pills_consumed, updated_at = NOW() WHERE id = v_cult.id;
  UPDATE inventories SET items = v_items, active_buffs = v_active_buffs, updated_at = NOW() WHERE id = v_inventory.id;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- ── complete_sect_mission_tx ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION complete_sect_mission_tx(p_user_id UUID, p_mission_id VARCHAR)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_cult cultivations%ROWTYPE; v_missions JSONB; v_mission JSONB;
  v_new_missions JSONB := '[]'::JSONB; v_found BOOLEAN := false; v_reward INT := 0;
BEGIN
  SELECT * INTO v_cult FROM cultivations WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Không tìm thấy dữ liệu tu vi.'); END IF;
  v_missions := v_cult.sect_missions;
  IF v_missions IS NULL OR jsonb_typeof(v_missions) != 'array' THEN RETURN jsonb_build_object('success', false, 'message', 'Không có nhiệm vụ.'); END IF;
  FOR v_mission IN SELECT * FROM jsonb_array_elements(v_missions) LOOP
    IF v_mission->>'id' = p_mission_id THEN
      IF v_mission->>'status' != 'active' THEN RETURN jsonb_build_object('success', false, 'message', 'Nhiệm vụ không ở trạng thái đang thực hiện.'); END IF;
      v_reward := (v_mission->>'reward')::int;
      v_mission := jsonb_set(v_mission, '{status}', '"completed"');
      v_found := true;
    END IF;
    v_new_missions := v_new_missions || v_mission;
  END LOOP;
  IF NOT v_found THEN RETURN jsonb_build_object('success', false, 'message', 'Không tìm thấy nhiệm vụ.'); END IF;
  UPDATE cultivations SET sect_missions = v_new_missions, sect_contribution = COALESCE(sect_contribution, 0) + v_reward, updated_at = NOW() WHERE id = v_cult.id;
  RETURN jsonb_build_object('success', true, 'message', 'Hoàn thành nhiệm vụ, nhận ' || v_reward || ' Điểm Cống Hiến.');
END;
$$;

-- ── learn_technique_tx ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION learn_technique_tx(
  p_user_id UUID, p_item_id VARCHAR, p_speed_bonus FLOAT
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_inventory inventories%ROWTYPE; v_items JSONB; v_item JSONB;
  v_new_items JSONB := '[]'::JSONB; v_found BOOLEAN := false;
BEGIN
  SELECT * INTO v_inventory FROM inventories WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Không tìm thấy túi đồ.'); END IF;
  v_items := v_inventory.items;
  IF v_items IS NULL OR jsonb_typeof(v_items) != 'array' THEN RETURN jsonb_build_object('success', false, 'message', 'Không có vật phẩm.'); END IF;
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    IF v_item->>'itemId' = p_item_id THEN
      IF (v_item->>'quantity')::int >= 1 THEN v_found := true;
        IF (v_item->>'quantity')::int > 1 THEN v_item := jsonb_set(v_item, '{quantity}', to_jsonb((v_item->>'quantity')::int - 1)); v_new_items := v_new_items || v_item; END IF;
      ELSE RETURN jsonb_build_object('success', false, 'message', 'Không đủ vật phẩm.'); END IF;
    ELSE v_new_items := v_new_items || v_item; END IF;
  END LOOP;
  IF NOT v_found THEN RETURN jsonb_build_object('success', false, 'message', 'Không tìm thấy công pháp trong túi đồ.'); END IF;
  UPDATE inventories SET items = v_new_items, technique_passive_bonus = COALESCE(technique_passive_bonus, 0) + p_speed_bonus, updated_at = NOW() WHERE id = v_inventory.id;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- ════════════════════════════════════════════════════════════════════════════════
-- PHẦN 6: RPC FUNCTIONS — PHASE 2
-- ════════════════════════════════════════════════════════════════════════════════

-- ── adjust_spirit_stones ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION adjust_spirit_stones(p_user_id UUID, p_delta INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users SET spirit_stones = GREATEST(0, COALESCE(spirit_stones, 0) + p_delta) WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── adjust_jade_coins ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION adjust_jade_coins(p_user_id UUID, p_delta INTEGER)
RETURNS JSONB AS $$
DECLARE v_current INTEGER; v_new INTEGER;
BEGIN
  SELECT COALESCE(jade_coins, 0) INTO v_current FROM users WHERE id = p_user_id FOR UPDATE;
  v_new := v_current + p_delta;
  IF v_new < 0 THEN RETURN jsonb_build_object('success', false, 'current_balance', v_current); END IF;
  UPDATE users SET jade_coins = v_new WHERE id = p_user_id;
  RETURN jsonb_build_object('success', true, 'new_balance', v_new);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── sum_spirit_stones ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sum_spirit_stones()
RETURNS BIGINT AS $$
  SELECT COALESCE(SUM(spirit_stones), 0) FROM users;
$$ LANGUAGE sql SECURITY DEFINER;

-- ── send_broadcast_mail ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION send_broadcast_mail(
  p_sender_name TEXT, p_subject TEXT, p_body TEXT, p_attachment JSONB
) RETURNS VOID AS $$
BEGIN
  INSERT INTO mail_inbox (recipient_id, sender_name, subject, body, attachment)
  SELECT id, p_sender_name, p_subject, p_body, p_attachment FROM users WHERE is_banned = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── commit_pvp_result ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION commit_pvp_result(
  p_challenger_id UUID, p_defender_id UUID,
  p_challenger_won BOOLEAN,
  p_challenger_rating INTEGER, p_defender_rating INTEGER,
  p_challenger_rating_change INTEGER, p_defender_rating_change INTEGER,
  p_challenger_record JSONB, p_defender_record JSONB
) RETURNS VOID AS $$
BEGIN
  INSERT INTO pvp_records (user_id, rating, wins, losses, history)
  VALUES (p_challenger_id, p_challenger_rating, CASE WHEN p_challenger_won THEN 1 ELSE 0 END, CASE WHEN p_challenger_won THEN 0 ELSE 1 END, jsonb_build_array(p_challenger_record))
  ON CONFLICT (user_id) DO UPDATE SET
    rating = p_challenger_rating,
    wins   = pvp_records.wins   + CASE WHEN p_challenger_won THEN 1 ELSE 0 END,
    losses = pvp_records.losses + CASE WHEN p_challenger_won THEN 0 ELSE 1 END,
    history = pvp_records.history || p_challenger_record, updated_at = now();

  INSERT INTO pvp_records (user_id, rating, wins, losses, history)
  VALUES (p_defender_id, p_defender_rating, CASE WHEN p_challenger_won THEN 0 ELSE 1 END, CASE WHEN p_challenger_won THEN 1 ELSE 0 END, jsonb_build_array(p_defender_record))
  ON CONFLICT (user_id) DO UPDATE SET
    rating = p_defender_rating,
    wins   = pvp_records.wins   + CASE WHEN p_challenger_won THEN 0 ELSE 1 END,
    losses = pvp_records.losses + CASE WHEN p_challenger_won THEN 1 ELSE 0 END,
    history = pvp_records.history || p_defender_record, updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── attack_linh_mach ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION attack_linh_mach(
  p_war_id UUID, p_linh_mach_id TEXT, p_sect_name TEXT,
  p_attacker TEXT, p_attack_power INTEGER, p_max_hp INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_war sect_wars%ROWTYPE; v_states JSONB; v_state JSONB;
  v_current_hp INTEGER; v_controlled TEXT; v_captured BOOLEAN := false;
  v_scores JSONB; v_new_score INTEGER; v_log_entry JSONB;
BEGIN
  SELECT * INTO v_war FROM sect_wars WHERE id = p_war_id FOR UPDATE;
  v_states     := v_war.linh_mach_states;
  v_state      := COALESCE(v_states->p_linh_mach_id, '{}');
  v_current_hp := COALESCE((v_state->>'currentHp')::INTEGER, p_max_hp);
  v_controlled := v_state->>'controlledBy';
  v_current_hp := GREATEST(0, v_current_hp - p_attack_power);
  IF v_current_hp = 0 THEN v_controlled := p_sect_name; v_current_hp := p_max_hp; v_captured := true; END IF;
  v_log_entry := jsonb_build_object('at', now(), 'attacker', p_attacker, 'sect', p_sect_name, 'damage', p_attack_power, 'captured', v_captured);
  v_state := jsonb_build_object('currentHp', v_current_hp, 'controlledBy', v_controlled, 'attackLog', COALESCE(v_state->'attackLog', '[]'::jsonb) || v_log_entry);
  v_states := jsonb_set(v_states, ARRAY[p_linh_mach_id], v_state);
  v_scores := COALESCE(v_war.sect_scores, '{}');
  v_new_score := COALESCE((v_scores->>p_sect_name)::INTEGER, 0) + p_attack_power;
  v_scores := jsonb_set(v_scores, ARRAY[p_sect_name], to_jsonb(v_new_score));
  UPDATE sect_wars SET linh_mach_states = v_states, sect_scores = v_scores, attack_log = attack_log || v_log_entry WHERE id = p_war_id;
  RETURN jsonb_build_object('damage', p_attack_power, 'captured', v_captured, 'linh_mach_state', v_state);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── settle_sect_war ───────────────────────────────────────────────────────────
-- Kết thúc Tông Môn Chiến: tính người thắng và phát thưởng Linh Thạch
CREATE OR REPLACE FUNCTION settle_sect_war(p_war_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_war sect_wars%ROWTYPE; v_lm_id TEXT; v_lm_state JSONB;
  v_winner_sect TEXT; v_winner_count INTEGER := 0;
  v_sect_control JSONB := '{}'; v_count INTEGER;
  v_reward_per_lm INTEGER := 10000;
BEGIN
  SELECT * INTO v_war FROM sect_wars WHERE id = p_war_id FOR UPDATE;
  IF NOT FOUND OR v_war.settled THEN RETURN jsonb_build_object('success', false, 'message', 'War không tồn tại hoặc đã kết thúc'); END IF;
  FOR v_lm_id, v_lm_state IN SELECT * FROM jsonb_each(v_war.linh_mach_states) LOOP
    IF v_lm_state->>'controlledBy' IS NOT NULL THEN
      v_sect_control := jsonb_set(v_sect_control, ARRAY[v_lm_state->>'controlledBy'],
        to_jsonb(COALESCE((v_sect_control->>(v_lm_state->>'controlledBy'))::INTEGER, 0) + 1));
    END IF;
  END LOOP;
  FOR v_winner_sect, v_count IN SELECT key, value::INTEGER FROM jsonb_each(v_sect_control) ORDER BY value::INTEGER DESC LIMIT 1 LOOP
    v_winner_count := v_count;
  END LOOP;
  IF v_winner_sect IS NOT NULL AND v_winner_count > 0 THEN
    UPDATE users SET spirit_stones = spirit_stones + (v_winner_count * v_reward_per_lm)
    WHERE id IN (SELECT user_id FROM cultivations WHERE sect_name = v_winner_sect);
  END IF;
  UPDATE sect_wars SET settled = true WHERE id = p_war_id;
  RETURN jsonb_build_object('success', true, 'winnerSect', v_winner_sect, 'linhMachWon', v_winner_count, 'rewardPerMember', (v_winner_count * v_reward_per_lm));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════════════════════════════════════════════════════════════════════════════
-- HOÀN THÀNH! Full schema đã được tạo.
-- Verify bằng cách chạy:
--   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
--   SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' ORDER BY routine_name;
-- ════════════════════════════════════════════════════════════════════════════════

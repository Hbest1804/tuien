-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Giai Đoạn 2 — Phase 2 Features
-- Chạy script này trong Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Cultivations — Thêm cột Phase 2 ──────────────────────────
ALTER TABLE cultivations
  ADD COLUMN IF NOT EXISTS current_floor     INTEGER,
  ADD COLUMN IF NOT EXISTS floor_events      JSONB    DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS master_id         UUID     REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS disciples         JSONB    DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS partner_id        UUID     REFERENCES users(id);

-- ── 2. Users — Thêm cột VIP + Tiên Ngọc ────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS jade_coins        INTEGER  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vip_level         INTEGER  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vip_expiry_at     TIMESTAMPTZ;

-- ── 3. Bảng pvp_records ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pvp_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL DEFAULT 1200,
  wins        INTEGER NOT NULL DEFAULT 0,
  losses      INTEGER NOT NULL DEFAULT 0,
  history     JSONB   NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_pvp_records_user_id ON pvp_records(user_id);
CREATE INDEX IF NOT EXISTS idx_pvp_records_rating  ON pvp_records(rating DESC);

-- ── 4. Bảng sect_wars ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sect_wars (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  declared_by       TEXT NOT NULL,
  linh_mach_states  JSONB NOT NULL DEFAULT '{}'::jsonb,
  sect_scores       JSONB NOT NULL DEFAULT '{}'::jsonb,
  attack_log        JSONB NOT NULL DEFAULT '[]'::jsonb,
  settled           BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sect_wars_created_at ON sect_wars(created_at DESC);

-- ── 5. Bảng sects (kiến trúc tông môn) ───────────────────────────
CREATE TABLE IF NOT EXISTS sects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  buildings   JSONB NOT NULL DEFAULT '{}'::jsonb,
  resources   JSONB NOT NULL DEFAULT '{"linh_thach": 0}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sects_name ON sects(name);

-- ── 6. Inventories — Thêm cột enchants ───────────────────────────
ALTER TABLE inventories
  ADD COLUMN IF NOT EXISTS enchants JSONB DEFAULT '{}'::jsonb;

-- ── 7. Row Level Security (RLS) ──────────────────────────────────
ALTER TABLE pvp_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sect_wars   ENABLE ROW LEVEL SECURITY;
ALTER TABLE sects       ENABLE ROW LEVEL SECURITY;

-- pvp_records: chỉ server (service_role) có thể write — anon chỉ được đọc
-- (service_role bypass RLS hoàn toàn, không cần INSERT/UPDATE policy)
CREATE POLICY IF NOT EXISTS "pvp_records_select" ON pvp_records FOR SELECT USING (true);

-- sect_wars: public read only — server write qua service_role
CREATE POLICY IF NOT EXISTS "sect_wars_select" ON sect_wars FOR SELECT USING (true);

-- sects: public read only — server write qua service_role
CREATE POLICY IF NOT EXISTS "sects_select" ON sects FOR SELECT USING (true);

-- ── 8. Function: adjust_spirit_stones (nếu chưa có) ─────────────
CREATE OR REPLACE FUNCTION adjust_spirit_stones(p_user_id UUID, p_delta INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET spirit_stones = GREATEST(0, spirit_stones + p_delta)
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 9. Admin columns & tables ─────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role      VARCHAR(10)  NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'admin')),
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_muted  BOOLEAN      NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID         NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  admin_name   VARCHAR(50)  NOT NULL,
  action       VARCHAR(100) NOT NULL,
  target_id    UUID         DEFAULT NULL,
  target_name  VARCHAR(100) DEFAULT NULL,
  details      JSONB        NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin   ON admin_audit_logs (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target  ON admin_audit_logs (target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS mail_inbox (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id  UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_name   VARCHAR(50)  NOT NULL DEFAULT 'Hệ Thống',
  subject       VARCHAR(200) NOT NULL,
  body          TEXT         NOT NULL,
  attachment    JSONB        DEFAULT NULL,
  is_read       BOOLEAN      NOT NULL DEFAULT FALSE,
  is_claimed    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mail_recipient ON mail_inbox (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mail_unread    ON mail_inbox (recipient_id, is_read) WHERE is_read = FALSE;

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

-- ── 10. RPC Functions ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sum_spirit_stones()
RETURNS BIGINT AS $$
  SELECT COALESCE(SUM(spirit_stones), 0) FROM users;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION send_broadcast_mail(
  p_sender_name TEXT,
  p_subject     TEXT,
  p_body        TEXT,
  p_attachment  JSONB
) RETURNS VOID AS $$
BEGIN
  INSERT INTO mail_inbox (recipient_id, sender_name, subject, body, attachment)
  SELECT id, p_sender_name, p_subject, p_body, p_attachment FROM users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION commit_pvp_result(
  p_challenger_id          UUID,
  p_defender_id            UUID,
  p_challenger_won         BOOLEAN,
  p_challenger_rating      INTEGER,
  p_defender_rating        INTEGER,
  p_challenger_rating_change INTEGER,
  p_defender_rating_change   INTEGER,
  p_challenger_record      JSONB,
  p_defender_record        JSONB
) RETURNS VOID AS $$
BEGIN
  -- Challenger
  INSERT INTO pvp_records (user_id, rating, wins, losses, history)
  VALUES (
    p_challenger_id,
    p_challenger_rating,
    CASE WHEN p_challenger_won THEN 1 ELSE 0 END,
    CASE WHEN p_challenger_won THEN 0 ELSE 1 END,
    jsonb_build_array(p_challenger_record)
  )
  ON CONFLICT (user_id) DO UPDATE
    SET rating     = p_challenger_rating,
        wins       = pvp_records.wins   + CASE WHEN p_challenger_won THEN 1 ELSE 0 END,
        losses     = pvp_records.losses + CASE WHEN p_challenger_won THEN 0 ELSE 1 END,
        history    = pvp_records.history || p_challenger_record,
        updated_at = now();

  -- Defender
  INSERT INTO pvp_records (user_id, rating, wins, losses, history)
  VALUES (
    p_defender_id,
    p_defender_rating,
    CASE WHEN p_challenger_won THEN 0 ELSE 1 END,
    CASE WHEN p_challenger_won THEN 1 ELSE 0 END,
    jsonb_build_array(p_defender_record)
  )
  ON CONFLICT (user_id) DO UPDATE
    SET rating     = p_defender_rating,
        wins       = pvp_records.wins   + CASE WHEN p_challenger_won THEN 0 ELSE 1 END,
        losses     = pvp_records.losses + CASE WHEN p_challenger_won THEN 1 ELSE 0 END,
        history    = pvp_records.history || p_defender_record,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION adjust_jade_coins(p_user_id UUID, p_delta INTEGER)
RETURNS JSONB AS $$
DECLARE
  v_current INTEGER;
  v_new     INTEGER;
BEGIN
  SELECT jade_coins INTO v_current FROM users WHERE id = p_user_id FOR UPDATE;
  v_current := COALESCE(v_current, 0);
  v_new     := v_current + p_delta;

  IF v_new < 0 THEN
    RETURN jsonb_build_object('success', false, 'current_balance', v_current);
  END IF;

  UPDATE users SET jade_coins = v_new WHERE id = p_user_id;
  RETURN jsonb_build_object('success', true, 'new_balance', v_new);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION attack_linh_mach(
  p_war_id       UUID,
  p_linh_mach_id TEXT,
  p_sect_name    TEXT,
  p_attacker     TEXT,
  p_attack_power INTEGER,
  p_max_hp       INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_war          sect_wars%ROWTYPE;
  v_states       JSONB;
  v_state        JSONB;
  v_current_hp   INTEGER;
  v_controlled   TEXT;
  v_captured     BOOLEAN := false;
  v_scores       JSONB;
  v_new_score    INTEGER;
  v_log_entry    JSONB;
BEGIN
  -- Lock the row to serialize concurrent attacks
  SELECT * INTO v_war FROM sect_wars WHERE id = p_war_id FOR UPDATE;

  v_states      := v_war.linh_mach_states;
  v_state       := COALESCE(v_states->p_linh_mach_id, '{}');
  v_current_hp  := COALESCE((v_state->>'currentHp')::INTEGER, p_max_hp);
  v_controlled  := v_state->>'controlledBy';

  -- Apply damage
  v_current_hp := GREATEST(0, v_current_hp - p_attack_power);

  -- Capture check
  IF v_current_hp = 0 THEN
    v_controlled := p_sect_name;
    v_current_hp := p_max_hp;
    v_captured   := true;
  END IF;

  v_log_entry := jsonb_build_object(
    'at',      now(),
    'attacker', p_attacker,
    'sect',     p_sect_name,
    'damage',   p_attack_power,
    'captured', v_captured
  );

  v_state := jsonb_build_object(
    'currentHp',   v_current_hp,
    'controlledBy', v_controlled,
    'attackLog',    COALESCE(v_state->'attackLog', '[]'::jsonb) || v_log_entry
  );

  v_states := jsonb_set(v_states, ARRAY[p_linh_mach_id], v_state);

  -- Update scores
  v_scores    := COALESCE(v_war.sect_scores, '{}');
  v_new_score := COALESCE((v_scores->>p_sect_name)::INTEGER, 0) + p_attack_power;
  v_scores    := jsonb_set(v_scores, ARRAY[p_sect_name], to_jsonb(v_new_score));

  UPDATE sect_wars
     SET linh_mach_states = v_states,
         sect_scores      = v_scores,
         attack_log       = attack_log || v_log_entry
   WHERE id = p_war_id;

  RETURN jsonb_build_object(
    'damage',          p_attack_power,
    'captured',        v_captured,
    'linh_mach_state', v_state
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- HOÀN THÀNH! Migration Phase 2 đã được áp dụng.
-- ═══════════════════════════════════════════════════════════════

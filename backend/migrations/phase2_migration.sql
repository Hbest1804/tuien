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

-- pvp_records: chỉ server (service_role) có thể write, user đọc record của mình
CREATE POLICY IF NOT EXISTS "pvp_records_select" ON pvp_records FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "pvp_records_insert" ON pvp_records FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "pvp_records_update" ON pvp_records FOR UPDATE USING (true);

-- sect_wars: public read, server write
CREATE POLICY IF NOT EXISTS "sect_wars_select" ON sect_wars FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "sect_wars_insert" ON sect_wars FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "sect_wars_update" ON sect_wars FOR UPDATE USING (true);

-- sects: public read, server write
CREATE POLICY IF NOT EXISTS "sects_select" ON sects FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "sects_insert" ON sects FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "sects_update" ON sects FOR UPDATE USING (true);

-- ── 8. Function: adjust_spirit_stones (nếu chưa có) ─────────────
CREATE OR REPLACE FUNCTION adjust_spirit_stones(p_user_id UUID, p_delta INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET spirit_stones = GREATEST(0, spirit_stones + p_delta)
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- HOÀN THÀNH! Migration Phase 2 đã được áp dụng.
-- ═══════════════════════════════════════════════════════════════

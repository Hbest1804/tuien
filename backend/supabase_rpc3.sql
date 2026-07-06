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

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

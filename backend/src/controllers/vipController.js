import supabase from '../config/supabase.js';
import { logTransaction } from '../models/TransactionLog.js';

// ─── VIP Packages ─────────────────────────────────────────────────────────────
export const VIP_PACKAGES = {
  vip1: { id: 'vip1', name: 'VIP 1 — Tu Sĩ', price: 99000, jadeCoins: 1000, durationDays: 30, benefits: ['+20% EXP', 'Màu tên đặc biệt', '5 slot thêm trong túi đồ'] },
  vip2: { id: 'vip2', name: 'VIP 2 — Chân Nhân', price: 299000, jadeCoins: 3500, durationDays: 30, benefits: ['+50% EXP', 'Màu tên vàng', '10 slot thêm', 'Ưu tiên đấu giá'] },
  vip3: { id: 'vip3', name: 'VIP 3 — Đại Năng', price: 699000, jadeCoins: 9000, durationDays: 30, benefits: ['+100% EXP', 'Màu tên tím', '20 slot thêm', 'Ưu tiên mọi tính năng', 'Huy hiệu Đại Năng'] },
};

// ─── Jade Shop Items ──────────────────────────────────────────────────────────
export const JADE_ITEMS = {
  'jade_tay_tuy_dan': { id: 'jade_tay_tuy_dan', name: 'Tẩy Tủy Đan x3', itemId: 'pill_tay_tuy_dan', quantity: 3, jadeCost: 200, description: 'x2 tốc độ tu luyện 2 giờ.' },
  'jade_linh_khi_dan': { id: 'jade_linh_khi_dan', name: 'Linh Khí Đan x1', itemId: 'pill_linh_khi_dan', quantity: 1, jadeCost: 300, description: 'x3 tốc độ tu luyện 1 giờ.' },
  'jade_thien_dieu_dan': { id: 'jade_thien_dieu_dan', name: 'Thiên Diệu Đan x1', itemId: 'pill_thien_dieu_dan', quantity: 1, jadeCost: 500, description: '+30% tỷ lệ đột phá.' },
  'jade_tho_nguyen_qua': { id: 'jade_tho_nguyen_qua', name: 'Thọ Nguyên Quả x1', itemId: 'pill_tho_nguyen_qua', quantity: 1, jadeCost: 400, description: '+50 năm thọ nguyên.' },
  'jade_spirit_stones_1k': { id: 'jade_spirit_stones_1k', name: '10,000 Linh Thạch', itemId: null, spiritStones: 10000, jadeCost: 150, description: 'Đổi Tiên Ngọc lấy Linh Thạch.' },
  'jade_spirit_stones_5k': { id: 'jade_spirit_stones_5k', name: '60,000 Linh Thạch', itemId: null, spiritStones: 60000, jadeCost: 800, description: 'Gói lớn — giá trị cao.' },
  'jade_weapon_tuyet_han': { id: 'jade_weapon_tuyet_han', name: 'Tuyết Hàn Kiếm', itemId: 'weapon_tuyet_han_kiem', quantity: 1, jadeCost: 2000, description: 'Pháp bảo công kích đỉnh cao.' },
};

// ─── GET /api/vip/packages ────────────────────────────────────────────────────
export const getVipPackages = async (req, res) => {
  try {
    const { data: userRow } = await supabase
      .from('users')
      .select('jade_coins, vip_level, vip_expiry_at')
      .eq('id', req.user.id)
      .maybeSingle();

    res.json({
      packages: Object.values(VIP_PACKAGES),
      jadeItems: Object.values(JADE_ITEMS),
      jadeCoins: userRow?.jade_coins || 0,
      vipLevel: userRow?.vip_level || 0,
      vipExpiry: userRow?.vip_expiry_at || null,
    });
  } catch (err) {
    console.error('getVipPackages error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /api/vip/purchase (Admin grants or mock) ────────────────────────────
export const purchaseJade = async (req, res) => {
  try {
    const { packageId } = req.body;
    const pkg = VIP_PACKAGES[packageId];
    if (!pkg) return res.status(400).json({ message: 'Gói không tồn tại.' });

    // MOCK: In production, this would verify payment
    // For now, admin confirms via the admin panel
    const { data: userRow } = await supabase
      .from('users')
      .select('jade_coins, vip_level, vip_expiry_at')
      .eq('id', req.user.id)
      .maybeSingle();

    const currentJade = userRow?.jade_coins || 0;
    const newJade = currentJade + pkg.jadeCoins;

    // Set VIP
    const currentExpiry = userRow?.vip_expiry_at ? new Date(userRow.vip_expiry_at) : new Date();
    const isExpired = currentExpiry < new Date();
    const baseDate = isExpired ? new Date() : currentExpiry;
    const newExpiry = new Date(baseDate.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000);

    const newVipLevel = Math.max(userRow?.vip_level || 0, parseInt(packageId.replace('vip', '')));

    const { error } = await supabase
      .from('users')
      .update({ jade_coins: newJade, vip_level: newVipLevel, vip_expiry_at: newExpiry.toISOString() })
      .eq('id', req.user.id);

    if (error) throw error;

    await logTransaction(req.user.id, {
      type: 'jade_purchase',
      detail: { packageId, jadeGained: pkg.jadeCoins, vipLevel: newVipLevel },
    });

    res.json({
      message: `💎 Mua gói ${pkg.name} thành công! Nhận ${pkg.jadeCoins} Tiên Ngọc. VIP ${newVipLevel} đến ${newExpiry.toLocaleDateString('vi-VN')}.`,
      newJadeCoins: newJade,
      vipLevel: newVipLevel,
      vipExpiry: newExpiry,
    });
  } catch (err) {
    console.error('purchaseJade error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /api/vip/spend ──────────────────────────────────────────────────────
export const spendJade = async (req, res) => {
  try {
    const { jadeItemId } = req.body;
    const jadeItem = JADE_ITEMS[jadeItemId];
    if (!jadeItem) return res.status(400).json({ message: 'Vật phẩm Tiên Ngọc không tồn tại.' });

    // Deduct jade atomically to prevent double-spending race conditions
    const { data: deductResult, error: deductError } = await supabase.rpc('adjust_jade_coins', {
      p_user_id: req.user.id,
      p_delta: -jadeItem.jadeCost,
    });
    if (deductError) throw deductError;
    if (!deductResult?.success) {
      return res.status(400).json({ message: `Không đủ Tiên Ngọc! Cần ${jadeItem.jadeCost}, có ${deductResult?.current_balance ?? 0}.` });
    }
    const newJade = deductResult.new_balance;

    // Give item
    if (jadeItem.itemId) {
      const { data: inv } = await supabase
        .from('inventories')
        .select('*')
        .eq('user_id', req.user.id)
        .maybeSingle();

      if (inv) {
        const items = inv.items || [];
        const slot = items.find(i => i.itemId === jadeItem.itemId);
        if (slot) slot.quantity += jadeItem.quantity;
        else items.push({ itemId: jadeItem.itemId, quantity: jadeItem.quantity });
        await supabase.from('inventories').update({ items }).eq('id', inv.id);
      }
    }

    // Give spirit stones
    if (jadeItem.spiritStones) {
      await supabase.rpc('adjust_spirit_stones', { p_user_id: req.user.id, p_delta: jadeItem.spiritStones });
    }

    await logTransaction(req.user.id, {
      type: 'jade_spend',
      detail: { jadeItemId, jadeCost: jadeItem.jadeCost },
    });

    res.json({
      message: `💎 Đổi ${jadeItem.name} thành công! Còn ${newJade} Tiên Ngọc.`,
      newJadeCoins: newJade,
      item: jadeItem,
    });
  } catch (err) {
    console.error('spendJade error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── GET /api/vip/status ──────────────────────────────────────────────────────
export const getVipStatus = async (req, res) => {
  try {
    const { data: userRow } = await supabase
      .from('users')
      .select('jade_coins, vip_level, vip_expiry_at')
      .eq('id', req.user.id)
      .maybeSingle();

    const isVipActive = userRow?.vip_expiry_at && new Date(userRow.vip_expiry_at) > new Date();

    res.json({
      jadeCoins: userRow?.jade_coins || 0,
      vipLevel: isVipActive ? (userRow?.vip_level || 0) : 0,
      vipExpiry: userRow?.vip_expiry_at || null,
      isVipActive,
      benefits: isVipActive ? (VIP_PACKAGES[`vip${userRow.vip_level}`]?.benefits || []) : [],
    });
  } catch (err) {
    console.error('getVipStatus error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

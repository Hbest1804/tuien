import User from '../models/User.js';
import Cultivation from '../models/Cultivation.js';
import Inventory from '../models/Inventory.js';
import supabase from '../config/supabase.js';

// ─── Helper: Ghi audit log ────────────────────────────────────────────────────
const writeAuditLog = async (adminUser, action, targetId, targetName, details = {}) => {
  try {
    await supabase.from('admin_audit_logs').insert({
      admin_id: adminUser.id,
      admin_name: adminUser.username,
      action,
      target_id: targetId || null,
      target_name: targetName || null,
      details,
    });
  } catch (err) {
    console.error('Lỗi ghi audit log:', err);
  }
};

// ─── Helper: Lấy server_config theo key ──────────────────────────────────────
const getConfig = async (key) => {
  const { data } = await supabase.from('server_config').select('value').eq('key', key).maybeSingle();
  return data?.value || null;
};
const setConfig = async (key, value, adminName) => {
  await supabase.from('server_config').upsert({
    key,
    value,
    updated_at: new Date().toISOString(),
    updated_by: adminName,
  });
};

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/admin/dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, newUsers7d, newUsers30d] = await Promise.all([
      User.countAll(),
      User.countRecent(7),
      User.countRecent(30),
    ]);

    // Tổng Linh Thạch lưu thông
    const { data: stonesData } = await supabase
      .from('users')
      .select('spirit_stones')
      .not('spirit_stones', 'is', null);
    const totalStones = (stonesData || []).reduce((sum, u) => sum + (u.spirit_stones || 0), 0);

    // Số user bị ban
    const { count: bannedCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_banned', true);

    // Tông môn count
    const { data: sectData } = await supabase
      .from('cultivations')
      .select('sect_name')
      .not('sect_name', 'is', null);
    const sectNames = new Set((sectData || []).map(r => r.sect_name));
    const totalSects = sectNames.size;

    // Auction active count
    const { count: activeAuctions } = await supabase
      .from('auction_listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Đăng ký mới theo ngày (7 ngày gần nhất)
    const { data: registrations } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
      .order('created_at', { ascending: true });

    const dailyRegs = {};
    (registrations || []).forEach(r => {
      const day = r.created_at.slice(0, 10);
      dailyRegs[day] = (dailyRegs[day] || 0) + 1;
    });

    // Realm distribution
    const { data: realmData } = await supabase
      .from('cultivations')
      .select('realm_index');
    const realmDist = [0, 0, 0, 0, 0];
    (realmData || []).forEach(r => { realmDist[r.realm_index] = (realmDist[r.realm_index] || 0) + 1; });

    // Lấy config
    const [globalBuff, announcement] = await Promise.all([
      getConfig('global_buff'),
      getConfig('announcement'),
    ]);

    res.json({
      totalUsers,
      newUsers7d,
      newUsers30d,
      totalStones,
      bannedCount: bannedCount || 0,
      totalSects,
      activeAuctions: activeAuctions || 0,
      dailyRegistrations: dailyRegs,
      realmDistribution: realmDist,
      globalBuff,
      announcement,
    });
  } catch (err) {
    console.error('Lỗi getDashboardStats:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/admin/users?search=&page=&limit=&isBanned=
export const getUsers = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20, isBanned } = req.query;
    const filter = {};
    if (isBanned !== undefined) filter.isBanned = isBanned === 'true';

    const { users, total } = await User.findMany({
      search,
      isBanned: filter.isBanned,
      page: Number(page),
      limit: Number(limit),
    });

    res.json({ users, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('Lỗi getUsers:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/admin/users/:id
export const getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const [user, cultivation, inventory] = await Promise.all([
      User.findById(id),
      Cultivation.findOne({ userId: id }),
      Inventory.findOne({ userId: id }),
    ]);
    if (!user) return res.status(404).json({ message: 'User không tồn tại' });
    res.json({ user, cultivation, inventory });
  } catch (err) {
    console.error('Lỗi getUserDetail:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// POST /api/admin/users/:id/ban
export const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = '' } = req.body;
    const target = await User.findById(id);
    if (!target) return res.status(404).json({ message: 'User không tồn tại' });
    if (target.role === 'admin') return res.status(400).json({ message: 'Không thể ban Admin khác.' });

    await User.adminUpdate(id, { isBanned: true });
    await writeAuditLog(req.user, 'BAN_USER', id, target.username, { reason });

    res.json({ message: `Đã khóa tài khoản ${target.username}.` });
  } catch (err) {
    console.error('Lỗi banUser:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// POST /api/admin/users/:id/unban
export const unbanUser = async (req, res) => {
  try {
    const { id } = req.params;
    const target = await User.findById(id);
    if (!target) return res.status(404).json({ message: 'User không tồn tại' });

    await User.adminUpdate(id, { isBanned: false });
    await writeAuditLog(req.user, 'UNBAN_USER', id, target.username, {});

    res.json({ message: `Đã mở khóa tài khoản ${target.username}.` });
  } catch (err) {
    console.error('Lỗi unbanUser:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// POST /api/admin/users/:id/mute
export const muteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const target = await User.findById(id);
    if (!target) return res.status(404).json({ message: 'User không tồn tại' });

    await User.adminUpdate(id, { isMuted: true });
    await writeAuditLog(req.user, 'MUTE_USER', id, target.username, {});

    res.json({ message: `Đã cấm chat ${target.username}.` });
  } catch (err) {
    console.error('Lỗi muteUser:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// POST /api/admin/users/:id/unmute
export const unmuteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const target = await User.findById(id);
    if (!target) return res.status(404).json({ message: 'User không tồn tại' });

    await User.adminUpdate(id, { isMuted: false });
    await writeAuditLog(req.user, 'UNMUTE_USER', id, target.username, {});

    res.json({ message: `Đã bỏ cấm chat ${target.username}.` });
  } catch (err) {
    console.error('Lỗi unmuteUser:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// POST /api/admin/users/:id/grant-resources
export const grantResources = async (req, res) => {
  try {
    const { id } = req.params;
    const { spiritStones, itemId, itemQuantity, reason = '' } = req.body;

    const target = await User.findById(id);
    if (!target) return res.status(404).json({ message: 'User không tồn tại' });

    const details = { reason };

    // Tặng/trừ Linh Thạch
    if (spiritStones !== undefined && spiritStones !== 0) {
      const newBalance = Math.max(0, (target.spiritStones || 0) + Number(spiritStones));
      await User.adminUpdate(id, { spiritStones: newBalance });
      details.spiritStones = spiritStones;
      details.newBalance = newBalance;
    }

    // Tặng vật phẩm vào inventory
    if (itemId && itemQuantity && itemQuantity > 0) {
      const inv = await Inventory.findOne({ userId: id });
      if (inv) {
        const items = inv.items || [];
        const existing = items.find(i => i.itemId === itemId);
        if (existing) {
          existing.quantity += Number(itemQuantity);
        } else {
          items.push({ itemId, quantity: Number(itemQuantity) });
        }
        await supabase.from('inventories').update({ items, updated_at: new Date().toISOString() }).eq('user_id', id);
        details.itemId = itemId;
        details.itemQuantity = itemQuantity;
      }
    }

    await writeAuditLog(req.user, 'GRANT_RESOURCES', id, target.username, details);
    res.json({ message: `Đã cập nhật tài nguyên cho ${target.username}.` });
  } catch (err) {
    console.error('Lỗi grantResources:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// POST /api/admin/users/:id/adjust-stats
export const adjustStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { expAccumulated, realmIndex, lifespan, spiritRoot, spiritRootGrade, reason = '' } = req.body;

    const target = await User.findById(id);
    if (!target) return res.status(404).json({ message: 'User không tồn tại' });

    const cultivationUpdates = {};
    if (expAccumulated !== undefined) cultivationUpdates.expAccumulated = Number(expAccumulated);
    if (realmIndex !== undefined) cultivationUpdates.realmIndex = Number(realmIndex);
    if (lifespan !== undefined) cultivationUpdates.lifespan = Number(lifespan);

    if (Object.keys(cultivationUpdates).length > 0) {
      const dbUpdates = {};
      if (cultivationUpdates.expAccumulated !== undefined) dbUpdates.exp_accumulated = cultivationUpdates.expAccumulated;
      if (cultivationUpdates.realmIndex !== undefined) dbUpdates.realm_index = cultivationUpdates.realmIndex;
      if (cultivationUpdates.lifespan !== undefined) dbUpdates.lifespan = cultivationUpdates.lifespan;

      await supabase.from('cultivations').update({ ...dbUpdates, updated_at: new Date().toISOString() }).eq('user_id', id);
    }

    // Linh căn thuộc bảng users
    const userUpdates = {};
    if (spiritRoot !== undefined) userUpdates.spiritRoot = spiritRoot;
    if (spiritRootGrade !== undefined) userUpdates.spiritRootGrade = spiritRootGrade;
    if (Object.keys(userUpdates).length > 0) {
      await User.adminUpdate(id, userUpdates);
    }

    await writeAuditLog(req.user, 'ADJUST_STATS', id, target.username, {
      reason, cultivationUpdates, userUpdates,
    });

    res.json({ message: `Đã điều chỉnh chỉ số cho ${target.username}.` });
  } catch (err) {
    console.error('Lỗi adjustStats:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// CONTENT MANAGEMENT — SECTS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/admin/sects
export const getSects = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cultivations')
      .select('sect_name, sect_rank, user_id, sect_contribution')
      .not('sect_name', 'is', null)
      .order('sect_contribution', { ascending: false });

    if (error) throw error;

    // Group by sect_name
    const sectMap = {};
    (data || []).forEach(row => {
      if (!sectMap[row.sect_name]) {
        sectMap[row.sect_name] = { name: row.sect_name, memberCount: 0, members: [] };
      }
      sectMap[row.sect_name].memberCount++;
      if (row.sect_rank === 'Tông Chủ') {
        sectMap[row.sect_name].leader = row.user_id;
      }
    });

    res.json({ sects: Object.values(sectMap) });
  } catch (err) {
    console.error('Lỗi getSects:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// DELETE /api/admin/sects/:sectName
export const deleteSect = async (req, res) => {
  try {
    const sectName = decodeURIComponent(req.params.sectName);
    const { reason = '' } = req.body;

    // Kick tất cả thành viên
    const { error } = await supabase
      .from('cultivations')
      .update({
        sect_name: null,
        sect_joined_at: null,
        sect_contribution: 0,
        sect_missions: [],
        active_mission_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('sect_name', sectName);

    if (error) throw error;

    await writeAuditLog(req.user, 'DELETE_SECT', null, sectName, { reason });
    res.json({ message: `Đã giải tán tông môn "${sectName}".` });
  } catch (err) {
    console.error('Lỗi deleteSect:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// PATCH /api/admin/sects/:sectName/rename
export const renameSect = async (req, res) => {
  try {
    const oldName = decodeURIComponent(req.params.sectName);
    const { newName, reason = '' } = req.body;
    if (!newName) return res.status(400).json({ message: 'Tên mới không được để trống.' });

    const { error } = await supabase
      .from('cultivations')
      .update({ sect_name: newName, updated_at: new Date().toISOString() })
      .eq('sect_name', oldName);

    if (error) throw error;

    await writeAuditLog(req.user, 'RENAME_SECT', null, oldName, { newName, reason });
    res.json({ message: `Đã đổi tên tông môn "${oldName}" → "${newName}".` });
  } catch (err) {
    console.error('Lỗi renameSect:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// CONTENT MANAGEMENT — AUCTIONS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/admin/auctions?status=active&page=1
export const getAuctions = async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('auction_listings')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (status !== 'all') query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ listings: data || [], total: count || 0, page: Number(page) });
  } catch (err) {
    console.error('Lỗi getAuctions:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// DELETE /api/admin/auctions/:id
export const deleteAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = '', refund = true } = req.body;

    const { data: listing } = await supabase
      .from('auction_listings')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!listing) return res.status(404).json({ message: 'Listing không tồn tại.' });
    if (listing.status !== 'active') return res.status(400).json({ message: 'Listing không còn active.' });

    // Hoàn tiền cho bidder hiện tại nếu có
    if (refund && listing.bidder_id && listing.current_bid > 0) {
      const { error: rpcErr } = await supabase.rpc('adjust_spirit_stones', {
        p_user_id: listing.bidder_id,
        p_delta: listing.current_bid,
      });
      if (rpcErr) throw rpcErr;
    }

    // Trả vật phẩm về cho seller
    const { data: sellerInv } = await supabase.from('inventories').select('*').eq('user_id', listing.seller_id).maybeSingle();
    if (sellerInv) {
      const items = sellerInv.items || [];
      const existing = items.find(i => i.itemId === listing.item_id);
      if (existing) {
        existing.quantity += listing.quantity;
      } else {
        items.push({ itemId: listing.item_id, quantity: listing.quantity });
      }
      await supabase.from('inventories').update({ items, updated_at: new Date().toISOString() }).eq('user_id', listing.seller_id);
    }

    // Xóa (cancelled) listing
    await supabase.from('auction_listings').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', id);

    await writeAuditLog(req.user, 'DELETE_AUCTION', id, listing.item_name, { reason, sellerId: listing.seller_id, refund });
    res.json({ message: `Đã xóa listing "${listing.item_name}" và hoàn tiền/vật phẩm.` });
  } catch (err) {
    console.error('Lỗi deleteAuction:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// CONTENT MANAGEMENT — SHOP CONFIG
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/admin/shop-config
export const getShopConfig = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('server_config')
      .select('value')
      .eq('key', 'shop_overrides')
      .maybeSingle();

    if (error) throw error;
    res.json({ overrides: data?.value || {} });
  } catch (err) {
    console.error('Lỗi getShopConfig:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// PATCH /api/admin/shop-config
export const updateShopConfig = async (req, res) => {
  try {
    const { overrides } = req.body;
    if (!overrides) return res.status(400).json({ message: 'Thiếu overrides.' });

    await setConfig('shop_overrides', overrides, req.user.username);
    await writeAuditLog(req.user, 'UPDATE_SHOP_CONFIG', null, 'shop', { overrides });

    res.json({ message: 'Đã cập nhật cấu hình shop.' });
  } catch (err) {
    console.error('Lỗi updateShopConfig:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// EVENTS & CONFIG
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/admin/server-config
export const getServerConfig = async (req, res) => {
  try {
    const [globalBuff, announcement] = await Promise.all([
      getConfig('global_buff'),
      getConfig('announcement'),
    ]);
    res.json({ globalBuff, announcement });
  } catch (err) {
    console.error('Lỗi getServerConfig:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// PATCH /api/admin/server-config/global-buff
export const setGlobalBuff = async (req, res) => {
  try {
    const { enabled, multiplier = 2, label = '', expiresAt = null } = req.body;
    const value = { enabled: !!enabled, multiplier: Number(multiplier), label, expires_at: expiresAt };

    await setConfig('global_buff', value, req.user.username);
    await writeAuditLog(req.user, 'SET_GLOBAL_BUFF', null, 'server', value);

    res.json({ message: 'Đã cập nhật Global Buff.', globalBuff: value });
  } catch (err) {
    console.error('Lỗi setGlobalBuff:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// PATCH /api/admin/server-config/announcement
export const setAnnouncement = async (req, res) => {
  try {
    const { enabled, message = '', type = 'info' } = req.body;
    const value = { enabled: !!enabled, message, type };

    await setConfig('announcement', value, req.user.username);
    await writeAuditLog(req.user, 'SET_ANNOUNCEMENT', null, 'server', value);

    res.json({ message: 'Đã cập nhật Thông báo Server.', announcement: value });
  } catch (err) {
    console.error('Lỗi setAnnouncement:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// POST /api/admin/mail/send
export const sendMail = async (req, res) => {
  try {
    const { recipientId, subject, body, attachment, broadcast = false } = req.body;

    if (!subject || !body) return res.status(400).json({ message: 'Tiêu đề và nội dung không được để trống.' });

    if (broadcast) {
      // Lấy tất cả user IDs
      const { data: allUsers } = await supabase.from('users').select('id');
      const mails = (allUsers || []).map(u => ({
        recipient_id: u.id,
        sender_name: `Admin (${req.user.username})`,
        subject,
        body,
        attachment: attachment || null,
      }));

      // Gửi theo batch (Supabase limit insert)
      const BATCH = 500;
      for (let i = 0; i < mails.length; i += BATCH) {
        await supabase.from('mail_inbox').insert(mails.slice(i, i + BATCH));
      }

      await writeAuditLog(req.user, 'SEND_MAIL_BROADCAST', null, 'all_users', { subject, hasAttachment: !!attachment });
      res.json({ message: `Đã gửi thư tới ${mails.length} người chơi.` });
    } else {
      if (!recipientId) return res.status(400).json({ message: 'Thiếu recipientId.' });
      const target = await User.findById(recipientId);
      if (!target) return res.status(404).json({ message: 'User không tồn tại.' });

      await supabase.from('mail_inbox').insert({
        recipient_id: recipientId,
        sender_name: `Admin (${req.user.username})`,
        subject,
        body,
        attachment: attachment || null,
      });

      await writeAuditLog(req.user, 'SEND_MAIL', recipientId, target.username, { subject, hasAttachment: !!attachment });
      res.json({ message: `Đã gửi thư tới ${target.username}.` });
    }
  } catch (err) {
    console.error('Lỗi sendMail:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// AUDIT LOGS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/admin/audit-logs?page=1&limit=50
export const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, adminId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('admin_audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (adminId) query = query.eq('admin_id', adminId);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ logs: data || [], total: count || 0, page: Number(page) });
  } catch (err) {
    console.error('Lỗi getAuditLogs:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// TRANSACTION HISTORY
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/admin/transactions?page=1
export const getTransactionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Lấy auction listings đã hoàn thành (giao dịch thực sự)
    const { data, error, count } = await supabase
      .from('auction_listings')
      .select('id, seller_id, seller_name, bidder_id, bidder_name, item_name, item_rarity, quantity, current_bid, buyout_price, status, created_at, updated_at', { count: 'exact' })
      .in('status', ['sold', 'cancelled', 'expired', 'pending_claim'])
      .order('updated_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    res.json({ transactions: data || [], total: count || 0, page: Number(page) });
  } catch (err) {
    console.error('Lỗi getTransactionHistory:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// CHEAT DETECTION
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/admin/cheat-alerts
export const getCheatAlerts = async (req, res) => {
  try {
    const alerts = [];

    // 1. Users có Linh Thạch bất thường cao (> 1 triệu)
    const { data: richUsers } = await supabase
      .from('users')
      .select('id, username, spirit_stones, created_at')
      .gt('spirit_stones', 1000000)
      .order('spirit_stones', { ascending: false })
      .limit(20);

    (richUsers || []).forEach(u => {
      alerts.push({
        type: 'HIGH_BALANCE',
        severity: 'warning',
        userId: u.id,
        username: u.username,
        detail: `Linh Thạch: ${u.spirit_stones.toLocaleString()}`,
        createdAt: u.created_at,
      });
    });

    // 2. Users mới tạo (<7 ngày) nhưng đã ở cảnh giới cao (>= 3)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: newHighRealm } = await supabase
      .from('cultivations')
      .select('user_id, realm_index, users!inner(username, created_at)')
      .gte('realm_index', 3)
      .gte('users.created_at', sevenDaysAgo)
      .limit(20);

    (newHighRealm || []).forEach(r => {
      const REALM_NAMES = ['Luyện Khí', 'Trúc Cơ', 'Kim Đan', 'Nguyên Anh', 'Hóa Thần'];
      alerts.push({
        type: 'FAST_PROGRESSION',
        severity: 'danger',
        userId: r.user_id,
        username: r.users?.username,
        detail: `Cảnh giới ${REALM_NAMES[r.realm_index] || r.realm_index} trong 7 ngày đầu`,
        createdAt: r.users?.created_at,
      });
    });

    // 3. Users có nhiều auction bị cancel gần đây (có thể đang spam)
    const { data: auctionSpammers } = await supabase
      .from('auction_listings')
      .select('seller_id, seller_name')
      .eq('status', 'cancelled')
      .gte('created_at', new Date(Date.now() - 24 * 3600000).toISOString());

    const spamCount = {};
    (auctionSpammers || []).forEach(a => {
      spamCount[a.seller_id] = spamCount[a.seller_id] || { name: a.seller_name, count: 0 };
      spamCount[a.seller_id].count++;
    });

    Object.entries(spamCount).forEach(([userId, info]) => {
      if (info.count >= 5) {
        alerts.push({
          type: 'AUCTION_SPAM',
          severity: 'warning',
          userId,
          username: info.name,
          detail: `${info.count} auction bị cancel trong 24h`,
          createdAt: new Date().toISOString(),
        });
      }
    });

    res.json({ alerts, total: alerts.length });
  } catch (err) {
    console.error('Lỗi getCheatAlerts:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

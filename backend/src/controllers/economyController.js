import mongoose from 'mongoose';
import User from '../models/User.js';
import Inventory from '../models/Inventory.js';
import Cultivation from '../models/Cultivation.js';
import { ITEMS, ITEM_TYPES } from '../data/items.js';

// ─── Hằng số ──────────────────────────────────────────────────────────────────

// Tỷ lệ thu Linh Thạch idle mỗi phút (theo cảnh giới)
const IDLE_STONES_PER_MINUTE = [1, 2, 4, 8, 15];

// Danh sách vật phẩm bày bán tại Thương Hội + giá Linh Thạch
const SHOP_PRICE_MAP = {
  'pill_tu_khi_dan':       { price: 50,   stock: null }, // null = vô hạn
  'pill_truc_co_dan':      { price: 200,  stock: null },
  'pill_tay_tuy_dan':      { price: 300,  stock: null },
  'pill_tho_nguyen_qua':   { price: 1000, stock: null },
  'pill_pha_canh_dan':     { price: 500,  stock: null },
  'weapon_moc_kiem':       { price: 80,   stock: null },
  'weapon_huyen_thiet_kiem': { price: 800, stock: null },
  'artifact_ti_loi_phu':   { price: 150,  stock: null },
  'artifact_huyen_vu_khien': { price: 2000, stock: null },
  'mat_huyet_linh_thao':   { price: 30,   stock: null },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const getOrCreateInventory = async (userId) => {
  const existing = await Inventory.findOne({ userId });
  if (existing) return existing;
  return await Inventory.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

// ─── ECONOMY: Lấy số Linh Thạch ──────────────────────────────────────────────
export const getBalance = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const cult = await Cultivation.findOne({ userId: user._id }).lean();
    const realmIndex = cult?.realmIndex || 0;

    // Tính Linh Thạch idle đang tích lũy (chưa thu)
    const pendingStones = computePendingStones(user, realmIndex);

    res.json({
      spiritStones: user.spiritStones,
      pendingStones,
      lastCollectedAt: user.lastStoneCollectedAt,
    });
  } catch (err) {
    console.error('Lỗi getBalance:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── ECONOMY: Thu Linh Thạch Idle ────────────────────────────────────────────
export const collectIdleStones = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const cult = await Cultivation.findOne({ userId: user._id }).lean();
    const realmIndex = cult?.realmIndex || 0;

    const pending = computePendingStones(user, realmIndex);
    if (pending <= 0) {
      return res.json({
        message: 'Chưa có Linh Thạch để thu thập.',
        spiritStones: user.spiritStones,
        collected: 0,
      });
    }

    const freshUser = await User.findById(user._id);
    const collectedNow = computePendingStones(freshUser, realmIndex);
    freshUser.spiritStones = (freshUser.spiritStones || 0) + collectedNow;
    freshUser.lastStoneCollectedAt = new Date();
    await freshUser.save();

    res.json({
      message: `Thu thập được ${collectedNow} Linh Thạch!`,
      spiritStones: freshUser.spiritStones,
      collected: collectedNow,
    });
  } catch (err) {
    console.error('Lỗi collectIdleStones:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Helper: tính Linh Thạch idle tích lũy
function computePendingStones(user, realmIndex = 0) {
  const lastCollected = user.lastStoneCollectedAt || user.createdAt || new Date();
  const elapsedMs = Date.now() - new Date(lastCollected).getTime();
  const elapsedMinutes = elapsedMs / 60000;

  // Lấy realmIndex từ cultivation (không có thì dùng 0)
  // Giới hạn tối đa 24h để tránh kho đầy
  const cappedMinutes = Math.min(elapsedMinutes, 24 * 60);
  const ratePerMinute = IDLE_STONES_PER_MINUTE[Math.min(realmIndex, IDLE_STONES_PER_MINUTE.length - 1)]; 
  return Math.floor(cappedMinutes * ratePerMinute);
}

// ─── SHOP: Lấy danh sách hàng hóa ────────────────────────────────────────────
export const getShopItems = async (req, res) => {
  try {
    const items = Object.entries(SHOP_PRICE_MAP).map(([itemId, meta]) => {
      const itemData = ITEMS[itemId];
      if (!itemData) return null;
      return {
        itemId,
        name: itemData.name,
        type: itemData.type,
        subType: itemData.subType,
        description: itemData.description,
        rarity: itemData.rarity,
        effects: itemData.effects,
        price: meta.price,
        stock: meta.stock,
      };
    }).filter(Boolean);

    res.json({ items });
  } catch (err) {
    console.error('Lỗi getShopItems:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── SHOP: Mua vật phẩm ───────────────────────────────────────────────────────
export const buyShopItem = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const { itemId, quantity = 1 } = req.body;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ message: 'Số lượng không hợp lệ.' });
    }

    const shopMeta = SHOP_PRICE_MAP[itemId];
    if (!shopMeta) {
      return res.status(400).json({ message: 'Vật phẩm không có trong Thương Hội.' });
    }

    const itemData = ITEMS[itemId];
    if (!itemData) {
      return res.status(400).json({ message: 'Vật phẩm không tồn tại.' });
    }

    const totalCost = shopMeta.price * quantity;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const freshUser = await User.findById(user._id).session(session);
      if (!freshUser) throw new Error('User không tồn tại');

      if (freshUser.spiritStones < totalCost) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: `Không đủ Linh Thạch! Cần ${totalCost.toLocaleString()} nhưng chỉ có ${freshUser.spiritStones.toLocaleString()}.`,
        });
      }

      // Trừ Linh Thạch
      freshUser.spiritStones -= totalCost;
      await freshUser.save({ session });

      // Thêm vào túi đồ
      await getOrCreateInventory(user._id);
      const inventory = await Inventory.findOne({ userId: user._id }).session(session);

      const existingItem = inventory.items.find(i => i.itemId === itemId);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        if (inventory.items.length >= inventory.maxSlots) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ message: 'Túi đồ đã đầy!' });
        }
        inventory.items.push({ itemId, quantity });
      }
      await inventory.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.json({
        message: `Mua ${quantity} ${itemData.name} thành công! Đã dùng ${totalCost} Linh Thạch.`,
        spiritStones: freshUser.spiritStones,
      });
    } catch (innerErr) {
      await session.abortTransaction();
      session.endSession();
      if (innerErr.name === 'VersionError') {
        return res.status(409).json({ message: 'Dữ liệu thay đổi, vui lòng thử lại.' });
      }
      throw innerErr;
    }
  } catch (err) {
    console.error('Lỗi buyShopItem:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

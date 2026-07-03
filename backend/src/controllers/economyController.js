import User from '../models/User.js';
import Inventory from '../models/Inventory.js';
import Cultivation from '../models/Cultivation.js';
import { ITEMS, ITEM_TYPES } from '../data/items.js';

// ─── Hằng số ──────────────────────────────────────────────────────────────────
const IDLE_STONES_PER_MINUTE = [1, 2, 4, 8, 15];

const SHOP_PRICE_MAP = {
  'pill_tu_khi_dan':         { price: 50,   stock: null },
  'pill_truc_co_dan':        { price: 200,  stock: null },
  'pill_kim_dan':            { price: 800,  stock: null },
  'pill_tay_tuy_dan':        { price: 300,  stock: null },
  'pill_linh_khi_dan':       { price: 600,  stock: null },
  'pill_tho_nguyen_qua':     { price: 1000, stock: null },
  'pill_pha_canh_dan':       { price: 500,  stock: null },
  'pill_thien_dieu_dan':     { price: 1500, stock: null },
  'weapon_moc_kiem':         { price: 80,   stock: null },
  'weapon_huyen_thiet_kiem': { price: 800,  stock: null },
  'weapon_tuyet_han_kiem':   { price: 3000, stock: null },
  'armor_tho_vu_giac':       { price: 120,  stock: null },
  'armor_huyen_vu_giac':     { price: 1200, stock: null },
  'artifact_ti_loi_phu':     { price: 150,  stock: null },
  'artifact_huyen_vu_khien': { price: 2000, stock: null },
  'mat_huyet_linh_thao':     { price: 30,   stock: null },
  'mat_kim_dan_thao':        { price: 120,  stock: null },
  'mat_nguyen_anh_thach':    { price: 400,  stock: null },
  'mat_hoa_than_tinh':       { price: 1200, stock: null },
  'tech_lu_khi_quyet':       { price: 200,  stock: null },
  'tech_thien_long_quyet':   { price: 800,  stock: null },
  'tech_cuu_long_quyet':     { price: 3000, stock: null },
};

const SHOP_SELL_PRICE_MAP = Object.fromEntries(
  Object.entries(SHOP_PRICE_MAP).map(([id, meta]) => [id, Math.floor(meta.price * 0.5)])
);

const getOrCreateInventory = async (userId) => {
  return await Inventory.findOneAndUpdate(
    { userId },
    {},
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

function computePendingStones(user, realmIndex = 0) {
  const lastCollected = user.lastStoneCollectedAt || user.createdAt || new Date();
  const elapsedMs = Date.now() - new Date(lastCollected).getTime();
  const elapsedMinutes = elapsedMs / 60000;
  const cappedMinutes = Math.min(elapsedMinutes, 24 * 60);
  const ratePerMinute = IDLE_STONES_PER_MINUTE[Math.max(0, Math.min(realmIndex, IDLE_STONES_PER_MINUTE.length - 1))];
  return Math.floor(cappedMinutes * ratePerMinute);
}

// ── GET /economy/balance ─────────────────────────────────────────────────────
export const getBalance = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const cult = await Cultivation.findOne({ userId: user.id });
    const realmIndex = cult?.realmIndex || 0;
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

// ── POST /economy/collect ────────────────────────────────────────────────────
export const collectIdleStones = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const cult = await Cultivation.findOne({ userId: user.id });
    const realmIndex = cult?.realmIndex || 0;

    const freshUser = await User.findById(user.id);
    if (!freshUser) return res.status(404).json({ message: 'User không tồn tại' });

    const pending = computePendingStones(freshUser, realmIndex);
    if (pending <= 0) {
      return res.json({ message: 'Chưa có Linh Thạch để thu thập.', spiritStones: freshUser.spiritStones, collected: 0 });
    }

    freshUser.spiritStones = (freshUser.spiritStones || 0) + pending;

    const lastCollected = freshUser.lastStoneCollectedAt || freshUser.createdAt || new Date();
    const elapsedMs = Date.now() - new Date(lastCollected).getTime();
    const elapsedMinutes = elapsedMs / 60000;

    if (elapsedMinutes >= 24 * 60) {
      freshUser.lastStoneCollectedAt = new Date();
    } else {
      const ratePerMinute = IDLE_STONES_PER_MINUTE[Math.max(0, Math.min(realmIndex, IDLE_STONES_PER_MINUTE.length - 1))];
      const collectedMinutes = pending / ratePerMinute;
      freshUser.lastStoneCollectedAt = new Date(new Date(lastCollected).getTime() + collectedMinutes * 60000);
    }

    await User.save(freshUser);

    res.json({ message: `Thu thập được ${pending} Linh Thạch!`, spiritStones: freshUser.spiritStones, collected: pending });
  } catch (err) {
    console.error('Lỗi collectIdleStones:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ── GET /economy/shop ────────────────────────────────────────────────────────
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
        sellPrice: SHOP_SELL_PRICE_MAP[itemId] || 0,
        stock: meta.stock,
      };
    }).filter(Boolean);

    res.json({ items });
  } catch (err) {
    console.error('Lỗi getShopItems:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ── POST /economy/shop/buy ───────────────────────────────────────────────────
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
    if (!shopMeta) return res.status(400).json({ message: 'Vật phẩm không có trong Thương Hội.' });

    const itemData = ITEMS[itemId];
    if (!itemData) return res.status(400).json({ message: 'Vật phẩm không tồn tại.' });

    const totalCost = shopMeta.price * quantity;

    const freshUser = await User.findById(user.id);
    if (!freshUser) throw new Error('User không tồn tại');
    freshUser.spiritStones = freshUser.spiritStones || 0;

    if (freshUser.spiritStones < totalCost) {
      return res.status(400).json({
        message: `Không đủ Linh Thạch! Cần ${totalCost.toLocaleString()} nhưng chỉ có ${freshUser.spiritStones.toLocaleString()}.`,
      });
    }

    freshUser.spiritStones -= totalCost;
    await User.save(freshUser);

    const inventory = await getOrCreateInventory(user.id);
    const existingItem = inventory.items.find(i => i.itemId === itemId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      if (inventory.items.length >= inventory.maxSlots) {
        // Hoàn tiền nếu túi đầy
        freshUser.spiritStones += totalCost;
        await User.save(freshUser);
        return res.status(400).json({ message: 'Túi đồ đã đầy!' });
      }
      inventory.items.push({ itemId, quantity });
    }
    await Inventory.save(inventory);

    res.json({ message: `Mua ${quantity} ${itemData.name} thành công! Đã dùng ${totalCost} Linh Thạch.`, spiritStones: freshUser.spiritStones });
  } catch (err) {
    console.error('Lỗi buyShopItem:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ── POST /economy/shop/sell ──────────────────────────────────────────────────
export const sellShopItem = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const { itemId, quantity = 1 } = req.body;
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ message: 'Số lượng không hợp lệ.' });
    }

    const sellPrice = SHOP_SELL_PRICE_MAP[itemId];
    if (sellPrice === undefined) return res.status(400).json({ message: 'Vật phẩm này không thể bán cho NPC.' });

    const itemData = ITEMS[itemId];
    if (!itemData) return res.status(400).json({ message: 'Vật phẩm không tồn tại.' });

    const totalEarned = sellPrice * quantity;

    const inventory = await getOrCreateInventory(user.id);
    const itemIndex = inventory.items.findIndex(i => i.itemId === itemId);
    if (itemIndex === -1 || inventory.items[itemIndex].quantity < quantity) {
      return res.status(400).json({ message: `Không đủ ${itemData.name} trong túi đồ.` });
    }

    inventory.items[itemIndex].quantity -= quantity;
    if (inventory.items[itemIndex].quantity <= 0) {
      inventory.items.splice(itemIndex, 1);
    }
    await Inventory.save(inventory);

    const freshUser = await User.findById(user.id);
    freshUser.spiritStones = (freshUser.spiritStones || 0) + totalEarned;
    await User.save(freshUser);

    res.json({ message: `Bán ${quantity} ${itemData.name} thành công! Nhận được ${totalEarned} Linh Thạch.`, spiritStones: freshUser.spiritStones });
  } catch (err) {
    console.error('Lỗi sellShopItem:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ── GET /economy/sell-prices ─────────────────────────────────────────────────
export const getSellPrices = async (req, res) => {
  try {
    const prices = Object.entries(SHOP_SELL_PRICE_MAP).map(([itemId, sellPrice]) => {
      const itemData = ITEMS[itemId];
      if (!itemData) return null;
      return { itemId, name: itemData.name, type: itemData.type, rarity: itemData.rarity, sellPrice };
    }).filter(Boolean);
    res.json({ prices });
  } catch (err) {
    console.error('Lỗi getSellPrices:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

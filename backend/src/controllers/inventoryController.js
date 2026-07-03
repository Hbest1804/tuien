import Inventory from '../models/Inventory.js';
import Cultivation, { REALMS, REALM_LIFESPAN, PRACTICAL_INFINITY_LIFESPAN } from '../models/Cultivation.js';
import { ITEMS, ITEM_TYPES, ITEM_SUBTYPES } from '../data/items.js';
import { autoStopIfFull } from './cultivationController.js';

// Helper: lấy hoặc tạo Inventory
export const getOrCreateInventory = async (userId) => {
  return await Inventory.findOneAndUpdate(
    { userId },
    {},
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

// Mở rộng thông tin item khi trả về cho frontend
const populateInventoryData = (inventory) => {
  inventory.cleanExpiredBuffs();

  const populatedItems = inventory.items.map(i => {
    const itemData = ITEMS[i.itemId] || { name: 'Vật phẩm không xác định' };
    return { itemId: i.itemId, quantity: i.quantity, ...itemData };
  });

  const equippedStats = inventory.computeEquippedStats(ITEMS);
  const equippedWeaponData = inventory.equipment.weapon ? ITEMS[inventory.equipment.weapon] : null;
  const equippedArmorData  = inventory.equipment.armor  ? ITEMS[inventory.equipment.armor]  : null;

  return {
    maxSlots: inventory.maxSlots,
    equipment: inventory.equipment,
    equippedWeapon: equippedWeaponData ? { itemId: inventory.equipment.weapon, ...equippedWeaponData } : null,
    equippedArmor:  equippedArmorData  ? { itemId: inventory.equipment.armor,  ...equippedArmorData  } : null,
    equippedStats,
    techniquePassiveBonus: inventory.techniquePassiveBonus || 0,
    activeBuffs: inventory.activeBuffs,
    items: populatedItems,
    currentSlots: inventory.items.length,
    speedBuffMultiplier: inventory.getSpeedBuffMultiplier(),
    totalSpeedMultiplier: inventory.getTotalSpeedMultiplier(),
  };
};

export const getInventoryStatus = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const inventory = await getOrCreateInventory(req.user.id);
    const populated = populateInventoryData(inventory);
    if (inventory.isModified()) {
      await Inventory.save(inventory);
    }

    res.json({ inventory: populated });
  } catch (err) {
    console.error('Lỗi getInventoryStatus:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const addTestItem = async (req, res) => {
  try {
    const { itemId, quantity = 1 } = req.body;

    if (!ITEMS[itemId]) {
      return res.status(400).json({ message: 'Item ID không tồn tại' });
    }

    const inventory = await getOrCreateInventory(req.user.id);

    const existingItem = inventory.items.find(i => i.itemId === itemId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      if (inventory.items.length >= inventory.maxSlots) {
        return res.status(400).json({ message: 'Túi đồ đã đầy!' });
      }
      inventory.items.push({ itemId, quantity });
    }

    await Inventory.save(inventory);
    res.json({
      message: `Đã thêm ${quantity} ${ITEMS[itemId].name} vào túi đồ.`,
      inventory: populateInventoryData(inventory),
    });
  } catch (err) {
    console.error('Lỗi addTestItem:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const useItem = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const { itemId, quantity = 1 } = req.body;

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ message: 'Số lượng vật phẩm không hợp lệ.' });
    }
    if (!ITEMS[itemId]) {
      return res.status(400).json({ message: 'Item ID không hợp lệ.' });
    }

    const itemData = ITEMS[itemId];
    if (itemData.type !== ITEM_TYPES.PILL) {
      return res.status(400).json({ message: 'Vật phẩm này không thể sử dụng trực tiếp.' });
    }

    const inventory = await getOrCreateInventory(req.user.id);
    const itemIndex = inventory.items.findIndex(i => i.itemId === itemId);
    if (itemIndex === -1 || inventory.items[itemIndex].quantity < quantity) {
      return res.status(400).json({ message: 'Không đủ số lượng vật phẩm trong túi.' });
    }

    let cult = await Cultivation.findOne({ userId: req.user.id });
    if (!cult) {
      return res.status(400).json({ message: 'Không tìm thấy dữ liệu tu luyện.' });
    }

    cult = await autoStopIfFull(cult, req.user.spiritRootGrade, inventory);

    const effects = itemData.effects;
    let message = `Sử dụng ${quantity} ${itemData.name} thành công. `;

    let effectiveness = 1.0;
    if (itemData.targetRealmIndex !== undefined && itemData.targetRealmIndex !== 99) {
      const realmDiff = cult.realmIndex - itemData.targetRealmIndex;
      if (realmDiff === 1) effectiveness = 0.5;
      else if (realmDiff === 2) effectiveness = 0.1;
      else if (realmDiff >= 3) effectiveness = 0;
    }

    if (effectiveness === 0) {
      message = `Sử dụng ${quantity} ${itemData.name}. Tu vi của bạn quá cao, loại đan dược này hoàn toàn không còn tác dụng! `;
    } else if (effectiveness < 1.0) {
      message += `Do chênh lệch cảnh giới, hiệu lực đan dược bị giảm còn ${effectiveness * 100}%. `;
    }

    const today = new Date().toISOString().split('T')[0];
    if (cult.dailyPillsConsumed?.date !== today) {
      cult.dailyPillsConsumed = { count: 0, date: today };
    }
    cult.dailyPillsConsumed.count += quantity;

    if (cult.dailyPillsConsumed.count > 10) {
      message += `💀 Cảnh báo! Bạn đã sử dụng quá 10 đan dược trong ngày hôm nay. Dược độc tích tụ dẫn đến Tẩu hỏa nhập ma! Tốc độ tu luyện giảm 50% trong 24h. `;
      const durationMs = 24 * 3600 * 1000;
      const existingHeartDemon = inventory.activeBuffs.find(b => b.buffType === 'SPEED_HEART_DEMON');
      if (existingHeartDemon) {
        existingHeartDemon.expiresAt = new Date(Math.max(Date.now(), new Date(existingHeartDemon.expiresAt).getTime()) + durationMs);
      } else {
        inventory.activeBuffs.push({
          buffType: 'SPEED_HEART_DEMON',
          multiplier: 0.5,
          expiresAt: new Date(Date.now() + durationMs),
        });
      }
      inventory.markModified('activeBuffs');
    }

    // 1. EXP pill
    if (itemData.subType === ITEM_SUBTYPES.EXP && effects.expAmount && effectiveness > 0) {
      if (cult.breakthroughReadyAt) {
        return res.status(400).json({ message: 'Tu vi đã viên mãn, cắn thuốc lúc này không có tác dụng, hãy đột phá trước!' });
      }
      if (cult.isTraining) {
        cult.expAccumulated = cult.computeCurrentExp(req.user.spiritRootGrade, inventory);
        cult.trainingStartedAt = new Date();
      }
      const actualExp = Math.floor(effects.expAmount * quantity * effectiveness);
      cult.expAccumulated += actualExp;

      const realm = REALMS[cult.realmIndex];
      if (realm && realm.expRequired !== Infinity && cult.expAccumulated >= realm.expRequired) {
        cult.updateLifespan();
        cult.expAccumulated = realm.expRequired;
        cult.breakthroughReadyAt = new Date();
        cult.lastStoppedAt = cult.breakthroughReadyAt;
        if (cult.isTraining) {
          cult.isTraining = false;
          cult.trainingStartedAt = null;
        }
      }
      message += `Nhận được ${actualExp} EXP. `;
    }

    // 2. Lifespan pill
    if (itemData.subType === ITEM_SUBTYPES.LIFESPAN && effects.lifespanAmount) {
      const currentLifespan = cult.computeCurrentLifespan();
      if (currentLifespan <= 0) {
        return res.status(400).json({
          message: '💀 Thọ nguyên đã cạn kiệt! Nhân vật đã tử vong, không thể sử dụng vật phẩm.',
        });
      }
      cult.updateLifespan();
      if (!cult.isTraining) cult.lastStoppedAt = new Date();
      const maxLifespan = REALM_LIFESPAN[cult.realmIndex] === Infinity
        ? PRACTICAL_INFINITY_LIFESPAN
        : REALM_LIFESPAN[cult.realmIndex];
      cult.lifespan = Math.min(cult.lifespan + effects.lifespanAmount * quantity, maxLifespan);
      message += `Tăng thêm ${effects.lifespanAmount * quantity} năm thọ nguyên. `;
    }

    // 3. Speed buff pill
    if (itemData.subType === ITEM_SUBTYPES.SPEED_BUFF && effects.buffType) {
      if (cult.isTraining) {
        cult.expAccumulated = cult.computeCurrentExp(req.user.spiritRootGrade, inventory);
        cult.trainingStartedAt = new Date();
      }
      inventory.cleanExpiredBuffs();
      const durationMs = effects.durationHours * 3600 * 1000 * quantity;
      const existingBuff = inventory.activeBuffs.find(b => b.buffType === effects.buffType);
      if (existingBuff) {
        existingBuff.expiresAt = new Date(Math.max(Date.now(), new Date(existingBuff.expiresAt).getTime()) + durationMs);
        inventory.markModified('activeBuffs');
      } else {
        inventory.activeBuffs.push({
          buffType: effects.buffType,
          multiplier: effects.multiplier,
          expiresAt: new Date(Date.now() + durationMs),
        });
      }
      message += `Tốc độ tu luyện x${effects.multiplier} trong ${effects.durationHours * quantity} giờ. `;
    }

    inventory.items[itemIndex].quantity -= quantity;
    if (inventory.items[itemIndex].quantity <= 0) {
      inventory.items.splice(itemIndex, 1);
    }

    await Inventory.save(inventory);
    await Cultivation.save(cult);

    res.json({ message, inventory: populateInventoryData(inventory) });
  } catch (err) {
    console.error('Lỗi useItem:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const equipItem = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ message: 'Thiếu itemId.' });

    const itemData = ITEMS[itemId];
    if (!itemData || itemData.type !== ITEM_TYPES.ARTIFACT) {
      return res.status(400).json({ message: 'Vật phẩm này không thể trang bị.' });
    }

    const slot = itemData.subType === ITEM_SUBTYPES.WEAPON || itemData.subType === ITEM_SUBTYPES.PROTECTION
      ? 'weapon'
      : itemData.subType === ITEM_SUBTYPES.ARMOR
      ? 'armor'
      : null;

    if (!slot) {
      return res.status(400).json({ message: 'Loại pháp bảo này không có slot trang bị.' });
    }

    const inventory = await getOrCreateInventory(user.id);
    const itemIndex = inventory.items.findIndex(i => i.itemId === itemId);
    if (itemIndex === -1) {
      return res.status(400).json({ message: 'Vật phẩm không có trong túi đồ.' });
    }

    inventory.equipment[slot] = itemId;
    inventory.markModified('equipment');
    await Inventory.save(inventory);

    res.json({
      message: `Trang bị ${itemData.name} vào slot ${slot === 'weapon' ? 'Vũ Khí' : 'Phòng Giáp'} thành công!`,
      inventory: populateInventoryData(inventory),
    });
  } catch (err) {
    console.error('Lỗi equipItem:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const unequipItem = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const { slot } = req.body;
    if (!['weapon', 'armor'].includes(slot)) {
      return res.status(400).json({ message: 'Slot không hợp lệ. Dùng weapon hoặc armor.' });
    }

    const inventory = await getOrCreateInventory(user.id);
    if (!inventory.equipment[slot]) {
      return res.status(400).json({ message: `Slot ${slot} đang trống, không có gì để tháo.` });
    }

    const removedItemId = inventory.equipment[slot];
    const removedItemData = ITEMS[removedItemId];
    inventory.equipment[slot] = null;
    inventory.markModified('equipment');
    await Inventory.save(inventory);

    res.json({
      message: `Đã tháo ${removedItemData?.name || removedItemId} ra khỏi slot ${slot === 'weapon' ? 'Vũ Khí' : 'Phòng Giáp'}.`,
      inventory: populateInventoryData(inventory),
    });
  } catch (err) {
    console.error('Lỗi unequipItem:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const learnTechnique = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ message: 'Thiếu itemId.' });

    const itemData = ITEMS[itemId];
    if (!itemData || itemData.type !== ITEM_TYPES.TECHNIQUE) {
      return res.status(400).json({ message: 'Vật phẩm này không phải công pháp.' });
    }

    const speedBonus = itemData.effects?.speedPassiveBonus;
    if (!speedBonus || speedBonus <= 0) {
      return res.status(400).json({ message: 'Công pháp này không có hiệu ứng hợp lệ.' });
    }

    const inventory = await getOrCreateInventory(user.id);
    const itemIndex = inventory.items.findIndex(i => i.itemId === itemId);
    if (itemIndex === -1 || inventory.items[itemIndex].quantity < 1) {
      return res.status(400).json({ message: 'Không đủ số lượng trong túi đồ.' });
    }

    inventory.items[itemIndex].quantity -= 1;
    if (inventory.items[itemIndex].quantity <= 0) {
      inventory.items.splice(itemIndex, 1);
    }
    inventory.techniquePassiveBonus = (inventory.techniquePassiveBonus || 0) + speedBonus;
    inventory.markModified('items');
    await Inventory.save(inventory);

    res.json({
      message: `Học công pháp ${itemData.name} thành công! Tốc độ tu luyện tăng thêm ${Math.round(speedBonus * 100)}% vĩnh viễn.`,
      inventory: populateInventoryData(inventory),
    });
  } catch (err) {
    console.error('Lỗi learnTechnique:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

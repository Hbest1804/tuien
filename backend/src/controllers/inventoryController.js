import mongoose from 'mongoose';
import Inventory from '../models/Inventory.js';
import Cultivation, { REALMS, REALM_LIFESPAN, PRACTICAL_INFINITY_LIFESPAN } from '../models/Cultivation.js';
import { ITEMS, ITEM_TYPES, ITEM_SUBTYPES } from '../data/items.js';
import { autoStopIfFull } from './cultivationController.js';

// Helper: lấy hoặc tạo Inventory
export const getOrCreateInventory = async (userId) => {
  const existing = await Inventory.findOne({ userId });
  if (existing) return existing;
  return await Inventory.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

// Mở rộng thông tin item khi trả về cho frontend
const populateInventoryData = (inventory) => {
  inventory.cleanExpiredBuffs();
  
  const populatedItems = inventory.items.map(i => {
    const itemData = ITEMS[i.itemId] || { name: 'Vật phẩm không xác định' };
    return {
      itemId: i.itemId,
      quantity: i.quantity,
      ...itemData,
    };
  });

  return {
    maxSlots: inventory.maxSlots,
    equipment: inventory.equipment,
    activeBuffs: inventory.activeBuffs,
    items: populatedItems,
    currentSlots: inventory.items.length,
    speedBuffMultiplier: inventory.getSpeedBuffMultiplier(),
  };
};

export const getInventoryStatus = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const inventory = await getOrCreateInventory(req.user._id);
    const populated = populateInventoryData(inventory);
    if (inventory.isModified()) {
      await inventory.save();
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

    const inventory = await getOrCreateInventory(req.user._id);
    
    const existingItem = inventory.items.find(i => i.itemId === itemId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      if (inventory.items.length >= inventory.maxSlots) {
        return res.status(400).json({ message: 'Túi đồ đã đầy!' });
      }
      inventory.items.push({ itemId, quantity });
    }

    await inventory.save();

    res.json({ 
      message: `Đã thêm ${quantity} ${ITEMS[itemId].name} vào túi đồ.`,
      inventory: populateInventoryData(inventory)
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

    // Đảm bảo túi đồ tồn tại trước khi vào transaction
    await getOrCreateInventory(req.user._id);

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const inventory = await Inventory.findOne({ userId: req.user._id }).session(session);
      if (!inventory) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Không tìm thấy túi đồ.' });
      }

      const itemIndex = inventory.items.findIndex(i => i.itemId === itemId);
      if (itemIndex === -1 || inventory.items[itemIndex].quantity < quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Không đủ số lượng vật phẩm trong túi.' });
      }

      let cult = await Cultivation.findOne({ userId: req.user._id }).session(session);
      if (!cult) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Không tìm thấy dữ liệu tu luyện.' });
      }

      // Tự động dừng tu luyện nếu EXP đã đầy trước khi sử dụng vật phẩm
      cult = await autoStopIfFull(cult, req.user.spiritRootGrade, inventory, session);

    const effects = itemData.effects;
    let message = `Sử dụng ${quantity} ${itemData.name} thành công. `;

    // Tính toán tỷ lệ hiệu quả (Kháng thuốc theo cảnh giới)
    let effectiveness = 1.0;
    if (itemData.targetRealmIndex !== undefined && itemData.targetRealmIndex !== 99) {
      const realmDiff = cult.realmIndex - itemData.targetRealmIndex;
      if (realmDiff === 1) effectiveness = 0.5; // Kém 1 cảnh giới: giảm 50%
      else if (realmDiff === 2) effectiveness = 0.1; // Kém 2 cảnh giới: còn 10%
      else if (realmDiff >= 3) effectiveness = 0; // Vô tác dụng
    }

    if (effectiveness === 0) {
      message = `Sử dụng ${quantity} ${itemData.name}. Tu vi của bạn quá cao, loại đan dược này hoàn toàn không còn tác dụng! `;
    } else if (effectiveness < 1.0) {
      message += `Do chênh lệch cảnh giới, hiệu lực đan dược bị giảm còn ${effectiveness * 100}%. `;
    }

    // 1. Tác dụng: Cộng EXP
    if (itemData.subType === ITEM_SUBTYPES.EXP && effects.expAmount && effectiveness > 0) {
      if (cult.breakthroughReadyAt) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Tu vi đã viên mãn, cắn thuốc lúc này không có tác dụng, hãy đột phá trước!' });
      }
      
      // Dừng tu luyện hiện tại để flush exp
      if (cult.isTraining) {
        cult.expAccumulated = cult.computeCurrentExp(req.user.spiritRootGrade, inventory);
        cult.trainingStartedAt = new Date(); // reset start time
      }
      
      const actualExp = Math.floor(effects.expAmount * quantity * effectiveness);
      cult.expAccumulated += actualExp;

      // Xử lý tràn EXP
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

    // 2. Tác dụng: Tăng thọ nguyên
    if (itemData.subType === ITEM_SUBTYPES.LIFESPAN && effects.lifespanAmount) {
      const currentLifespan = cult.computeCurrentLifespan();
      if (currentLifespan <= 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: '💀 Thọ nguyên đã cạn kiệt! Nhân vật đã tử vong, không thể sử dụng vật phẩm.',
        });
      }

      cult.updateLifespan();
      if (!cult.isTraining) {
        cult.lastStoppedAt = new Date();
      }
      const maxLifespan = REALM_LIFESPAN[cult.realmIndex] === Infinity ? PRACTICAL_INFINITY_LIFESPAN : REALM_LIFESPAN[cult.realmIndex];
      cult.lifespan = Math.min(cult.lifespan + effects.lifespanAmount * quantity, maxLifespan);
      message += `Tăng thêm ${effects.lifespanAmount * quantity} năm thọ nguyên. `;
    }

    // 3. Tác dụng: Buff tốc độ tu luyện
    if (itemData.subType === ITEM_SUBTYPES.SPEED_BUFF && effects.buffType) {
      // Tính toán lại EXP hiện tại trước khi thay đổi tốc độ
      if (cult.isTraining) {
        cult.expAccumulated = cult.computeCurrentExp(req.user.spiritRootGrade, inventory);
        cult.trainingStartedAt = new Date();
      }
      inventory.cleanExpiredBuffs();

      const durationMs = effects.durationHours * 3600 * 1000 * quantity;
      
      // Xóa buff cũ nếu trùng buffType, thay bằng buff mới hoặc cộng dồn thời gian (ở đây ta gia hạn thời gian)
      const existingBuff = inventory.activeBuffs.find(b => b.buffType === effects.buffType);
      if (existingBuff) {
        existingBuff.expiresAt = new Date(Math.max(Date.now(), existingBuff.expiresAt.getTime()) + durationMs);
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

    // Trừ vật phẩm trong túi trước để tránh lỗi trùng lặp (duplication exploit) nếu lưu cultivation thành công nhưng lưu inventory thất bại
    inventory.items[itemIndex].quantity -= quantity;
    if (inventory.items[itemIndex].quantity <= 0) {
      inventory.items.splice(itemIndex, 1);
    }
    
    await inventory.save({ session });
    await cult.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.json({ message, inventory: populateInventoryData(inventory) });
  } catch (saveErr) {
    await session.abortTransaction();
    session.endSession();
    if (saveErr.name === 'VersionError') {
      return res.status(409).json({ message: 'Dữ liệu thay đổi trong lúc xử lý, vui lòng thử lại.' });
    }
    throw saveErr; // chuyển ra catch ngoài cùng
  }
  } catch (err) {
    console.error('Lỗi useItem:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

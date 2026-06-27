import mongoose from 'mongoose';
import Inventory from '../models/Inventory.js';
import { ITEMS, ITEM_SUBTYPES } from '../data/items.js';
import Cultivation, {
  REALMS,
  SPIRIT_ROOT_MULTIPLIER,
  BASE_SPEED,
  SECONDS_PER_YEAR,
  REALM_LIFESPAN,
  LIFESPAN_DRAIN_PER_YEAR,
  PRACTICAL_INFINITY_LIFESPAN,
} from '../models/Cultivation.js';

// ─── Helper: lấy hoặc tạo cultivation record ──────────────────────────────────
const getOrCreateCultivation = async (userId) => {
  const existing = await Cultivation.findOne({ userId });
  if (existing) return existing;
  return await Cultivation.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

// ─── Helper: chuẩn hóa trạng thái trả về client ─────────────────────────────
const formatCultivation = (cult, spiritRootGrade, inventory, speedMultiplier) => {
  const currentExp = cult.computeCurrentExp(spiritRootGrade, inventory);
  const speed = cult.computeSpeed(spiritRootGrade, speedMultiplier);
  const realm = REALMS[cult.realmIndex] || REALMS[0];
  const nextRealm = REALMS[cult.realmIndex + 1] || null;

  // Tính progress trong cảnh giới hiện tại
  const progress = realm.expRequired === Infinity
    ? 0
    : Math.min(currentExp / realm.expRequired, 1);

  // Tính tầng hiện tại (0–3) dựa vào % EXP trong cảnh giới
  const stages = realm.stages || ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Đại Viên Mãn'];
  const stageIndex = realm.expRequired === Infinity
    ? stages.length - 1
    : Math.min(Math.floor(progress * stages.length), stages.length - 1);
  const stageName = stages[stageIndex];

  // Thọ nguyên
  const isBreakthroughReady = !!cult.breakthroughReadyAt;
  const yearsWaiting = cult.breakthroughReadyAt ? Math.max(0, (Date.now() - cult.breakthroughReadyAt.getTime()) / 1000 / SECONDS_PER_YEAR) : 0;
  const rawLifespanMax = REALM_LIFESPAN[cult.realmIndex] ?? 100;
  const lifespanMax = rawLifespanMax === Infinity ? null : rawLifespanMax;
  const currentLifespan = cult.computeCurrentLifespan();

  return {
    isTraining: cult.isTraining,
    trainingStartedAt: cult.trainingStartedAt,
    expAccumulated: cult.expAccumulated,
    currentExp,                        // tổng EXP thực tế (bao gồm offline)
    speed,                             // EXP/giây
    realmIndex: cult.realmIndex,
    realmName: realm.name,
    realmColor: realm.color,
    realmExpRequired: realm.expRequired,
    realmStages: stages,               // ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Đại Viên Mãn']
    stageIndex,                        // tầng hiện tại (0–3)
    stageName,                         // tên tầng hiện tại
    nextRealmName: nextRealm?.name || null,
    progress,                          // 0 → 1
    sectName: cult.sectName,
    sectJoinedAt: cult.sectJoinedAt,
    isSectMember: !!cult.sectName,
    // bonus info
    baseSpeed: cult.sectName ? BASE_SPEED['宗门'] : BASE_SPEED['散修'],
    spiritRootMultiplier: SPIRIT_ROOT_MULTIPLIER[spiritRootGrade] || 1.0,
    inventorySpeedMultiplier: speedMultiplier,
    // breakthrough & lifespan
    isBreakthroughReady,
    breakthroughReadyAt: cult.breakthroughReadyAt,
    yearsWaiting,
    lifespan: currentLifespan,
    lifespanMax,
    createdAt: cult.createdAt,
    lastStoppedAt: cult.lastStoppedAt,
  };
};

// ─── Helper: auto-stop training khi EXP đã đầy ───────────────────────────────
export const autoStopIfFull = async (cult, spiritRootGrade, inventory, session = null) => {
  if (!cult.isTraining) return cult;

  const realm = REALMS[cult.realmIndex];
  if (!realm || realm.expRequired === Infinity) return cult;

  const currentExp = cult.computeCurrentExp(spiritRootGrade, inventory);
  if (currentExp < realm.expRequired) return cult;

  // EXP đã đầy → tự động dừng và bắt đầu đếm thọ nguyên
  cult.calculateAndSetBreakthroughReadyAt(spiritRootGrade, realm, inventory ? inventory.getSpeedBuffMultiplier() : 1.0);
  
  cult.updateLifespan();
  cult.expAccumulated = realm.expRequired;
  cult.isTraining = false;
  cult.trainingStartedAt = null;
  // lastStoppedAt sẽ được set sau khi updateLifespan nếu isTraining=false:
  cult.lastStoppedAt = cult.breakthroughReadyAt; // cho chuẩn thời gian bắt đầu ngưng
  try {
    await cult.save({ session: session || undefined });
    return cult;
  } catch (err) {
    if (err.name === 'VersionError') {
      let query = Cultivation.findById(cult._id);
      if (session) query = query.session(session);
      const updated = await query;
      if (updated) {
        return await autoStopIfFull(updated, spiritRootGrade, inventory, session);
      }
      return cult;
    }
    throw err;
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/cultivation/status
// ──────────────────────────────────────────────────────────────────────────────
export const getStatus = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const inventory = await Inventory.findOne({ userId: req.user._id });
    let cult = await getOrCreateCultivation(req.user._id);

    // Auto-stop nếu EXP đã đầy
    cult = await autoStopIfFull(cult, user.spiritRootGrade, inventory);

    const speedMultiplier = inventory ? inventory.getSpeedBuffMultiplier() : 1.0;

    res.json({ cultivation: formatCultivation(cult, user.spiritRootGrade, inventory, speedMultiplier) });
  } catch (err) {
    console.error('Lỗi server:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/cultivation/start
// ──────────────────────────────────────────────────────────────────────────────
export const startTraining = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const cult = await getOrCreateCultivation(req.user._id);
    if (cult.isTraining) {
      return res.status(400).json({ message: 'Đang tu luyện rồi' });
    }

    // Không thể tu luyện khi EXP đã đầy (chờ đột phá)
    if (cult.breakthroughReadyAt) {
      return res.status(400).json({
        message: '⚠️ Tu vi đã viên mãn! Hãy đột phá lên cảnh giới tiếp theo trước khi tiếp tục tu luyện.',
      });
    }

    const inventory = await Inventory.findOne({ userId: req.user._id });
    const speedMultiplier = inventory ? inventory.getSpeedBuffMultiplier() : 1.0;

    cult.updateLifespan();
    if (cult.lifespan <= 0) {
      cult.expAccumulated = 0;
      const rawLifespan = REALM_LIFESPAN[cult.realmIndex] ?? 100;
      cult.lifespan = rawLifespan === Infinity ? PRACTICAL_INFINITY_LIFESPAN : rawLifespan;
      cult.breakthroughReadyAt = null;
      cult.lastStoppedAt = new Date();
      await cult.save();
      return res.status(400).json({
        message: '💀 Thọ nguyên cạn kiệt! Tinh khí tán tận — phải tu luyện lại từ đầu trong cảnh giới này.',
        cultivation: formatCultivation(cult, user.spiritRootGrade, inventory, speedMultiplier),
      });
    }

    cult.isTraining = true;
    cult.trainingStartedAt = new Date();
    cult.lastStoppedAt = null;
    await cult.save();
    if (inventory && inventory.isModified()) await inventory.save();

    res.json({
      message: '⚡ Bắt đầu tu luyện! Linh khí đang chảy vào thể phách...',
      cultivation: formatCultivation(cult, user.spiritRootGrade, inventory, speedMultiplier),
    });
  } catch (err) {
    console.error('Lỗi server:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/cultivation/stop
// ──────────────────────────────────────────────────────────────────────────────
export const stopTraining = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const inventory = await Inventory.findOne({ userId: req.user._id });
    const cult = await getOrCreateCultivation(req.user._id);

    if (!cult.isTraining) {
      return res.status(400).json({ message: 'Chưa bắt đầu tu luyện' });
    }

    // Flush EXP tích lũy vào DB bằng inventory trước khi xóa buff cũ
    const currentExp = cult.computeCurrentExp(user.spiritRootGrade, inventory);
    const gained = currentExp - cult.expAccumulated;
    
    const speedMultiplier = inventory ? inventory.getSpeedBuffMultiplier() : 1.0;

    const realm = REALMS[cult.realmIndex];
    if (realm && realm.expRequired !== Infinity && currentExp >= realm.expRequired) {
      cult.calculateAndSetBreakthroughReadyAt(user.spiritRootGrade, realm, speedMultiplier);
    }

    cult.updateLifespan();
    cult.expAccumulated = currentExp;
    cult.isTraining = false;
    cult.trainingStartedAt = null;
    cult.lastStoppedAt = cult.breakthroughReadyAt || new Date();

    await cult.save();
    if (inventory && inventory.isModified()) await inventory.save();

    res.json({
      message: '🧘 Ngưng tu luyện. Linh khí được cất giữ trong đan điền.',
      gained: Math.floor(gained),
      cultivation: formatCultivation(cult, user.spiritRootGrade, inventory, speedMultiplier),
    });
  } catch (err) {
    console.error('Lỗi server:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/cultivation/breakthrough
// ──────────────────────────────────────────────────────────────────────────────
export const breakthrough = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const { itemsUsed = [] } = req.body; // [{ itemId, quantity }]

    let inventory = await Inventory.findOne({ userId: req.user._id }).session(session);
    if (!inventory) {
      inventory = new Inventory({ userId: req.user._id });
    }
    let cult = await Cultivation.findOne({ userId: req.user._id }).session(session);
    if (!cult) {
      await getOrCreateCultivation(req.user._id);
      cult = await Cultivation.findOne({ userId: req.user._id }).session(session);
    }

    cult = await autoStopIfFull(cult, user.spiritRootGrade, inventory, session);
    const speedMultiplier = inventory ? inventory.getSpeedBuffMultiplier() : 1.0;

    if (cult.realmIndex >= REALMS.length - 1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Đã đạt cảnh giới tối thượng!' });
    }

    const currentRealm = REALMS[cult.realmIndex];
    if (cult.expAccumulated < currentRealm.expRequired) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: `Linh khí chưa đủ để đột phá! Cần ${currentRealm.expRequired - Math.floor(cult.expAccumulated)} EXP nữa.`,
      });
    }

    const currentLifespan = cult.computeCurrentLifespan();
    if (currentLifespan <= 0) {
      cult.expAccumulated = 0;
      const rawLifespan = REALM_LIFESPAN[cult.realmIndex] ?? 100;
      cult.lifespan = rawLifespan === Infinity ? PRACTICAL_INFINITY_LIFESPAN : rawLifespan;
      cult.breakthroughReadyAt = null;
      cult.lastStoppedAt = new Date();
      await cult.save({ session });
      await session.commitTransaction();
      session.endSession();
      return res.status(400).json({
        message: '💀 Thọ nguyên cạn kiệt! Tinh khí tán tận — phải tu luyện lại từ đầu trong cảnh giới này.',
      });
    }

    cult.updateLifespan();

    // ─── TÍNH TOÁN VẬT PHẨM HỖ TRỢ ───────────────────────────────────────────
    let bonusSuccessRate = 0;
    let totalDefense = 0;
    
    // Gom nhóm và xác thực itemsUsed
    const itemCounts = {};
    for (const item of itemsUsed) {
      if (!item || typeof item !== 'object' || !item.itemId || typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Danh sách vật phẩm sử dụng không hợp lệ.' });
      }
      itemCounts[item.itemId] = (itemCounts[item.itemId] || 0) + item.quantity;
    }

    for (const [itemId, quantity] of Object.entries(itemCounts)) {
      const itemData = ITEMS[itemId];
      if (!itemData) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Vật phẩm ${itemId} không tồn tại.` });
      }
      if (itemData.subType !== ITEM_SUBTYPES.BREAKTHROUGH && itemData.subType !== ITEM_SUBTYPES.PROTECTION) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Vật phẩm ${itemData.name || itemId} không thể sử dụng để đột phá.` });
      }

      const idx = inventory.items.findIndex(i => i.itemId === itemId);
      if (idx === -1 || inventory.items[idx].quantity < quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Không đủ số lượng vật phẩm ${itemData.name || itemId} trong túi đồ.` });
      }
      if (itemData.subType === ITEM_SUBTYPES.BREAKTHROUGH && itemData.effects?.successRateBonus) {
        bonusSuccessRate += itemData.effects.successRateBonus * quantity;
      }
      if (itemData.subType === ITEM_SUBTYPES.PROTECTION && itemData.effects?.tribulationDefense) {
        totalDefense += itemData.effects.tribulationDefense * quantity;
      }

      inventory.items[idx].quantity -= quantity;
      if (inventory.items[idx].quantity <= 0) {
        inventory.items.splice(idx, 1);
      }
    }

    const finalSuccessRate = Math.min(1.0, (currentRealm.successRate || 1.0) + bonusSuccessRate);
    const tribulationDamage = currentRealm.tribulationDamage || 0;

    let message = '';
    let success = true;

    // ─── KIỂM TRA LÔI KIẾP ──────────────────────────────────────────────────
    if (tribulationDamage > 0) {
      if (totalDefense < tribulationDamage) {
        success = false;
        const dmgTaken = tribulationDamage - totalDefense;
        message = `🌩️ Lôi Kiếp Giáng Lâm! Bạn chịu ${dmgTaken} sát thương sét đánh, tổn thương căn cơ nặng nề. Tu vi rớt thẳng về Sơ Kỳ, mất 10 năm thọ nguyên! `;
        cult.expAccumulated = 0;
        cult.lifespan = Math.max(0, cult.lifespan - 10);
      } else {
        message = `🛡️ Đã dùng Pháp bảo cản phá thành công ${tribulationDamage} sát thương Lôi Kiếp! `;
      }
    }

    // ─── KIỂM TRA TỶ LỆ THÀNH CÔNG ──────────────────────────────────────────
    if (success) {
      const roll = Math.random();
      if (roll > finalSuccessRate) {
        success = false;
        const stageExp = currentRealm.expRequired / (currentRealm.stages?.length || 36);
        cult.expAccumulated = Math.max(0, cult.expAccumulated - stageExp);
        message += `❌ Đột phá thất bại (Tỷ lệ: ${Math.round(finalSuccessRate * 100)}%). Bị giáng 1 cảnh giới nhỏ! `;
      }
    }

    if (success) {
      cult.expAccumulated -= currentRealm.expRequired;
      cult.realmIndex += 1;
      cult.failedBreakthroughs = 0;
      
      const newLifespanMax = REALM_LIFESPAN[cult.realmIndex] ?? 100;
      cult.lifespan = newLifespanMax === Infinity ? PRACTICAL_INFINITY_LIFESPAN : newLifespanMax;
      
      const newRealm = REALMS[cult.realmIndex];
      message += `🌟 Đột phá thành công lên [${newRealm.name}]! Thọ nguyên phục hồi về ${newLifespanMax === Infinity ? '∞' : newLifespanMax} năm.`;
    } else {
      cult.failedBreakthroughs = (cult.failedBreakthroughs || 0) + 1;
      // Kích hoạt Tâm Ma
      if (cult.failedBreakthroughs >= 3) {
        message += `💀 Cảnh báo: Tẩu hỏa nhập ma do thất bại 3 lần liên tiếp! Tốc độ tu luyện giảm 50% trong 24h.`;
        const durationMs = 24 * 3600 * 1000;
        const existingHeartDemon = inventory.activeBuffs.find(b => b.buffType === 'SPEED_HEART_DEMON');
        if (existingHeartDemon) {
          existingHeartDemon.expiresAt = new Date(Math.max(Date.now(), existingHeartDemon.expiresAt.getTime()) + durationMs);
        } else {
          inventory.activeBuffs.push({
            buffType: 'SPEED_HEART_DEMON',
            multiplier: 0.5,
            expiresAt: new Date(Date.now() + durationMs),
          });
        }
        inventory.markModified('activeBuffs');
      }
    }

    cult.breakthroughReadyAt = null;
    cult.lastStoppedAt = cult.isTraining ? null : new Date();

    await cult.save({ session });
    await inventory.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.json({
      message,
      success,
      cultivation: formatCultivation(cult, user.spiritRootGrade, inventory, speedMultiplier),
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    if (err.name === 'VersionError') {
      return res.status(409).json({ message: 'Dữ liệu thay đổi trong lúc xử lý, vui lòng thử lại.' });
    }
    console.error('Lỗi server breakthrough:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/cultivation/join-sect
// ──────────────────────────────────────────────────────────────────────────────
export const joinSect = async (req, res) => {
  try {
    const { sectName } = req.body;
    if (!sectName || typeof sectName !== 'string' || sectName.trim().length < 2 || sectName.trim().length > 30) {
      return res.status(400).json({ message: 'Tên tông môn không hợp lệ (từ 2 đến 30 ký tự)' });
    }

    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const inventory = await Inventory.findOne({ userId: req.user._id });
    let cult = await getOrCreateCultivation(req.user._id);

    if (cult.sectName) {
      return res.status(400).json({
        message: `Ngươi đã là đệ tử của ${cult.sectName}. Hãy rời tông môn trước!`,
      });
    }

    cult = await autoStopIfFull(cult, user.spiritRootGrade, inventory);
    if (cult.isTraining) {
      cult.expAccumulated = cult.computeCurrentExp(user.spiritRootGrade, inventory);
      cult.trainingStartedAt = new Date();
    }

    cult.sectName = sectName.trim();
    cult.sectJoinedAt = new Date();
    await cult.save();
    
    const speedMultiplier = inventory ? inventory.getSpeedBuffMultiplier() : 1.0;
    if (inventory && inventory.isModified()) await inventory.save();

    const newSpeed = cult.computeSpeed(user.spiritRootGrade, speedMultiplier);
    res.json({
      message: `🏯 Gia nhập ${cult.sectName} thành công! Tốc độ tu luyện tăng lên ${newSpeed.toFixed(3)} EXP/giây!`,
      cultivation: formatCultivation(cult, user.spiritRootGrade, inventory, speedMultiplier),
    });
  } catch (err) {
    console.error('Lỗi server:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/cultivation/leave-sect
// ──────────────────────────────────────────────────────────────────────────────
export const leaveSect = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }
    const inventory = await Inventory.findOne({ userId: req.user._id });
    let cult = await getOrCreateCultivation(req.user._id);

    if (!cult.sectName) {
      return res.status(400).json({ message: 'Ngươi không thuộc tông môn nào' });
    }

    const oldSect = cult.sectName;

    cult = await autoStopIfFull(cult, user.spiritRootGrade, inventory);
    if (cult.isTraining) {
      cult.expAccumulated = cult.computeCurrentExp(user.spiritRootGrade, inventory);
      cult.trainingStartedAt = new Date();
    }

    cult.sectName = null;
    cult.sectJoinedAt = null;
    await cult.save();

    const speedMultiplier = inventory ? inventory.getSpeedBuffMultiplier() : 1.0;
    if (inventory) await inventory.save();

    const newSpeed = cult.computeSpeed(user.spiritRootGrade, speedMultiplier);
    res.json({
      message: `💨 Đã rời ${oldSect}. Tốc độ tu luyện giảm xuống ${newSpeed.toFixed(3)} EXP/giây.`,
      cultivation: formatCultivation(cult, user.spiritRootGrade, inventory, speedMultiplier),
    });
  } catch (err) {
    console.error('Lỗi server:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

import Cultivation, { REALMS, SPIRIT_ROOT_MULTIPLIER, BASE_SPEED } from '../models/Cultivation.js';
import User from '../models/User.js';

// ─── Helper: lấy hoặc tạo cultivation record ──────────────────────────────────
const getOrCreateCultivation = async (userId) => {
  return await Cultivation.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

// ─── Helper: chuẩn hóa trạng thái trả về client ─────────────────────────────
const formatCultivation = (cult, spiritRootGrade) => {
  const currentExp = cult.computeCurrentExp(spiritRootGrade);
  const speed = cult.computeSpeed(spiritRootGrade);
  const realm = REALMS[cult.realmIndex] || REALMS[0];
  const nextRealm = REALMS[cult.realmIndex + 1] || null;

  // Tính progress trong cảnh giới hiện tại
  const progress = realm.expRequired === Infinity
    ? 1
    : Math.min(currentExp / realm.expRequired, 1);

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
    nextRealmName: nextRealm?.name || null,
    progress,                          // 0 → 1
    sectName: cult.sectName,
    sectJoinedAt: cult.sectJoinedAt,
    isSectMember: !!cult.sectName,
    // bonus info
    baseSpeed: cult.sectName ? BASE_SPEED['宗门'] : BASE_SPEED['散修'],
    spiritRootMultiplier: SPIRIT_ROOT_MULTIPLIER[spiritRootGrade] || 1.0,
  };
};

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/cultivation/status
// ──────────────────────────────────────────────────────────────────────────────
export const getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const cult = await getOrCreateCultivation(req.user._id);
    res.json({ cultivation: formatCultivation(cult, user.spiritRootGrade) });
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
    const user = await User.findById(req.user._id);
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const cult = await getOrCreateCultivation(req.user._id);

    if (cult.isTraining) {
      return res.status(400).json({ message: 'Đang tu luyện rồi' });
    }

    cult.isTraining = true;
    cult.trainingStartedAt = new Date();
    await cult.save();

    res.json({
      message: '⚡ Bắt đầu tu luyện! Linh khí đang chảy vào thể phách...',
      cultivation: formatCultivation(cult, user.spiritRootGrade),
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
    const user = await User.findById(req.user._id);
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const cult = await getOrCreateCultivation(req.user._id);

    if (!cult.isTraining) {
      return res.status(400).json({ message: 'Chưa bắt đầu tu luyện' });
    }

    // Flush EXP tích lũy vào DB
    const gained = cult.computeCurrentExp(user.spiritRootGrade) - cult.expAccumulated;
    cult.expAccumulated += gained;
    cult.isTraining = false;
    cult.trainingStartedAt = null;
    await cult.save();

    res.json({
      message: '🧘 Ngưng tu luyện. Linh khí được cất giữ trong đan điền.',
      gained: Math.floor(gained),
      cultivation: formatCultivation(cult, user.spiritRootGrade),
    });
  } catch (err) {
    console.error('Lỗi server:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/cultivation/breakthrough
// Đột phá cảnh giới (khi đủ EXP)
// ──────────────────────────────────────────────────────────────────────────────
export const breakthrough = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const cult = await getOrCreateCultivation(req.user._id);

    if (cult.realmIndex >= REALMS.length - 1) {
      return res.status(400).json({ message: 'Đã đạt cảnh giới tối thượng!' });
    }

    // Cộng EXP offline trước khi đột phá
    if (cult.isTraining) {
      const gained = cult.computeCurrentExp(user.spiritRootGrade) - cult.expAccumulated;
      cult.expAccumulated += gained;
      cult.trainingStartedAt = new Date(); // reset timer
    }

    const currentRealm = REALMS[cult.realmIndex];
    if (cult.expAccumulated < currentRealm.expRequired) {
      return res.status(400).json({
        message: `Linh khí chưa đủ để đột phá! Cần ${currentRealm.expRequired - Math.floor(cult.expAccumulated)} EXP nữa.`,
      });
    }

    // Trừ EXP và lên cảnh giới
    cult.expAccumulated -= currentRealm.expRequired;
    cult.realmIndex += 1;
    await cult.save();

    const newRealm = REALMS[cult.realmIndex];
    res.json({
      message: `🌟 Đột phá thành công! Bước vào cảnh giới ${newRealm.name}!`,
      cultivation: formatCultivation(cult, user.spiritRootGrade),
    });
  } catch (err) {
    console.error('Lỗi server:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/cultivation/join-sect
// Gia nhập tông môn
// ──────────────────────────────────────────────────────────────────────────────
export const joinSect = async (req, res) => {
  try {
    const { sectName } = req.body;
    if (!sectName || typeof sectName !== 'string' || sectName.trim().length < 2 || sectName.trim().length > 30) {
      return res.status(400).json({ message: 'Tên tông môn không hợp lệ (từ 2 đến 30 ký tự)' });
    }

    const user = await User.findById(req.user._id);
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const cult = await getOrCreateCultivation(req.user._id);

    if (cult.sectName) {
      return res.status(400).json({
        message: `Ngươi đã là đệ tử của ${cult.sectName}. Hãy rời tông môn trước!`,
      });
    }

    // Flush EXP nếu đang train
    if (cult.isTraining) {
      const gained = cult.computeCurrentExp(user.spiritRootGrade) - cult.expAccumulated;
      cult.expAccumulated += gained;
      cult.trainingStartedAt = new Date();
    }

    cult.sectName = sectName.trim();
    cult.sectJoinedAt = new Date();
    await cult.save();

    const newSpeed = cult.computeSpeed(user.spiritRootGrade);
    res.json({
      message: `🏯 Gia nhập ${cult.sectName} thành công! Tốc độ tu luyện tăng lên ${newSpeed.toFixed(3)} EXP/giây!`,
      cultivation: formatCultivation(cult, user.spiritRootGrade),
    });
  } catch (err) {
    console.error('Lỗi server:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/cultivation/leave-sect
// Rời tông môn
// ──────────────────────────────────────────────────────────────────────────────
export const leaveSect = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }
    const cult = await getOrCreateCultivation(req.user._id);

    if (!cult.sectName) {
      return res.status(400).json({ message: 'Ngươi không thuộc tông môn nào' });
    }

    const oldSect = cult.sectName;

    // Flush EXP nếu đang train
    if (cult.isTraining) {
      const gained = cult.computeCurrentExp(user.spiritRootGrade) - cult.expAccumulated;
      cult.expAccumulated += gained;
      cult.trainingStartedAt = new Date();
    }

    cult.sectName = null;
    cult.sectJoinedAt = null;
    await cult.save();

    const newSpeed = cult.computeSpeed(user.spiritRootGrade);
    res.json({
      message: `💨 Rời khỏi ${oldSect}. Giờ là tán tu, tốc độ giảm còn ${newSpeed.toFixed(3)} EXP/giây.`,
      cultivation: formatCultivation(cult, user.spiritRootGrade),
    });
  } catch (err) {
    console.error('Lỗi server:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

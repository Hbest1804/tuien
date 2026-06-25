import Cultivation, {
  REALMS,
  SPIRIT_ROOT_MULTIPLIER,
  BASE_SPEED,
  SECONDS_PER_YEAR,
  REALM_LIFESPAN,
  LIFESPAN_DRAIN_PER_YEAR,
} from '../models/Cultivation.js';

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

  // Tính tầng hiện tại (0–3) dựa vào % EXP trong cảnh giới
  const stages = realm.stages || ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Đại Viên Mãn'];
  const stageIndex = realm.expRequired === Infinity
    ? stages.length - 1
    : Math.min(Math.floor(progress * stages.length), stages.length - 1);
  const stageName = stages[stageIndex];

  // Thọ nguyên
  const isBreakthroughReady = !!cult.breakthroughReadyAt;
  const yearsWaiting = cult.breakthroughReadyAt ? (Date.now() - cult.breakthroughReadyAt.getTime()) / 1000 / SECONDS_PER_YEAR : 0;
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
const autoStopIfFull = async (cult, spiritRootGrade) => {
  if (!cult.isTraining) return false;

  const realm = REALMS[cult.realmIndex];
  if (!realm || realm.expRequired === Infinity) return false;

  const currentExp = cult.computeCurrentExp(spiritRootGrade);
  if (currentExp < realm.expRequired) return false;

  // EXP đã đầy → tự động dừng và bắt đầu đếm thọ nguyên
  if (!cult.breakthroughReadyAt) {
    const speed = cult.computeSpeed(spiritRootGrade);
    const expNeeded = Math.max(0, realm.expRequired - cult.expAccumulated);
    const secondsToMax = speed > 0 ? expNeeded / speed : 0;
    const startTime = cult.trainingStartedAt ? cult.trainingStartedAt.getTime() : Date.now();
    cult.breakthroughReadyAt = new Date(startTime + secondsToMax * 1000);
  }
  
  cult.flushLifespan();
  cult.expAccumulated = realm.expRequired;
  cult.isTraining = false;
  cult.trainingStartedAt = null;
  // lastStoppedAt sẽ được set bên trong flushLifespan nếu isTraining=false,
  // nhưng ta gọi flushLifespan TRƯỚC khi set isTraining=false. Vậy phải gọi lại:
  cult.lastStoppedAt = cult.breakthroughReadyAt; // cho chuẩn thời gian bắt đầu ngưng
  await cult.save();
  return true;
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

    const cult = await getOrCreateCultivation(req.user._id);

    // Auto-stop nếu EXP đã đầy
    await autoStopIfFull(cult, user.spiritRootGrade);

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

    cult.flushLifespan();
    cult.isTraining = true;
    cult.trainingStartedAt = new Date();
    cult.lastStoppedAt = null;
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
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const cult = await getOrCreateCultivation(req.user._id);

    if (!cult.isTraining) {
      return res.status(400).json({ message: 'Chưa bắt đầu tu luyện' });
    }

    // Flush EXP tích lũy vào DB
    const currentExp = cult.computeCurrentExp(user.spiritRootGrade);
    const gained = currentExp - cult.expAccumulated;
    // Kiểm tra nếu EXP đã đầy thì bắt đầu đếm thời gian chờ từ thời điểm đạt mốc
    const realm = REALMS[cult.realmIndex];
    if (realm && realm.expRequired !== Infinity && currentExp >= realm.expRequired) {
      if (!cult.breakthroughReadyAt) {
        const speed = cult.computeSpeed(user.spiritRootGrade);
        const expNeeded = Math.max(0, realm.expRequired - cult.expAccumulated);
        const secondsToMax = speed > 0 ? expNeeded / speed : 0;
        const startTime = cult.trainingStartedAt ? cult.trainingStartedAt.getTime() : Date.now();
        cult.breakthroughReadyAt = new Date(startTime + secondsToMax * 1000);
      }
    }

    cult.flushLifespan();
    cult.expAccumulated = currentExp;
    cult.isTraining = false;
    cult.trainingStartedAt = null;
    cult.lastStoppedAt = new Date();

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
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const cult = await getOrCreateCultivation(req.user._id);

    // Auto-stop if EXP is full to correctly calculate breakthroughReadyAt and lifespan drain
    await autoStopIfFull(cult, user.spiritRootGrade);

    if (cult.realmIndex >= REALMS.length - 1) {
      return res.status(400).json({ message: 'Đã đạt cảnh giới tối thượng!' });
    }

    // Cộng EXP offline trước khi đột phá
    if (cult.isTraining) {
      cult.expAccumulated = cult.computeCurrentExp(user.spiritRootGrade);
      cult.trainingStartedAt = new Date(); // reset timer
    }

    const currentRealm = REALMS[cult.realmIndex];
    if (cult.expAccumulated < currentRealm.expRequired) {
      return res.status(400).json({
        message: `Linh khí chưa đủ để đột phá! Cần ${currentRealm.expRequired - Math.floor(cult.expAccumulated)} EXP nữa.`,
      });
    }

    // ── Xử lý thọ nguyên hao mòn trước khi đột phá ──
    const currentLifespan = cult.computeCurrentLifespan();
    if (currentLifespan <= 0) {
      // Tinh khí tán tận — thọ nguyên cạn kiệt, phải tu luyện lại từ đầu
      cult.expAccumulated = 0;
      cult.lifespan = REALM_LIFESPAN[cult.realmIndex] ?? 100;
      cult.breakthroughReadyAt = null;
      await cult.save();
      return res.status(400).json({
        message: '💀 Thọ nguyên cạn kiệt! Tinh khí tán tận — phải tu luyện lại từ đầu trong cảnh giới này.',
      });
    }

    // Flush thọ nguyên hao mòn vào DB
    cult.flushLifespan();
    cult.lifespan = Math.round(cult.lifespan * 100) / 100;

    // Trừ EXP, lên cảnh giới, reset thọ nguyên theo cảnh giới mới
    cult.expAccumulated -= currentRealm.expRequired;
    cult.realmIndex += 1;
    cult.breakthroughReadyAt = null;

    // Reset thọ nguyên về mức tối đa của cảnh giới mới
    const newLifespanMax = REALM_LIFESPAN[cult.realmIndex] ?? 100;
    cult.lifespan = newLifespanMax === Infinity ? 9999999 : newLifespanMax;
    cult.lastStoppedAt = cult.isTraining ? null : new Date();

    await cult.save();

    const newRealm = REALMS[cult.realmIndex];
    res.json({
      message: `🌟 Đột phá thành công! Bước vào cảnh giới ${newRealm.name}! Thọ nguyên phục hồi về ${newLifespanMax === Infinity ? '∞' : newLifespanMax} năm.`,
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

    const user = req.user;
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
      cult.expAccumulated = cult.computeCurrentExp(user.spiritRootGrade);
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
    const user = req.user;
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
      cult.expAccumulated = cult.computeCurrentExp(user.spiritRootGrade);
      cult.trainingStartedAt = new Date();
    }

    cult.sectName = null;
    cult.sectJoinedAt = null;
    await cult.save();

    const newSpeed = cult.computeSpeed(user.spiritRootGrade);
    res.json({
      message: `💨 Đã rời ${oldSect}. Tốc độ tu luyện giảm xuống ${newSpeed.toFixed(3)} EXP/giây.`,
      cultivation: formatCultivation(cult, user.spiritRootGrade),
    });
  } catch (err) {
    console.error('Lỗi server:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

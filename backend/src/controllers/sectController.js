import Cultivation from '../models/Cultivation.js';
import crypto from 'crypto';

const MISSION_CONFIGS = {
  'Hoàng': { durationSeconds: 600,  reward: 20,  titles: ['Thu thập linh thảo', 'Chăm sóc linh thú', 'Quét dọn tông môn', 'Tuần tra ngoại vi'] },
  'Huyền': { durationSeconds: 1800, reward: 80,  titles: ['Săn giết yêu thú bậc thấp', 'Áp tải vật tư', 'Trợ giúp luyện đan', 'Khảo nghiệm đệ tử mới'] },
  'Địa':   { durationSeconds: 3600, reward: 200, titles: ['Truy nã tà tu', 'Khám phá bí cảnh', 'Hái thuốc vách đá', 'Trấn áp linh mạch bạo động'] },
  'Thiên': { durationSeconds: 7200, reward: 500, titles: ['Tiêu diệt Ma Huyết Lão Tổ', 'Tranh đoạt Chí Bảo', 'Hộ pháp cho Tông Chủ', 'Ngăn cản thú triều'] },
};

const generateMission = (level) => {
  const config = MISSION_CONFIGS[level];
  const title = config.titles[Math.floor(Math.random() * config.titles.length)];
  return {
    id: crypto.randomUUID(),
    level,
    title,
    description: `Nhiệm vụ cấp ${level}: ${title}. Yêu cầu mất thời gian hoàn thành.`,
    reward: config.reward,
    durationSeconds: config.durationSeconds,
    status: 'pending',
    startedAt: null,
  };
};

const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth()    === d2.getMonth()    &&
         d1.getDate()     === d2.getDate();
};

export const getMissions = async (req, res) => {
  try {
    const cult = await Cultivation.findOne({ userId: req.user.id });
    if (!cult || !cult.sectName) {
      return res.status(400).json({ message: 'Bạn chưa gia nhập tông môn nào' });
    }

    const now = new Date();
    if (!cult.lastMissionRefresh || !isSameDay(cult.lastMissionRefresh, now)) {
      const newMissions = [
        generateMission('Hoàng'),
        generateMission('Hoàng'),
        generateMission('Hoàng'),
        generateMission('Huyền'),
        generateMission('Huyền'),
      ];
      if (Math.random() < 0.2) {
        newMissions.push(generateMission('Thiên'));
      } else {
        newMissions.push(generateMission('Địa'));
      }

      cult.sectMissions = newMissions;
      cult.lastMissionRefresh = now;
      await Cultivation.save(cult);
    }

    res.json({ missions: cult.sectMissions, sectRank: cult.sectRank, sectContribution: cult.sectContribution });
  } catch (err) {
    console.error('Lỗi getMissions:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const startMission = async (req, res) => {
  try {
    const { missionId } = req.body;
    const cult = await Cultivation.findOne({ userId: req.user.id });
    if (!cult || !cult.sectName) {
      return res.status(400).json({ message: 'Bạn chưa gia nhập tông môn' });
    }

    const mission = cult.sectMissions.find(m => m.id === missionId);
    if (!mission) return res.status(404).json({ message: 'Không tìm thấy nhiệm vụ' });
    if (mission.status !== 'pending') return res.status(400).json({ message: 'Nhiệm vụ đã nhận hoặc đã hoàn thành' });

    mission.status = 'active';
    mission.startedAt = new Date().toISOString();
    await Cultivation.save(cult);

    res.json({ message: 'Đã nhận nhiệm vụ', missions: cult.sectMissions });
  } catch (err) {
    console.error('Lỗi startMission:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const completeMission = async (req, res) => {
  try {
    const { missionId } = req.body;
    const cult = await Cultivation.findOne({ userId: req.user.id });
    if (!cult || !cult.sectName) {
      return res.status(400).json({ message: 'Bạn chưa gia nhập tông môn' });
    }

    const mission = cult.sectMissions.find(m => m.id === missionId);
    if (!mission) return res.status(404).json({ message: 'Không tìm thấy nhiệm vụ' });
    if (mission.status !== 'active') return res.status(400).json({ message: 'Nhiệm vụ chưa được bắt đầu' });

    const timePassedMs = Date.now() - new Date(mission.startedAt).getTime();
    if (timePassedMs < mission.durationSeconds * 1000) {
      return res.status(400).json({ message: 'Chưa đủ thời gian hoàn thành nhiệm vụ' });
    }

    mission.status = 'completed';
    cult.sectContribution = (cult.sectContribution || 0) + mission.reward;

    const c = cult.sectContribution;
    if (c >= 10000)     cult.sectRank = 'Tông Chủ';
    else if (c >= 5000) cult.sectRank = 'Trưởng Lão';
    else if (c >= 2000) cult.sectRank = 'Chân Truyền';
    else if (c >= 500)  cult.sectRank = 'Nội Môn';
    else if (c >= 100)  cult.sectRank = 'Ngoại Môn';
    else                cult.sectRank = 'Tạp Dịch';

    await Cultivation.save(cult);

    res.json({
      message: `Hoàn thành nhiệm vụ! Nhận được ${mission.reward} điểm cống hiến.`,
      missions: cult.sectMissions,
      sectRank: cult.sectRank,
      sectContribution: cult.sectContribution,
    });
  } catch (err) {
    console.error('Lỗi completeMission:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

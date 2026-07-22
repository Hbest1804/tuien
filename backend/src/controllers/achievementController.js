import { ACHIEVEMENTS } from '../data/achievements.js';
import { findByUser } from '../models/Achievement.js';

// ── GET /api/achievements ─────────────────────────────────────────────────────
export const getAchievements = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const unlocked = await findByUser(user.id);
    const unlockedMap = Object.fromEntries(unlocked.map(u => [u.achievement_id, u.unlocked_at]));

    const list = Object.values(ACHIEVEMENTS).map(ach => ({
      ...ach,
      isUnlocked: !!unlockedMap[ach.id],
      unlockedAt: unlockedMap[ach.id] || null,
    }));

    // Tính tiêu đề đang dùng (tiêu đề từ thành tựu đã mở khóa cao nhất)
    const activeTitle = list
      .filter(a => a.isUnlocked && a.titleReward)
      .map(a => a.titleReward)
      .pop() || null;

    res.json({ achievements: list, activeTitle, totalUnlocked: unlocked.length });
  } catch (err) {
    console.error('getAchievements error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

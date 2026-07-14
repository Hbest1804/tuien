import supabase from '../config/supabase.js';
import { ACHIEVEMENTS } from '../data/achievements.js';

// ─── Mở khóa thành tựu ───────────────────────────────────────────────────────
export const unlockAchievement = async (userId, achievementId) => {
  try {
    const { error } = await supabase.from('user_achievements').insert({
      user_id: userId,
      achievement_id: achievementId,
    });
    // UNIQUE constraint → ignore duplicate
    if (error && !error.message.includes('duplicate')) {
      console.error('[Achievement] unlock error:', error.message);
    }
    return !error;
  } catch (err) {
    return false;
  }
};

// ─── Lấy danh sách thành tựu đã mở khóa ─────────────────────────────────────
export const findByUser = async (userId) => {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('achievement_id, unlocked_at')
    .eq('user_id', userId);

  if (error) return [];
  return data || [];
};

// ─── Helper: kiểm tra và mở khóa theo trigger ───────────────────────────────
export const checkAndUnlock = async (userId, trigger, extraId = null) => {
  const unlocked = [];

  for (const ach of Object.values(ACHIEVEMENTS)) {
    const triggerMatch = extraId
      ? ach.trigger === `${trigger}_${extraId}` || ach.trigger === trigger
      : ach.trigger === trigger;

    if (triggerMatch) {
      const success = await unlockAchievement(userId, ach.id);
      if (success) unlocked.push(ach);
    }
  }

  return unlocked; // trả về danh sách mới mở để notify frontend
};

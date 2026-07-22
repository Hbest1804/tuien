import supabase from '../config/supabase.js';
import { DAILY_QUEST_DEFS, DAILY_QUEST_COUNT } from '../data/dailyQuestDefs.js';

// ─── Lấy hoặc tạo nhiệm vụ hàng ngày ─────────────────────────────────────────
const getOrCreateDailyQuests = async (userId) => {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data, error } = await supabase
    .from('daily_quests')
    .select('*')
    .eq('user_id', userId)
    .eq('quest_date', today)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    return data;
  }

  // Tạo mới — random DAILY_QUEST_COUNT nhiệm vụ từ DAILY_QUEST_DEFS
  const shuffled = [...DAILY_QUEST_DEFS].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, DAILY_QUEST_COUNT);
  const quests = selected.map(def => ({
    questId: def.id,
    progress: 0,
    targetCount: def.targetCount,
    completed: false,
    claimed: false,
  }));

  const { data: newData, error: insertError } = await supabase
    .from('daily_quests')
    .insert({ user_id: userId, quest_date: today, quests })
    .select()
    .single();

  if (insertError) throw insertError;
  return newData;
};

// ── GET /api/daily-quests ─────────────────────────────────────────────────────
export const getDailyQuests = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const record = await getOrCreateDailyQuests(user.id);
    const defMap = Object.fromEntries(DAILY_QUEST_DEFS.map(d => [d.id, d]));

    const quests = (record.quests || []).map(q => ({
      ...q,
      ...defMap[q.questId],
      progressPct: Math.min(1, q.progress / (q.targetCount || 1)),
    }));

    const totalReward = quests
      .filter(q => q.completed && !q.claimed)
      .reduce((sum, q) => sum + (q.reward?.spiritStones || 0), 0);

    res.json({
      date: record.quest_date,
      quests,
      totalClaimable: totalReward,
      allCompleted: quests.every(q => q.completed),
    });
  } catch (err) {
    console.error('getDailyQuests error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ── POST /api/daily-quests/claim/:questId ────────────────────────────────────
export const claimDailyQuest = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const { questId } = req.params;
    const record = await getOrCreateDailyQuests(user.id);
    const quests = [...(record.quests || [])];
    const idx = quests.findIndex(q => q.questId === questId);

    if (idx === -1) return res.status(404).json({ message: 'Nhiệm vụ không tồn tại hôm nay' });
    if (!quests[idx].completed) return res.status(400).json({ message: 'Nhiệm vụ chưa hoàn thành' });
    if (quests[idx].claimed) return res.status(400).json({ message: 'Đã nhận thưởng rồi' });

    const def = DAILY_QUEST_DEFS.find(d => d.id === questId);
    const reward = def?.reward || {};

    // Cộng phần thưởng
    if (reward.spiritStones) {
      await supabase.rpc('adjust_spirit_stones', { p_user_id: user.id, p_delta: reward.spiritStones });
    }

    quests[idx].claimed = true;

    const today = new Date().toISOString().slice(0, 10);
    await supabase.from('daily_quests').update({ quests }).eq('user_id', user.id).eq('quest_date', today);

    res.json({
      message: `🎁 Nhận thưởng thành công! +${reward.spiritStones || 0} Linh Thạch`,
      reward,
    });
  } catch (err) {
    console.error('claimDailyQuest error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── Helper: cập nhật tiến trình nhiệm vụ hàng ngày ──────────────────────────
// Được gọi từ các controller khác khi user thực hiện action
export const updateDailyQuestProgress = async (userId, trigger) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from('daily_quests')
      .select('quests')
      .eq('user_id', userId)
      .eq('quest_date', today)
      .maybeSingle();

    if (!data) return; // Chưa có record hôm nay

    const defMap = Object.fromEntries(DAILY_QUEST_DEFS.map(d => [d.id, d]));
    let updated = false;
    const quests = [...(data.quests || [])];

    for (const q of quests) {
      if (q.claimed) continue;
      const def = defMap[q.questId];
      if (!def || def.trigger !== trigger) continue;
      if (q.completed) continue;

      q.progress = Math.min(q.progress + 1, q.targetCount);
      if (q.progress >= q.targetCount) {
        q.completed = true;
      }
      updated = true;
    }

    if (updated) {
      await supabase.from('daily_quests').update({ quests }).eq('user_id', userId).eq('quest_date', today);
    }
  } catch (err) {
    console.error('[DailyQuest] updateProgress error:', err.message);
  }
};

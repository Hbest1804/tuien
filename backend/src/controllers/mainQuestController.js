import supabase from '../config/supabase.js';
import { MAIN_QUESTS, MAIN_QUEST_MAP } from '../data/mainQuests.js';
import Inventory from '../models/Inventory.js';
import Cultivation from '../models/Cultivation.js';

// ─── Lấy hoặc tạo tiến trình nhiệm vụ chính ──────────────────────────────────
const getOrCreateProgress = async (userId) => {
  const { data, error } = await supabase
    .from('main_quest_progress')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error && !error.message.includes('No rows')) throw error;

  if (data) return data;

  const { data: newData, error: insertError } = await supabase
    .from('main_quest_progress')
    .insert({ user_id: userId, current_quest_id: 'mq_01', completed_quests: [] })
    .select()
    .single();

  if (insertError) throw insertError;
  return newData;
};

// ── GET /api/quests/main ──────────────────────────────────────────────────────
export const getMainQuests = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const progress = await getOrCreateProgress(user.id);
    const current = MAIN_QUEST_MAP[progress.current_quest_id] || null;
    const completed = progress.completed_quests || [];

    const questList = MAIN_QUESTS.map((q, i) => ({
      ...q,
      conditionCheck: undefined, // không expose function ra client
      isCompleted: completed.includes(q.id),
      isCurrent: q.id === progress.current_quest_id,
      isLocked: !completed.includes(q.id) && q.id !== progress.current_quest_id,
      index: i + 1,
    }));

    res.json({
      currentQuestId: progress.current_quest_id,
      currentQuest: current ? {
        ...current,
        conditionCheck: undefined,
        index: MAIN_QUESTS.findIndex(q => q.id === current.id) + 1,
      } : null,
      completedCount: completed.length,
      totalCount: MAIN_QUESTS.length,
      quests: questList,
      isCompleted: !progress.current_quest_id,
    });
  } catch (err) {
    console.error('getMainQuests error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ── POST /api/quests/main/check ───────────────────────────────────────────────
// Kiểm tra xem nhiệm vụ hiện tại đã hoàn thành chưa, nếu có thì advance
export const checkMainQuest = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const progress = await getOrCreateProgress(user.id);
    if (!progress.current_quest_id) {
      return res.json({ message: 'Đã hoàn thành tất cả nhiệm vụ chính!', allDone: true });
    }

    const quest = MAIN_QUEST_MAP[progress.current_quest_id];
    if (!quest) return res.status(404).json({ message: 'Nhiệm vụ không tồn tại' });

    const cult = await Cultivation.findOne({ userId: user.id });
    const inventory = await Inventory.findOne({ userId: user.id });

    const conditionMet = quest.conditionCheck({ user, cultivation: cult, inventory });

    if (!conditionMet) {
      return res.json({
        completed: false,
        message: 'Nhiệm vụ chưa hoàn thành',
        currentQuest: { ...quest, conditionCheck: undefined },
      });
    }

    // Hoàn thành — advance
    const newCompleted = [...(progress.completed_quests || []), quest.id];
    const newCurrentId = quest.nextQuestId || null;

    await supabase.from('main_quest_progress').update({
      current_quest_id: newCurrentId,
      completed_quests: newCompleted,
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id);

    // Cộng phần thưởng
    const reward = quest.reward || {};
    if (reward.spiritStones) {
      await supabase.rpc('adjust_spirit_stones', { p_user_id: user.id, p_delta: reward.spiritStones });
    }

    // Item reward — thêm vào inventory
    if (reward.itemId && inventory) {
      const slot = inventory.items.find(i => i.itemId === reward.itemId);
      if (slot) {
        slot.quantity += (reward.itemQty || 1);
      } else if (inventory.items.length < (inventory.maxSlots || 50)) {
        inventory.items.push({ itemId: reward.itemId, quantity: reward.itemQty || 1 });
      }
      inventory.markModified('items');
      await Inventory.save(inventory);
    }

    const nextQuest = newCurrentId ? MAIN_QUEST_MAP[newCurrentId] : null;

    res.json({
      completed: true,
      message: `🌟 Hoàn thành nhiệm vụ "${quest.title}"!`,
      reward,
      nextQuest: nextQuest ? { ...nextQuest, conditionCheck: undefined } : null,
      allDone: !newCurrentId,
    });
  } catch (err) {
    console.error('checkMainQuest error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── Helper: cập nhật tiến trình từ các controller khác ─────────────────────
export const updateMainQuestProgress = async (userId, trigger, extraData = {}) => {
  try {
    const { data: progress } = await supabase
      .from('main_quest_progress')
      .select('current_quest_id, completed_quests')
      .eq('user_id', userId)
      .maybeSingle();

    if (!progress?.current_quest_id) return;

    const quest = MAIN_QUEST_MAP[progress.current_quest_id];
    if (!quest || quest.conditionTrigger !== trigger) return;

    // Lấy dữ liệu cần thiết
    const Cultivation = (await import('../models/Cultivation.js')).default;
    const Inventory_mod = (await import('../models/Inventory.js')).default;
    const cult = await Cultivation.findOne({ userId });
    const inventory = await Inventory_mod.findOne({ userId });

    // Kiểm tra điều kiện với extraData
    const conditionData = { cultivation: cult, inventory, ...extraData };
    // Không có user object đầy đủ, dùng proxy
    const conditionMet = quest.conditionCheck({ user: { isCharacterCreated: true }, ...conditionData });

    if (!conditionMet) return;

    // Advance
    const newCompleted = [...(progress.completed_quests || []), quest.id];
    const newCurrentId = quest.nextQuestId || null;

    await supabase.from('main_quest_progress').update({
      current_quest_id: newCurrentId,
      completed_quests: newCompleted,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);

    // Thưởng
    if (quest.reward?.spiritStones) {
      await supabase.rpc('adjust_spirit_stones', { p_user_id: userId, p_delta: quest.reward.spiritStones });
    }
    if (quest.reward?.itemId && inventory) {
      const slot = inventory.items.find(i => i.itemId === quest.reward.itemId);
      if (slot) slot.quantity += (quest.reward.itemQty || 1);
      else if (inventory.items.length < (inventory.maxSlots || 50)) {
        inventory.items.push({ itemId: quest.reward.itemId, quantity: quest.reward.itemQty || 1 });
      }
      inventory.markModified('items');
      await Inventory_mod.save(inventory);
    }
  } catch (err) {
    console.error('[MainQuest] updateProgress error:', err.message);
  }
};

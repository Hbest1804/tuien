import Cultivation from '../models/Cultivation.js';
import { DUNGEONS } from '../data/dungeons.js';
import { ITEMS } from '../data/items.js';
import supabase from '../config/supabase.js';

export const getDungeonStatus = async (req, res) => {
  try {
    const cult = await Cultivation.findOne({ userId: req.user.id });
    if (!cult) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    res.json({
      dungeons: Object.values(DUNGEONS),
      isExploring: cult.isExploring,
      currentDungeonId: cult.currentDungeonId,
      exploreStartedAt: cult.exploreStartedAt,
    });
  } catch (err) {
    console.error('Lỗi lấy thông tin bí cảnh:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const startExploration = async (req, res) => {
  try {
    const { dungeonId } = req.body;
    const dungeon = DUNGEONS[dungeonId];

    if (!dungeon) {
      return res.status(400).json({ message: 'Bí cảnh không tồn tại.' });
    }

    const cult = await Cultivation.findOne({ userId: req.user.id });
    if (!cult) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    if (cult.realmIndex < dungeon.requiredRealmIndex) {
      return res.status(400).json({ message: 'Cảnh giới chưa đủ để vào bí cảnh này!' });
    }

    if (cult.isExploring) {
      return res.status(400).json({ message: 'Đang thám hiểm bí cảnh khác rồi!' });
    }

    if (cult.isTraining) {
      return res.status(400).json({ message: 'Không thể vừa bế quan tu luyện vừa đi bí cảnh!' });
    }

    cult.isExploring      = true;
    cult.currentDungeonId = dungeonId;
    cult.exploreStartedAt = new Date();

    await Cultivation.save(cult);

    res.json({
      message: `Đã tiến vào ${dungeon.name}! Khám phá mất thời gian, hãy quay lại sau.`,
      isExploring: cult.isExploring,
      currentDungeonId: cult.currentDungeonId,
      exploreStartedAt: cult.exploreStartedAt,
    });
  } catch (err) {
    console.error('Lỗi bắt đầu thám hiểm:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const claimDungeonRewards = async (req, res) => {
  try {
    const cult = await Cultivation.findOne({ userId: req.user.id });
    if (!cult || !cult.isExploring || !cult.currentDungeonId || !cult.exploreStartedAt) {
      return res.status(400).json({ message: 'Bạn không đang thám hiểm bí cảnh nào.' });
    }

    // RPC sẽ thực hiện khóa dòng (atomic update) để ngăn race condition và set is_exploring = false
    const dungeon = DUNGEONS[cult.currentDungeonId];
    if (!dungeon) {
      return res.status(400).json({ message: 'Bí cảnh không hợp lệ, đã tự động thoát.' });
    }

    const now = new Date();
    const elapsedHours = (now.getTime() - new Date(cult.exploreStartedAt).getTime()) / (1000 * 60 * 60);

    if (elapsedHours < 0.1) {
      return res.json({ message: 'Đã thoát bí cảnh sớm, chưa có thu hoạch gì.' });
    }

    const spiritStonesGained = Math.floor(dungeon.spiritStonesPerHour * elapsedHours);
    const itemDrops = [];

    for (const drop of dungeon.drops) {
      const expectedDrops = drop.dropRate * elapsedHours;
      const guaranteedCount = Math.floor(expectedDrops);
      const fractionalChance = expectedDrops - guaranteedCount;
      let actualCount = guaranteedCount;
      if (Math.random() < fractionalChance) actualCount += 1;
      if (actualCount > 0) {
        itemDrops.push({ itemId: drop.itemId, quantity: actualCount });
      }
    }

    const { data, error } = await supabase.rpc('claim_dungeon_rewards_tx', {
      p_user_id: req.user.id,
      p_spirit_stones: spiritStonesGained,
      p_item_drops: itemDrops
    });

    if (error) {
      console.error('Lỗi RPC claim_dungeon_rewards_tx:', error);
      return res.status(500).json({ message: 'Lỗi server khi nhận thưởng.' });
    }

    if (!data.success) {
      return res.status(400).json({ message: data.message });
    }

    let message = `Thám hiểm kết thúc! Thu được ${spiritStonesGained} Linh Thạch.`;
    if (itemDrops.length > 0) {
      const itemNames = itemDrops.map(d => `${d.quantity}x ${ITEMS[d.itemId]?.name || d.itemId}`).join(', ');
      message += ` Bỏ túi: ${itemNames}.`;
    }

    res.json({ message, rewards: { spiritStones: spiritStonesGained, items: itemDrops }, isExploring: false });
  } catch (err) {
    console.error('Lỗi nhận thưởng bí cảnh:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

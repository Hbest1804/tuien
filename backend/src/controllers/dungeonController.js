import Cultivation from '../models/Cultivation.js';
import { DUNGEONS, FLOOR_EVENTS } from '../data/dungeons.js';
import { ITEMS } from '../data/items.js';
import { REALMS } from '../models/Cultivation.js';
import supabase from '../config/supabase.js';

// ─── Tính chỉ số combat player ────────────────────────────────────────────────
const calcPlayerStats = (realmIndex) => {
  const base = realmIndex + 1;
  return {
    maxHp: base * 100,
    atk: base * 10,
    def: base * 5,
  };
};

// ─── Simulate combat boss ──────────────────────────────────────────────────────
const simulateBoss = (player, boss) => {
  let playerHp = player.maxHp;
  let bossHp = boss.hp;
  const log = [];
  let turn = 1;

  while (playerHp > 0 && bossHp > 0 && turn <= 50) {
    const playerDmg = Math.max(1, player.atk - boss.def);
    const bossDmg = Math.max(1, boss.atk - player.def);

    bossHp -= playerDmg;
    log.push({ turn, actor: 'player', damage: playerDmg, bossHpLeft: Math.max(0, bossHp) });

    if (bossHp <= 0) break;

    playerHp -= bossDmg;
    log.push({ turn, actor: 'boss', damage: bossDmg, playerHpLeft: Math.max(0, playerHp) });

    turn++;
  }

  return { won: playerHp > 0 && bossHp <= 0, log };
};

// ─── GET /api/dungeons ────────────────────────────────────────────────────────
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
      currentFloor: cult.currentFloor || 1,
      floorEvents: cult.floorEvents || [],
    });
  } catch (err) {
    console.error('Lỗi lấy thông tin bí cảnh:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /api/dungeons/start ─────────────────────────────────────────────────
export const startExploration = async (req, res) => {
  try {
    const { dungeonId } = req.body;
    const dungeon = DUNGEONS[dungeonId];

    if (!dungeon) {
      return res.status(400).json({ message: 'Bí cảnh không tồn tại.' });
    }

    const cult = await Cultivation.findOne({ userId: req.user.id });
    if (!cult) return res.status(403).json({ message: 'Chưa tạo nhân vật' });

    if (cult.realmIndex < dungeon.requiredRealmIndex) {
      return res.status(400).json({ message: `Cảnh giới chưa đủ để vào bí cảnh này! Cần: ${REALMS[dungeon.requiredRealmIndex]?.name}` });
    }
    if (cult.isExploring) {
      return res.status(400).json({ message: 'Đang thám hiểm bí cảnh khác rồi!' });
    }
    if (cult.isTraining) {
      return res.status(400).json({ message: 'Không thể vừa bế quan tu luyện vừa đi bí cảnh!' });
    }

    // Generate floor events for roguelike
    const floorCount = dungeon.floors || 0;
    const floorEvents = [];
    for (let i = 1; i <= floorCount; i++) {
      if (i === floorCount) {
        floorEvents.push({ floor: i, type: 'boss', resolved: false });
      } else {
        const randomEvent = FLOOR_EVENTS[Math.floor(Math.random() * FLOOR_EVENTS.length)];
        floorEvents.push({ floor: i, ...randomEvent, resolved: false });
      }
    }

    cult.isExploring = true;
    cult.currentDungeonId = dungeonId;
    cult.exploreStartedAt = new Date();
    cult.currentFloor = 1;
    cult.floorEvents = floorEvents;

    await Cultivation.save(cult);

    res.json({
      message: `Đã tiến vào ${dungeon.name}! Bí cảnh ${dungeon.floors} tầng đang chờ.`,
      isExploring: true,
      currentDungeonId: dungeonId,
      exploreStartedAt: cult.exploreStartedAt,
      currentFloor: 1,
      floorEvents,
    });
  } catch (err) {
    console.error('Lỗi bắt đầu thám hiểm:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /api/dungeons/advance-floor ─────────────────────────────────────────
export const advanceFloor = async (req, res) => {
  try {
    const cult = await Cultivation.findOne({ userId: req.user.id });
    if (!cult || !cult.isExploring) {
      return res.status(400).json({ message: 'Bạn không đang thám hiểm bí cảnh nào.' });
    }

    const dungeon = DUNGEONS[cult.currentDungeonId];
    if (!dungeon) return res.status(400).json({ message: 'Bí cảnh không hợp lệ.' });

    const currentFloor = cult.currentFloor || 1;
    const floorEvents = cult.floorEvents || [];
    const currentEvent = floorEvents.find(e => e.floor === currentFloor);

    if (currentEvent && !currentEvent.resolved) {
      return res.status(400).json({ message: 'Cần giải quyết sự kiện tầng hiện tại trước!' });
    }

    const nextFloor = currentFloor + 1;
    if (nextFloor > dungeon.floors) {
      return res.status(400).json({ message: 'Đã ở tầng cuối. Hãy đánh Boss!' });
    }

    cult.currentFloor = nextFloor;
    await Cultivation.save(cult);

    const nextEvent = floorEvents.find(e => e.floor === nextFloor);
    res.json({
      message: `Tiến lên Tầng ${nextFloor}!`,
      currentFloor: nextFloor,
      floorEvent: nextEvent || null,
      floorEvents: cult.floorEvents,
    });
  } catch (err) {
    console.error('Lỗi advance floor:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /api/dungeons/resolve-event ─────────────────────────────────────────
export const resolveFloorEvent = async (req, res) => {
  try {
    const cult = await Cultivation.findOne({ userId: req.user.id });
    if (!cult || !cult.isExploring) {
      return res.status(400).json({ message: 'Bạn không đang thám hiểm.' });
    }

    const currentFloor = cult.currentFloor || 1;
    const floorEvents = cult.floorEvents || [];
    const eventIndex = floorEvents.findIndex(e => e.floor === currentFloor);
    const event = floorEvents[eventIndex];

    if (!event || event.resolved) {
      return res.status(400).json({ message: 'Không có sự kiện để giải quyết.' });
    }

    let rewardMsg = '';
    let spiritStonesGained = 0;
    let expGained = 0;

    if (event.type === 'boss') {
      return res.status(400).json({ message: 'Tầng boss cần gọi API /dungeons/fight-boss' });
    }

    if (event.reward) {
      spiritStonesGained = event.reward.spiritStones || 0;
      expGained = event.reward.expBonus || 0;
      rewardMsg = `Nhận được ${spiritStonesGained > 0 ? spiritStonesGained + ' Linh Thạch' : ''}${expGained > 0 ? ' ' + expGained + ' EXP' : ''}`;
    }
    if (event.penalty) {
      spiritStonesGained = event.penalty.spiritStones || 0;
      rewardMsg = `Bị phạt ${Math.abs(spiritStonesGained)} Linh Thạch`;
    }

    floorEvents[eventIndex].resolved = true;
    cult.floorEvents = floorEvents;

    if (expGained > 0) {
      cult.expAccumulated = (cult.expAccumulated || 0) + expGained;
    }
    await Cultivation.save(cult);

    if (spiritStonesGained !== 0) {
      await supabase.rpc('adjust_spirit_stones', { p_user_id: req.user.id, p_delta: spiritStonesGained });
    }

    res.json({
      message: `[${event.title}] ${rewardMsg || 'Sự kiện đã giải quyết.'}`,
      floorEvents: cult.floorEvents,
      reward: { spiritStones: spiritStonesGained, exp: expGained },
    });
  } catch (err) {
    console.error('Lỗi resolve event:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /api/dungeons/fight-boss ────────────────────────────────────────────
export const fightBoss = async (req, res) => {
  try {
    const cult = await Cultivation.findOne({ userId: req.user.id });
    if (!cult || !cult.isExploring) {
      return res.status(400).json({ message: 'Bạn không đang thám hiểm.' });
    }

    const dungeon = DUNGEONS[cult.currentDungeonId];
    if (!dungeon || !dungeon.bossData) {
      return res.status(400).json({ message: 'Bí cảnh này không có Boss.' });
    }

    const currentFloor = cult.currentFloor || 1;
    if (currentFloor !== dungeon.floors) {
      return res.status(400).json({ message: `Phải đến tầng ${dungeon.floors} mới gặp Boss!` });
    }

    const playerStats = calcPlayerStats(cult.realmIndex);
    const boss = dungeon.bossData;
    const result = simulateBoss(playerStats, boss);

    let legendaryDrops = [];
    let spiritStonesGained = 0;
    let expGained = 0;

    if (result.won) {
      // Roll legendary drops
      for (const drop of dungeon.legendaryDrops) {
        if (Math.random() < drop.chance) {
          legendaryDrops.push({ itemId: drop.itemId, quantity: drop.quantity });
        }
      }
      spiritStonesGained = Math.floor(dungeon.spiritStonesPerHour * 2);
      expGained = (cult.realmIndex + 1) * 5000;

      // Lưu drops vào inventory
      if (legendaryDrops.length > 0) {
        const { data: inv } = await supabase
          .from('inventories')
          .select('*')
          .eq('user_id', req.user.id)
          .maybeSingle();

        if (inv) {
          const items = inv.items || [];
          for (const drop of legendaryDrops) {
            const slot = items.find(i => i.itemId === drop.itemId);
            if (slot) slot.quantity += drop.quantity;
            else items.push({ itemId: drop.itemId, quantity: drop.quantity });
          }
          await supabase.from('inventories').update({ items }).eq('id', inv.id);
        }
      }

      // Cộng EXP + Linh Thạch
      cult.expAccumulated = (cult.expAccumulated || 0) + expGained;
      await supabase.rpc('adjust_spirit_stones', { p_user_id: req.user.id, p_delta: spiritStonesGained });
    }

    // Reset dungeon state
    cult.isExploring = false;
    cult.currentDungeonId = null;
    cult.exploreStartedAt = null;
    cult.currentFloor = null;
    cult.floorEvents = [];
    await Cultivation.save(cult);

    const dropNames = legendaryDrops.map(d => `${d.quantity}x ${ITEMS[d.itemId]?.name || d.itemId}`).join(', ');

    res.json({
      won: result.won,
      message: result.won
        ? `🏆 Chiến thắng Boss ${boss.name}! Thu được: ${dropNames || 'không có đồ'} + ${spiritStonesGained} Linh Thạch!`
        : `💀 Thua Boss ${boss.name}! Rút lui an toàn.`,
      combatLog: result.log,
      legendaryDrops: result.won ? legendaryDrops.map(d => ({ ...d, itemData: ITEMS[d.itemId] })) : [],
      spiritStonesGained: result.won ? spiritStonesGained : 0,
      expGained: result.won ? expGained : 0,
      isExploring: false,
    });
  } catch (err) {
    console.error('Lỗi fight boss:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /api/dungeons/claim ─────────────────────────────────────────────────
export const claimDungeonRewards = async (req, res) => {
  try {
    const cult = await Cultivation.findOne({ userId: req.user.id });
    if (!cult || !cult.isExploring || !cult.currentDungeonId || !cult.exploreStartedAt) {
      return res.status(400).json({ message: 'Bạn không đang thám hiểm bí cảnh nào.' });
    }

    const dungeon = DUNGEONS[cult.currentDungeonId];
    if (!dungeon) {
      cult.isExploring = false;
      cult.currentDungeonId = null;
      cult.exploreStartedAt = null;
      cult.currentFloor = null;
      cult.floorEvents = [];
      await Cultivation.save(cult);
      return res.status(400).json({ message: 'Bí cảnh không hợp lệ, đã tự động thoát.' });
    }

    const now = new Date();
    const elapsedHours = (now.getTime() - new Date(cult.exploreStartedAt).getTime()) / (1000 * 60 * 60);

    if (elapsedHours < 0.02) {
      cult.isExploring = false;
      cult.currentDungeonId = null;
      cult.exploreStartedAt = null;
      cult.currentFloor = null;
      cult.floorEvents = [];
      await Cultivation.save(cult);
      return res.json({ message: 'Đã thoát bí cảnh sớm, chưa có thu hoạch gì.', isExploring: false });
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

    if (!data || !data.success) {
      return res.status(400).json({ message: data ? data.message : 'Lỗi không xác định khi nhận thưởng.' });
    }

    // Reset dungeon state (RPC đã xử lý, nhưng clear các fields mới)
    const { error: upErr } = await supabase
      .from('cultivations')
      .update({ current_floor: null, floor_events: [] })
      .eq('user_id', req.user.id);
    if (upErr) console.error('Lỗi clear floor data:', upErr);

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

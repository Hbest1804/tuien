import supabase from '../config/supabase.js';
import Inventory from '../models/Inventory.js';
import { ITEMS } from '../data/items.js';
import { REALMS } from '../models/Cultivation.js';
import Cultivation from '../models/Cultivation.js';
import { checkAndUnlock } from '../models/Achievement.js';
import { updateDailyQuestProgress } from './dailyQuestController.js';
import { updateMainQuestProgress } from './mainQuestController.js';
import { logTransaction } from '../models/TransactionLog.js';
import { broadcast } from '../config/wsServer.js';

// ─── Monster definitions ──────────────────────────────────────────────────────
const MONSTERS = {
  'mon_demon_wolf':   { id: 'mon_demon_wolf',   name: 'Linh Lang',      realmRequired: 0, hp: 150,   atk: 15,   def: 5,   expReward: 300,   stoneReward: 50,   dropItems: [{ itemId: 'mat_huyet_linh_thao', chance: 0.4 }],                                                    desc: 'Yêu thú cấp thấp tại vùng núi ngoại ô.' },
  'mon_stone_golem':  { id: 'mon_stone_golem',  name: 'Thạch Quỷ',     realmRequired: 1, hp: 500,   atk: 40,   def: 25,  expReward: 1500,  stoneReward: 200,  dropItems: [{ itemId: 'mat_kim_dan_thao', chance: 0.3 }],                                                       desc: 'Yêu thú đất đai Trúc Cơ kỳ.' },
  'mon_fire_ape':     { id: 'mon_fire_ape',     name: 'Viêm Hầu',      realmRequired: 2, hp: 1500,  atk: 120,  def: 80,  expReward: 6000,  stoneReward: 800,  dropItems: [{ itemId: 'mat_nguyen_anh_thach', chance: 0.2 }],                                                  desc: 'Yêu thú hỏa hệ Kim Đan kỳ.' },
  'mon_thunder_bird': { id: 'mon_thunder_bird', name: 'Lôi Bằng',     realmRequired: 3, hp: 4000,  atk: 350,  def: 200, expReward: 20000, stoneReward: 3000, dropItems: [{ itemId: 'mat_hoa_than_tinh', chance: 0.15 }],                                                   desc: 'Yêu thú lôi hệ Nguyên Anh kỳ.' },
  'mon_chaos_dragon': { id: 'mon_chaos_dragon', name: 'Hỗn Nguyên Long', realmRequired: 4, hp: 15000, atk: 1200, def: 600, expReward: 80000, stoneReward: 15000, dropItems: [{ itemId: 'mat_hoa_than_tinh', chance: 0.5 }, { itemId: 'pill_thien_dieu_dan', chance: 0.1 }], desc: 'Chiến Long siêu cường Hóa Thần kỳ.' },
};

// ─── Tính chỉ số nhân vật ─────────────────────────────────────────────────────
const calcPlayerStats = (realmIndex, equippedStats) => {
  const base = realmIndex + 1;
  return {
    maxHp: base * 100 + (equippedStats.defBonus || 0) * 2,
    atk: base * 10 + (equippedStats.atkBonus || 0),
    def: base * 5 + (equippedStats.defBonus || 0),
  };
};

// ─── Simulate combat (turn by turn) ──────────────────────────────────────────
const simulateCombat = (player, monster) => {
  let playerHp = player.maxHp;
  let monsterHp = monster.hp;
  const log = [];
  let turn = 1;

  while (playerHp > 0 && monsterHp > 0 && turn <= 50) {
    const playerDmg = Math.max(1, player.atk - monster.def);
    const monsterDmg = Math.max(1, monster.atk - player.def);

    monsterHp -= playerDmg;
    log.push({ turn, actor: 'player', damage: playerDmg, monsterHpLeft: Math.max(0, monsterHp) });

    if (monsterHp <= 0) break;

    playerHp -= monsterDmg;
    log.push({ turn, actor: 'monster', damage: monsterDmg, playerHpLeft: Math.max(0, playerHp) });

    turn++;
  }

  return { playerHp, monsterHp, log, won: playerHp > 0 && monsterHp <= 0 };
};

// ── GET /api/combat/monsters ──────────────────────────────────────────────────
export const getMonsters = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const cult = await Cultivation.findOne({ userId: user.id });
    const inventory = await Inventory.findOne({ userId: user.id });
    const realmIndex = cult?.realmIndex || 0;
    const equippedStats = inventory ? inventory.computeEquippedStats(ITEMS) : { atkBonus: 0, defBonus: 0 };
    const playerStats = calcPlayerStats(realmIndex, equippedStats);

    const monsters = Object.values(MONSTERS).map(m => ({
      ...m,
      realmUnlocked: m.realmRequired <= realmIndex,
      realmName: REALMS[m.realmRequired]?.name || 'Luyện Khí',
      playerWinChance: estimateWinChance(playerStats, m),
    }));

    res.json({ monsters, playerStats });
  } catch (err) {
    console.error('getMonsters error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Ước tính tỷ lệ thắng đơn giản
const estimateWinChance = (player, monster) => {
  const pdmg = Math.max(1, player.atk - monster.def);
  const mdmg = Math.max(1, monster.atk - player.def);
  const turnsToKill = Math.ceil(monster.hp / pdmg);
  const turnsToDie = Math.ceil(player.maxHp / mdmg);
  if (turnsToDie >= turnsToKill) return Math.min(0.99, 0.6 + (turnsToDie - turnsToKill) * 0.05);
  return Math.max(0.01, 0.4 - (turnsToKill - turnsToDie) * 0.05);
};

// ── POST /api/combat/fight ────────────────────────────────────────────────────
export const fight = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.isCharacterCreated) {
      return res.status(403).json({ message: 'Chưa tạo nhân vật' });
    }

    const { monsterId } = req.body;
    const monster = MONSTERS[monsterId];
    if (!monster) return res.status(400).json({ message: 'Yêu thú không tồn tại' });

    const cult = await Cultivation.findOne({ userId: user.id });
    const realmIndex = cult?.realmIndex || 0;

    if (monster.realmRequired > realmIndex) {
      return res.status(403).json({
        message: `Yêu thú này yêu cầu cảnh giới ${REALMS[monster.realmRequired]?.name || monster.realmRequired}+`,
      });
    }

    const inventory = await Inventory.findOne({ userId: user.id });
    const equippedStats = inventory ? inventory.computeEquippedStats(ITEMS) : { atkBonus: 0, defBonus: 0 };
    const playerStats = calcPlayerStats(realmIndex, equippedStats);

    // Run combat simulation
    const result = simulateCombat(playerStats, monster);

    let rewards = null;
    let drops = [];

    if (result.won) {
      // Tính EXP reward
      const expGained = monster.expReward;
      const stonesGained = monster.stoneReward;

      // Roll drops
      for (const drop of monster.dropItems) {
        if (Math.random() <= drop.chance) {
          drops.push(drop.itemId);
          // Thêm vào inventory
          if (inventory) {
            const slot = inventory.items.find(i => i.itemId === drop.itemId);
            if (slot) {
              slot.quantity += 1;
            } else if (inventory.items.length < (inventory.maxSlots || 50)) {
              inventory.items.push({ itemId: drop.itemId, quantity: 1 });
            }
          }
        }
      }

      // Cộng EXP
      if (cult) {
        cult.expAccumulated = (cult.expAccumulated || 0) + expGained;
        await Cultivation.save(cult);
      }

      // Cộng Linh Thạch
      if (stonesGained > 0) {
        await supabase.rpc('adjust_spirit_stones', { p_user_id: user.id, p_delta: stonesGained });
        await logTransaction(user.id, {
          type: 'combat_win',
          spiritStonesDelta: stonesGained,
          detail: { monsterId, monsterName: monster.name },
        });
      }

      if (inventory && drops.length > 0) {
        inventory.markModified('items');
        await Inventory.save(inventory);
      }

      rewards = { expGained, stonesGained, drops: drops.map(d => ({ itemId: d, itemData: ITEMS[d] })) };
    }

    // Achievements + daily quests
    const newAchievements = [];
    const a1 = await checkAndUnlock(user.id, 'combat_win');
    const a2 = result.won && monsterId === 'mon_chaos_dragon'
      ? await checkAndUnlock(user.id, 'combat_win', 'chaos_dragon')
      : [];
    newAchievements.push(...a1, ...a2);

    await updateDailyQuestProgress(user.id, 'combat_fight');
    if (result.won) {
      await updateDailyQuestProgress(user.id, 'combat_win');
      await updateMainQuestProgress(user.id, 'combat_win', { defeatedMonster: true });
    }

    if (newAchievements.length > 0) {
      broadcast(`notify:${user.id}`, { type: 'achievement', achievements: newAchievements });
    }

    res.json({
      won: result.won,
      message: result.won
        ? `⚔️ Chiến thắng! Tiêu diệt ${monster.name}!`
        : `💀 Thất bại! ${monster.name} quá mạnh. Hãy nâng cao cảnh giới!`,
      playerStats,
      monster: { id: monster.id, name: monster.name, hp: monster.hp, atk: monster.atk, def: monster.def },
      combatLog: result.log,
      rewards,
      newAchievements,
    });
  } catch (err) {
    console.error('fight error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

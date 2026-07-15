import supabase from '../config/supabase.js';
import Cultivation, { REALMS } from '../models/Cultivation.js';
import Inventory from '../models/Inventory.js';
import { ITEMS } from '../data/items.js';
import { broadcast } from '../config/wsServer.js';
import { logTransaction } from '../models/TransactionLog.js';

// ─── ELO rating constants ──────────────────────────────────────────────────────
const K_FACTOR = 32;
const BASE_RATING = 1200;

const calcPlayerStats = (realmIndex, equippedStats = {}) => {
  const base = realmIndex + 1;
  return {
    maxHp: base * 100 + (equippedStats.defBonus || 0) * 2,
    atk: base * 10 + (equippedStats.atkBonus || 0),
    def: base * 5 + (equippedStats.defBonus || 0),
  };
};

const simulatePvP = (p1, p2) => {
  let hp1 = p1.maxHp;
  let hp2 = p2.maxHp;
  const log = [];
  let turn = 1;

  while (hp1 > 0 && hp2 > 0 && turn <= 50) {
    const dmg1to2 = Math.max(1, p1.atk - p2.def);
    const dmg2to1 = Math.max(1, p2.atk - p1.def);

    hp2 -= dmg1to2;
    log.push({ turn, actor: 'challenger', damage: dmg1to2, targetHpLeft: Math.max(0, hp2) });

    if (hp2 <= 0) break;

    hp1 -= dmg2to1;
    log.push({ turn, actor: 'defender', damage: dmg2to1, targetHpLeft: Math.max(0, hp1) });

    turn++;
  }

  return { p1Won: hp1 > 0 && hp2 <= 0, log };
};

const calcEloChange = (ratingA, ratingB, aWon) => {
  const expected = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const actual = aWon ? 1 : 0;
  return Math.round(K_FACTOR * (actual - expected));
};

const getPvpTier = (rating) => {
  if (rating >= 2000) return { name: 'Tiên Vương', color: '#ff6b6b', icon: '👑' };
  if (rating >= 1800) return { name: 'Bạch Kim', color: '#b066ff', icon: '💜' };
  if (rating >= 1600) return { name: 'Vàng', color: '#f2ca50', icon: '⭐' };
  if (rating >= 1400) return { name: 'Bạc', color: '#c0c0c0', icon: '🥈' };
  return { name: 'Đồng', color: '#cd7f32', icon: '🥉' };
};

// ─── GET /api/pvp/status ──────────────────────────────────────────────────────
export const getPvpStatus = async (req, res) => {
  try {
    const { data: pvpRow } = await supabase
      .from('pvp_records')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();

    const rating = pvpRow?.rating || BASE_RATING;
    const wins = pvpRow?.wins || 0;
    const losses = pvpRow?.losses || 0;
    const history = pvpRow?.history || [];

    res.json({
      rating,
      wins,
      losses,
      tier: getPvpTier(rating),
      history: history.slice(-20),
    });
  } catch (err) {
    console.error('getPvpStatus error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── GET /api/pvp/rankings ────────────────────────────────────────────────────
export const getPvpRankings = async (req, res) => {
  try {
    const { data: rankings, error } = await supabase
      .from('pvp_records')
      .select('user_id, rating, wins, losses, users!pvp_records_user_id_fkey(username, spirit_root_grade)')
      .order('rating', { ascending: false })
      .limit(50);

    if (error) throw error;

    const result = (rankings || []).map((r, i) => ({
      rank: i + 1,
      userId: r.user_id,
      username: r.users?.username || 'Vô Danh',
      spiritRootGrade: r.users?.spirit_root_grade || 'Hoàng',
      rating: r.rating,
      wins: r.wins,
      losses: r.losses,
      tier: getPvpTier(r.rating),
    }));

    res.json({ rankings: result });
  } catch (err) {
    console.error('getPvpRankings error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /api/pvp/challenge ──────────────────────────────────────────────────
export const challengePlayer = async (req, res) => {
  try {
    const { targetUsername } = req.body;
    if (!targetUsername) return res.status(400).json({ message: 'Cần nhập tên đối thủ.' });

    const { data: targetUser } = await supabase
      .from('users')
      .select('id, username, spirit_root_grade, is_character_created')
      .eq('username', targetUsername)
      .maybeSingle();

    if (!targetUser) return res.status(404).json({ message: 'Người chơi không tồn tại.' });
    if (targetUser.id === req.user.id) return res.status(400).json({ message: 'Không thể tự thách đấu!' });
    if (!targetUser.is_character_created) return res.status(400).json({ message: 'Người chơi này chưa tạo nhân vật.' });

    const [myCult, targetCult] = await Promise.all([
      Cultivation.findOne({ userId: req.user.id }),
      Cultivation.findOne({ userId: targetUser.id }),
    ]);

    if (!myCult) return res.status(403).json({ message: 'Chưa tạo nhân vật.' });
    if (!targetCult) return res.status(400).json({ message: 'Đối thủ chưa tạo nhân vật.' });

    // Get inventories for equipment stats
    const [myInv, targetInv] = await Promise.all([
      Inventory.findOne({ userId: req.user.id }),
      Inventory.findOne({ userId: targetUser.id }),
    ]);

    const myEquip = myInv ? myInv.computeEquippedStats(ITEMS) : { atkBonus: 0, defBonus: 0 };
    const targetEquip = targetInv ? targetInv.computeEquippedStats(ITEMS) : { atkBonus: 0, defBonus: 0 };

    const p1Stats = calcPlayerStats(myCult.realmIndex, myEquip);
    const p2Stats = calcPlayerStats(targetCult.realmIndex, targetEquip);

    const result = simulatePvP(p1Stats, p2Stats);
    const challengerWon = result.p1Won;

    // Get / upsert PvP records
    const [{ data: myPvp }, { data: targetPvp }] = await Promise.all([
      supabase.from('pvp_records').select('*').eq('user_id', req.user.id).maybeSingle(),
      supabase.from('pvp_records').select('*').eq('user_id', targetUser.id).maybeSingle(),
    ]);

    const myRating = myPvp?.rating || BASE_RATING;
    const targetRating = targetPvp?.rating || BASE_RATING;

    const myRatingChange = calcEloChange(myRating, targetRating, challengerWon);
    const targetRatingChange = calcEloChange(targetRating, myRating, !challengerWon);

    const myNewRating = Math.max(800, myRating + myRatingChange);
    const targetNewRating = Math.max(800, targetRating + targetRatingChange);

    const battleRecord = {
      at: new Date().toISOString(),
      opponent: targetUser.username,
      opponentId: targetUser.id,
      won: challengerWon,
      ratingChange: myRatingChange,
      newRating: myNewRating,
    };

    const targetRecord = {
      at: new Date().toISOString(),
      opponent: req.user.username,
      opponentId: req.user.id,
      won: !challengerWon,
      ratingChange: targetRatingChange,
      newRating: targetNewRating,
    };

    const myHistory = [...(myPvp?.history || []).slice(-49), battleRecord];
    const targetHistory = [...(targetPvp?.history || []).slice(-49), targetRecord];

    // Update both records atomically via RPC to prevent race conditions
    const { error: pvpErr } = await supabase.rpc('commit_pvp_result', {
      p_challenger_id:     req.user.id,
      p_defender_id:       targetUser.id,
      p_challenger_won:    challengerWon,
      p_challenger_rating: myNewRating,
      p_defender_rating:   targetNewRating,
      p_challenger_rating_change: myRatingChange,
      p_defender_rating_change:   targetRatingChange,
      p_challenger_record: battleRecord,
      p_defender_record:   targetRecord,
    });
    if (pvpErr) throw pvpErr;

    // Notify target via WebSocket
    broadcast(`notify:${targetUser.id}`, {
      type: 'pvp_challenged',
      challenger: req.user.username,
      result: challengerWon ? 'you_lost' : 'you_won',
      ratingChange: targetRatingChange,
    });

    const winnerName = challengerWon ? req.user.username : targetUser.username;

    res.json({
      won: challengerWon,
      message: challengerWon
        ? `⚔️ Chiến thắng! Ngươi đã đánh bại ${targetUser.username}!`
        : `💀 Thua trận! ${targetUser.username} quá mạnh!`,
      winner: winnerName,
      combatLog: result.log,
      myStats: p1Stats,
      targetStats: p2Stats,
      ratingChange: myRatingChange,
      newRating: myNewRating,
      newTier: getPvpTier(myNewRating),
      myRating: myNewRating,
      targetRating: targetNewRating,
    });
  } catch (err) {
    console.error('challengePlayer error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── GET /api/pvp/find-opponent ───────────────────────────────────────────────
export const findRandomOpponent = async (req, res) => {
  try {
    const { data: myPvp } = await supabase
      .from('pvp_records')
      .select('rating')
      .eq('user_id', req.user.id)
      .maybeSingle();

    const myRating = myPvp?.rating || BASE_RATING;
    const ratingRange = 200;

    const { data: candidates } = await supabase
      .from('pvp_records')
      .select('user_id, rating, users!pvp_records_user_id_fkey(username, spirit_root_grade)')
      .neq('user_id', req.user.id)
      .gte('rating', myRating - ratingRange)
      .lte('rating', myRating + ratingRange)
      .limit(10);

    if (!candidates || candidates.length === 0) {
      // Fallback: any player
      const { data: anyPlayers } = await supabase
        .from('pvp_records')
        .select('user_id, rating, users!pvp_records_user_id_fkey(username, spirit_root_grade)')
        .neq('user_id', req.user.id)
        .limit(10);
      const pick = anyPlayers?.[Math.floor(Math.random() * (anyPlayers?.length || 1))];
      if (!pick) return res.status(404).json({ message: 'Không tìm thấy đối thủ phù hợp.' });
      return res.json({ opponent: { userId: pick.user_id, username: pick.users?.username, rating: pick.rating, tier: getPvpTier(pick.rating) } });
    }

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    res.json({
      opponent: {
        userId: pick.user_id,
        username: pick.users?.username,
        spiritRootGrade: pick.users?.spirit_root_grade,
        rating: pick.rating,
        tier: getPvpTier(pick.rating),
      }
    });
  } catch (err) {
    console.error('findRandomOpponent error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

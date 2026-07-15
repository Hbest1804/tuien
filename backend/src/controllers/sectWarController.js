import supabase from '../config/supabase.js';
import Cultivation from '../models/Cultivation.js';
import { broadcast } from '../config/wsServer.js';

const LINH_MACH_LIST = [
  { id: 'linh_mach_1', name: 'Thiên Long Linh Mạch', desc: 'Linh mạch cổ đại chứa khí tức rồng thiêng. Ai chiếm được sẽ nhận thưởng khổng lồ.', maxHp: 10000, spiritBonus: 500, position: { top: '20%', left: '30%' } },
  { id: 'linh_mach_2', name: 'Huyền Âm Linh Mạch', desc: 'Linh mạch âm tính nằm sâu trong núi băng. Nâng cao EXP tu luyện.', maxHp: 8000, spiritBonus: 350, position: { top: '50%', left: '60%' } },
  { id: 'linh_mach_3', name: 'Viêm Hỏa Linh Mạch', desc: 'Linh mạch hỏa tính nằm trong lòng núi lửa. Thích hợp cho luyện đan.', maxHp: 12000, spiritBonus: 600, position: { top: '70%', left: '45%' } },
  { id: 'linh_mach_4', name: 'Thái Cực Linh Mạch', desc: 'Linh mạch trung tâm của thế giới tu tiên. Quyền lực tuyệt đối.', maxHp: 20000, spiritBonus: 1000, position: { top: '35%', left: '75%' } },
];

const WAR_DURATION_MS = 24 * 60 * 60 * 1000; // 24 giờ

// ─── GET /api/sect-war/status ──────────────────────────────────────────────────
export const getSectWarStatus = async (req, res) => {
  try {
    const cult = await Cultivation.findOne({ userId: req.user.id });

    const { data: war } = await supabase
      .from('sect_wars')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = Date.now();
    let warActive = false;
    let timeLeft = 0;

    if (war) {
      const endTime = new Date(war.created_at).getTime() + WAR_DURATION_MS;
      warActive = endTime > now;
      timeLeft = Math.max(0, endTime - now);

      if (!warActive && !war.settled) {
        // Settle war — find winning sect per linh mach
        await settleWar(war.id);
      }
    }

    res.json({
      warActive,
      timeLeft,
      currentWar: war,
      linghMachList: LINH_MACH_LIST,
      mySectName: cult?.sectName || null,
    });
  } catch (err) {
    console.error('getSectWarStatus error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /api/sect-war/declare ────────────────────────────────────────────────
export const declareWar = async (req, res) => {
  try {
    const cult = await Cultivation.findOne({ userId: req.user.id });
    if (!cult || !cult.sectName) return res.status(400).json({ message: 'Chưa gia nhập tông môn.' });
    if (cult.sectRank !== 'Tông Chủ') return res.status(403).json({ message: 'Chỉ Tông Chủ mới có thể tuyên chiến!' });

    // Check if war already active
    const { data: activeWar } = await supabase
      .from('sect_wars')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeWar) {
      const endTime = new Date(activeWar.created_at).getTime() + WAR_DURATION_MS;
      if (endTime > Date.now()) {
        return res.status(400).json({ message: 'Đang có Tông Môn Chiến diễn ra!' });
      }
    }

    // Initialize linh mach states
    const linghMachStates = {};
    for (const lm of LINH_MACH_LIST) {
      linghMachStates[lm.id] = {
        currentHp: lm.maxHp,
        controlledBy: null,
        attackLog: [],
      };
    }

    const { data: newWar } = await supabase
      .from('sect_wars')
      .insert({
        declared_by: cult.sectName,
        linh_mach_states: linghMachStates,
        sect_scores: {},
        attack_log: [],
        settled: false,
      })
      .select('*')
      .single();

    broadcast('global', { type: 'sect_war_declared', declaredBy: cult.sectName });

    res.json({
      message: `⚔️ ${cult.sectName} đã tuyên chiến! Tông Môn Chiến bắt đầu trong 24 giờ!`,
      war: newWar,
    });
  } catch (err) {
    console.error('declareWar error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── POST /api/sect-war/attack ────────────────────────────────────────────────
export const attackLinhMach = async (req, res) => {
  try {
    const { linghMachId, contributionUsed } = req.body;
    if (!linghMachId) return res.status(400).json({ message: 'Cần chọn Linh Mạch tấn công.' });

    const attackPower = Math.min(contributionUsed || 100, 500); // max 500 per attack

    const cult = await Cultivation.findOne({ userId: req.user.id });
    if (!cult || !cult.sectName) return res.status(400).json({ message: 'Chưa gia nhập tông môn.' });
    if ((cult.sectContribution || 0) < attackPower) {
      return res.status(400).json({ message: `Không đủ Cống Hiến! Cần ${attackPower}.` });
    }

    const lm = LINH_MACH_LIST.find(l => l.id === linghMachId);
    if (!lm) return res.status(400).json({ message: 'Linh Mạch không tồn tại.' });

    // Process attack atomically in DB to prevent concurrent overwrites
    const { data: attackResult, error: attackErr } = await supabase.rpc('attack_linh_mach', {
      p_war_id:       war.id,
      p_linh_mach_id: linghMachId,
      p_sect_name:    cult.sectName,
      p_attacker:     req.user.username,
      p_attack_power: attackPower,
      p_max_hp:       lm.maxHp,
    });
    if (attackErr) throw attackErr;

    const { damage, captured, linh_mach_state: lmState } = attackResult;

    // Deduct contribution
    cult.sectContribution = Math.max(0, (cult.sectContribution || 0) - attackPower);
    await Cultivation.save(cult);

    broadcast('global', {
      type: 'sect_war_attack',
      attacker: req.user.username,
      sect: cult.sectName,
      target: lm.name,
      damage,
    });

    res.json({
      message: `⚔️ Tấn công ${lm.name}! Gây ${damage} sát thương!${captured ? ` 🏴 ${cult.sectName} chiếm được Linh Mạch!` : ''}`,
      damage,
      captured,
      linghMachState: lmState,
      remainingContribution: cult.sectContribution,
    });
  } catch (err) {
    console.error('attackLinhMach error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── GET /api/sect-war/leaderboard ────────────────────────────────────────────
export const getSectWarLeaderboard = async (req, res) => {
  try {
    const { data: war } = await supabase
      .from('sect_wars')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!war) return res.json({ leaderboard: [] });

    const scores = war.sect_scores || {};
    const lmStates = war.linh_mach_states || {};

    // Count controlled linh mach
    const controlled = {};
    for (const [lmId, state] of Object.entries(lmStates)) {
      if (state.controlledBy) {
        controlled[state.controlledBy] = (controlled[state.controlledBy] || 0) + 1;
      }
    }

    const leaderboard = Object.entries(scores)
      .map(([sectName, score]) => ({
        sectName,
        score,
        linghMachControlled: controlled[sectName] || 0,
      }))
      .sort((a, b) => b.linghMachControlled - a.linghMachControlled || b.score - a.score);

    res.json({ leaderboard, war });
  } catch (err) {
    console.error('getSectWarLeaderboard error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ─── Helper: settle war ────────────────────────────────────────────────────────
const settleWar = async (warId) => {
  try {
    await supabase.from('sect_wars').update({ settled: true }).eq('id', warId);
    broadcast('global', { type: 'sect_war_ended' });
  } catch (err) {
    console.error('settleWar error:', err);
  }
};

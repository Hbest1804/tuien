import supabase from '../config/supabase.js';

// ─── Constants (giữ nguyên từ MongoDB version) ───────────────────────────────

const REALM_STAGES = ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Đại Viên Mãn']
  .flatMap(k => Array.from({ length: 9 }, (_, i) => `${k} Tầng ${i + 1}`));

export const REALMS = [
  { id: 0, name: 'Luyện Khí',  color: '#7ed99e', expRequired: 1000,     stages: REALM_STAGES, successRate: 0.9, tribulationDamage: 0     },
  { id: 1, name: 'Trúc Cơ',   color: '#f2ca50', expRequired: 5000,     stages: REALM_STAGES, successRate: 0.75, tribulationDamage: 500   },
  { id: 2, name: 'Kim Đan',   color: '#f2ca50', expRequired: 20000,    stages: REALM_STAGES, successRate: 0.5,  tribulationDamage: 2000  },
  { id: 3, name: 'Nguyên Anh', color: '#b066ff', expRequired: 80000,    stages: REALM_STAGES, successRate: 0.3,  tribulationDamage: 10000 },
  { id: 4, name: 'Hóa Thần',  color: '#b066ff', expRequired: Infinity, stages: REALM_STAGES, successRate: 0.1,  tribulationDamage: 50000 },
];

export const SECONDS_PER_YEAR = 3600;
export const REALM_LIFESPAN = [100, 200, 500, 1000, Infinity];
export const LIFESPAN_DRAIN_PER_YEAR = [1, 1, 1, 1, 0];
export const PRACTICAL_INFINITY_LIFESPAN = 9999999;

export const BASE_SPEED = {
  散修: 0.1,
  宗门: 0.25,
};

export const SPIRIT_ROOT_MULTIPLIER = {
  Hoàng: 1.0,
  Huyền: 1.5,
  Địa: 2.0,
  Thiên: 3.0,
};

// ─── Helper: map DB row → JS object ──────────────────────────────────────────
export const mapCultivation = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    userId: row.user_id,
    isTraining: row.is_training,
    trainingStartedAt: row.training_started_at ? new Date(row.training_started_at) : null,
    expAccumulated: row.exp_accumulated,
    realmIndex: row.realm_index,
    sectName: row.sect_name,
    sectJoinedAt: row.sect_joined_at ? new Date(row.sect_joined_at) : null,
    sectContribution: row.sect_contribution,
    sectRank: row.sect_rank,
    sectMissions: row.sect_missions || [],
    lastMissionRefresh: row.last_mission_refresh ? new Date(row.last_mission_refresh) : null,
    activeMissionId: row.active_mission_id,
    lastStoppedAt: row.last_stopped_at ? new Date(row.last_stopped_at) : null,
    breakthroughReadyAt: row.breakthrough_ready_at ? new Date(row.breakthrough_ready_at) : null,
    lifespan: row.lifespan,
    failedBreakthroughs: row.failed_breakthroughs,
    dailyPillsConsumed: row.daily_pills_consumed || { count: 0, date: '' },
    isExploring: row.is_exploring,
    currentDungeonId: row.current_dungeon_id,
    exploreStartedAt: row.explore_started_at ? new Date(row.explore_started_at) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

// ─── Attach instance methods ──────────────────────────────────────────────────
const attachMethods = (cult) => {
  if (!cult) return null;

  cult.computeSpeedBase = function (spiritRootGrade) {
    const base = this.sectName ? BASE_SPEED['宗门'] : BASE_SPEED['散修'];
    const multiplier = SPIRIT_ROOT_MULTIPLIER[spiritRootGrade] || 1.0;
    return base * multiplier;
  };

  cult.computeSpeed = function (spiritRootGrade, inventorySpeedMultiplier = 1.0) {
    return this.computeSpeedBase(spiritRootGrade) * inventorySpeedMultiplier;
  };

  cult.computeCurrentExp = function (spiritRootGrade, inventory = null) {
    if (!this.isTraining || !this.trainingStartedAt) {
      return this.expAccumulated;
    }
    const now = Date.now();
    const startTime = this.trainingStartedAt.getTime();
    const baseSpeed = this.computeSpeedBase(spiritRootGrade);

    let totalExpGained = 0;

    if (typeof inventory === 'number') {
      const elapsed = (now - startTime) / 1000;
      totalExpGained = Math.max(0, elapsed * baseSpeed * inventory);
    } else if (!inventory || !inventory.activeBuffs || inventory.activeBuffs.length === 0) {
      const elapsed = (now - startTime) / 1000;
      totalExpGained = Math.max(0, elapsed * baseSpeed);
    } else {
      const events = [startTime, now];
      for (const buff of inventory.activeBuffs) {
        if (buff.buffType.startsWith('SPEED_')) {
          const expiresTime = new Date(buff.expiresAt).getTime();
          if (expiresTime > startTime && expiresTime < now) {
            if (!events.includes(expiresTime)) events.push(expiresTime);
          }
        }
      }
      events.sort((a, b) => a - b);

      for (let i = 0; i < events.length - 1; i++) {
        const segStart = events[i];
        const segEnd = events[i + 1];
        const elapsed = (segEnd - segStart) / 1000;
        if (elapsed > 0) {
          const midTime = segStart + (segEnd - segStart) / 2;
          let multiplier = 1.0;
          for (const buff of inventory.activeBuffs) {
            if (buff.buffType.startsWith('SPEED_')) {
              if (new Date(buff.expiresAt).getTime() > midTime) {
                multiplier *= buff.multiplier;
              }
            }
          }
          totalExpGained += elapsed * baseSpeed * multiplier;
        }
      }
    }

    const raw = this.expAccumulated + totalExpGained;
    const realm = REALMS[this.realmIndex];
    const cap = realm?.expRequired ?? Infinity;
    return Math.min(raw, cap);
  };

  cult.computeCurrentLifespan = function () {
    let drainSeconds = 0;
    if (!this.isTraining) {
      const stopTime = this.lastStoppedAt || this.createdAt || new Date();
      drainSeconds = (Date.now() - new Date(stopTime).getTime()) / 1000;
    }
    const drainYears = drainSeconds / SECONDS_PER_YEAR;
    const drainPerYear = LIFESPAN_DRAIN_PER_YEAR[this.realmIndex] ?? 0;
    return Math.max(0, this.lifespan - drainYears * drainPerYear);
  };

  cult.updateLifespan = function () {
    this.lifespan = this.computeCurrentLifespan();
  };

  cult.calculateAndSetBreakthroughReadyAt = function (spiritRootGrade, realm, inventorySpeedMultiplier = 1.0) {
    if (!this.breakthroughReadyAt) {
      const speed = this.computeSpeed(spiritRootGrade, inventorySpeedMultiplier);
      const expNeeded = Math.max(0, realm.expRequired - this.expAccumulated);
      const secondsToMax = speed > 0 ? expNeeded / speed : 0;
      const startTime = this.trainingStartedAt ? this.trainingStartedAt.getTime() : Date.now();
      this.breakthroughReadyAt = new Date(startTime + secondsToMax * 1000);
    }
  };

  cult.markModified = function () {}; // no-op (JSONB saves whole field)

  return cult;
};

// ─── Cultivation Model functions ──────────────────────────────────────────────
export const Cultivation = {
  async findOne(filter) {
    let query = supabase.from('cultivations').select('*');
    if (filter.userId || filter.user_id) query = query.eq('user_id', filter.userId || filter.user_id);
    if (filter._id || filter.id)         query = query.eq('id', filter._id || filter.id);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return attachMethods(mapCultivation(data));
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('cultivations').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return attachMethods(mapCultivation(data));
  },

  async findOneAndUpdate(filter, updates, opts = {}) {
    if (opts.upsert) {
      const userId = filter.userId || filter.user_id;
      const { data, error } = await supabase
        .from('cultivations')
        .upsert({ user_id: userId }, { onConflict: 'user_id' })
        .select('*')
        .single();
      if (error) throw error;
      return attachMethods(mapCultivation(data));
    }
    return null;
  },

  async find(filter = {}, opts = {}) {
    let query = supabase.from('cultivations').select('*');
    if (filter.userId?.$in) query = query.in('user_id', filter.userId.$in);
    if (opts.sort?.realmIndex === -1) {
      query = query.order('realm_index', { ascending: false })
                   .order('exp_accumulated', { ascending: false });
    }
    if (opts.limit) query = query.limit(opts.limit);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(row => attachMethods(mapCultivation(row)));
  },

  async save(cult) {
    const dbUpdates = {
      is_training:            cult.isTraining,
      training_started_at:    cult.trainingStartedAt,
      exp_accumulated:        cult.expAccumulated,
      realm_index:            cult.realmIndex,
      sect_name:              cult.sectName,
      sect_joined_at:         cult.sectJoinedAt,
      sect_contribution:      cult.sectContribution,
      sect_rank:              cult.sectRank,
      sect_missions:          cult.sectMissions,
      last_mission_refresh:   cult.lastMissionRefresh,
      active_mission_id:      cult.activeMissionId,
      last_stopped_at:        cult.lastStoppedAt,
      breakthrough_ready_at:  cult.breakthroughReadyAt,
      lifespan:               cult.lifespan,
      failed_breakthroughs:   cult.failedBreakthroughs,
      daily_pills_consumed:   cult.dailyPillsConsumed,
      is_exploring:           cult.isExploring,
      current_dungeon_id:     cult.currentDungeonId,
      explore_started_at:     cult.exploreStartedAt,
    };
    const { error } = await supabase
      .from('cultivations')
      .update(dbUpdates)
      .eq('id', cult.id || cult._id);
    if (error) throw error;
    return cult;
  },
};

export default Cultivation;

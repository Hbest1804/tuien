import supabase from '../config/supabase.js';

// ─── Helper: map DB row → JS object ──────────────────────────────────────────
export const mapInventory = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    userId: row.user_id,
    maxSlots: row.max_slots,
    items: row.items || [],
    equipment: row.equipment || { weapon: null, armor: null },
    techniquePassiveBonus: row.technique_passive_bonus || 0,
    activeBuffs: row.active_buffs || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // -- helper methods (attached after map)
  };
};

// ─── Attach methods to inventory plain object ─────────────────────────────────
const attachMethods = (inv) => {
  if (!inv) return null;

  inv.cleanExpiredBuffs = function () {
    const now = new Date();
    const before = this.activeBuffs.length;
    this.activeBuffs = this.activeBuffs.filter(b => new Date(b.expiresAt) > now);
    return this.activeBuffs.length !== before;
  };

  inv.getSpeedBuffMultiplier = function () {
    this.cleanExpiredBuffs();
    let total = 1.0;
    for (const buff of this.activeBuffs) {
      if (buff.buffType.startsWith('SPEED_')) {
        total *= buff.multiplier;
      }
    }
    return total;
  };

  inv.getTotalSpeedMultiplier = function () {
    return this.getSpeedBuffMultiplier() * (1 + (this.techniquePassiveBonus || 0));
  };

  inv.computeEquippedStats = function (ITEMS) {
    let atkBonus = 0;
    let defBonus = 0;
    let tribulationDefense = 0;
    if (this.equipment.weapon) {
      const item = ITEMS[this.equipment.weapon];
      if (item?.effects?.atkBonus)          atkBonus += item.effects.atkBonus;
      if (item?.effects?.defBonus)          defBonus += item.effects.defBonus;
      if (item?.effects?.tribulationDefense) tribulationDefense += item.effects.tribulationDefense;
    }
    if (this.equipment.armor) {
      const item = ITEMS[this.equipment.armor];
      if (item?.effects?.atkBonus)          atkBonus += item.effects.atkBonus;
      if (item?.effects?.defBonus)          defBonus += item.effects.defBonus;
      if (item?.effects?.tribulationDefense) tribulationDefense += item.effects.tribulationDefense;
    }
    return { atkBonus, defBonus, tribulationDefense };
  };

  // isModified tracker (to avoid unnecessary saves)
  inv._modified = false;
  inv.markModified = function () { this._modified = true; };
  inv.isModified   = function () { return this._modified; };

  return inv;
};

// ─── Inventory Model functions ────────────────────────────────────────────────
export const Inventory = {
  async findOne(filter) {
    let query = supabase.from('inventories').select('*');
    if (filter.userId || filter.user_id) query = query.eq('user_id', filter.userId || filter.user_id);
    if (filter._id || filter.id)         query = query.eq('id', filter._id || filter.id);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return attachMethods(mapInventory(data));
  },

  async findOneAndUpdate(filter, updates, opts = {}) {
    if (opts.upsert) {
      const userId = filter.userId || filter.user_id;
      const { data, error } = await supabase
        .from('inventories')
        .upsert({ user_id: userId }, { onConflict: 'user_id' })
        .select('*')
        .single();
      if (error) throw error;
      return attachMethods(mapInventory(data));
    }
    return null;
  },

  async save(inv) {
    const { error } = await supabase
      .from('inventories')
      .update({
        items: inv.items,
        equipment: inv.equipment,
        active_buffs: inv.activeBuffs,
        technique_passive_bonus: inv.techniquePassiveBonus,
        max_slots: inv.maxSlots,
      })
      .eq('id', inv.id || inv._id);
    if (error) throw error;
    inv._modified = false;
    return inv;
  },
};

export default Inventory;

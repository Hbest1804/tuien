import bcrypt from 'bcryptjs';
import supabase from '../config/supabase.js';

// ─── Helpers: map DB row → JS object ─────────────────────────────────────────
export const mapUser = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    username: row.username,
    email: row.email,
    password: row.password,
    gender: row.gender,
    spiritRoot: row.spirit_root,
    spiritRootGrade: row.spirit_root_grade,
    isCharacterCreated: row.is_character_created,
    spiritStones: row.spirit_stones,
    lastStoneCollectedAt: row.last_stone_collected_at,
    role: row.role || 'player',
    isBanned: row.is_banned || false,
    isMuted: row.is_muted || false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

// ─── User Model functions ─────────────────────────────────────────────────────

export const User = {
  /**
   * Tìm user theo điều kiện (trả về plain object với password)
   */
  async findOne(filter) {
    let query = supabase.from('users').select('*');
    if (filter.email) query = query.eq('email', filter.email.toLowerCase());
    if (filter.username) query = query.eq('username', filter.username);
    if (filter._id || filter.id) query = query.eq('id', filter._id || filter.id);
    if (filter.isCharacterCreated !== undefined) query = query.eq('is_character_created', filter.isCharacterCreated);

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return mapUser(data);
  },

  /**
   * Tìm user theo ID
   */
  async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return mapUser(data);
  },

  /**
   * Tạo user mới (hash password tự động)
   */
  async create({ username, email, password }) {
    const hashedPassword = await bcrypt.hash(password, 12);
    const { data, error } = await supabase
      .from('users')
      .insert({ username, email: email.toLowerCase(), password: hashedPassword })
      .select('*')
      .single();
    if (error) throw error;
    return mapUser(data);
  },

  /**
   * So sánh password khi đăng nhập
   */
  async comparePassword(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword);
  },

  /**
   * Cập nhật user theo ID
   */
  async findByIdAndUpdate(id, updates, { new: returnNew = false } = {}) {
    const dbUpdates = {};
    if (updates.gender !== undefined)              dbUpdates.gender = updates.gender;
    if (updates.spiritRoot !== undefined)          dbUpdates.spirit_root = updates.spiritRoot;
    if (updates.spiritRootGrade !== undefined)     dbUpdates.spirit_root_grade = updates.spiritRootGrade;
    if (updates.isCharacterCreated !== undefined)  dbUpdates.is_character_created = updates.isCharacterCreated;
    if (updates.spiritStones !== undefined)        dbUpdates.spirit_stones = updates.spiritStones;
    if (updates.lastStoneCollectedAt !== undefined) dbUpdates.last_stone_collected_at = updates.lastStoneCollectedAt;

    const { data, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return returnNew ? mapUser(data) : null;
  },

  /**
   * Atomic update: chỉ cập nhật nếu điều kiện khớp
   */
  async findOneAndUpdate(filter, updates, opts = {}) {
    const dbUpdates = {};
    if (updates.gender !== undefined)              dbUpdates.gender = updates.gender;
    if (updates.spiritRoot !== undefined)          dbUpdates.spirit_root = updates.spiritRoot;
    if (updates.spiritRootGrade !== undefined)     dbUpdates.spirit_root_grade = updates.spiritRootGrade;
    if (updates.isCharacterCreated !== undefined)  dbUpdates.is_character_created = updates.isCharacterCreated;
    if (updates.spiritStones !== undefined)        dbUpdates.spirit_stones = updates.spiritStones;

    let query = supabase.from('users').update(dbUpdates);
    if (filter._id || filter.id) query = query.eq('id', filter._id || filter.id);
    if (filter.isCharacterCreated !== undefined) query = query.eq('is_character_created', filter.isCharacterCreated);

    const { data, error } = await query.select('*').maybeSingle();
    if (error) throw error;
    return data ? mapUser(data) : null;
  },

  /**
   * Kiểm tra tồn tại
   */
  async exists(filter) {
    let query = supabase.from('users').select('id');
    if (filter._id || filter.id) query = query.eq('id', filter._id || filter.id);
    if (filter.email) query = query.eq('email', filter.email.toLowerCase());
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return !!data;
  },

  /**
   * Tìm nhiều users theo điều kiện
   */
  async find(filter = {}, opts = {}) {
    let query = supabase.from('users').select('*');
    if (filter.isCharacterCreated !== undefined) query = query.eq('is_character_created', filter.isCharacterCreated);
    if (filter._id?.$in) query = query.in('id', filter._id.$in);
    if (opts.sort?.spiritStones === -1) query = query.order('spirit_stones', { ascending: false });
    if (opts.limit) query = query.limit(opts.limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapUser);
  },

  /**
   * Tìm nhiều users với search, filter, phân trang cho Admin
   */
  async findMany({ search = '', isBanned, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    let query = supabase.from('users').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (isBanned !== undefined) {
      query = query.eq('is_banned', isBanned);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    return { users: (data || []).map(mapUser), total: count || 0 };
  },

  /**
   * Đếm tổng số users
   */
  async countAll() {
    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  },

  /**
   * Đếm users mới trong N ngày gần nhất
   */
  async countRecent(days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since);
    if (error) throw error;
    return count || 0;
  },

  /**
   * Lưu trực tiếp (dùng sau khi update spiritStones)
   */
  async save(userObj) {
    const dbUpdates = {
      spirit_stones: userObj.spiritStones,
      last_stone_collected_at: userObj.lastStoneCollectedAt,
      gender: userObj.gender,
      spirit_root: userObj.spiritRoot,
      spirit_root_grade: userObj.spiritRootGrade,
      is_character_created: userObj.isCharacterCreated,
    };
    const { data, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', userObj.id || userObj._id)
      .select('*')
      .single();
    if (error) throw error;
    return mapUser(data);
  },

  /**
   * Admin update — cập nhật role, ban, mute, spiritStones, v.v.
   */
  async adminUpdate(id, updates) {
    const dbUpdates = {};
    if (updates.role !== undefined)          dbUpdates.role = updates.role;
    if (updates.isBanned !== undefined)      dbUpdates.is_banned = updates.isBanned;
    if (updates.isMuted !== undefined)       dbUpdates.is_muted = updates.isMuted;
    if (updates.spiritStones !== undefined)  dbUpdates.spirit_stones = updates.spiritStones;
    if (updates.gender !== undefined)        dbUpdates.gender = updates.gender;
    if (updates.spiritRoot !== undefined)    dbUpdates.spirit_root = updates.spiritRoot;
    if (updates.spiritRootGrade !== undefined) dbUpdates.spirit_root_grade = updates.spiritRootGrade;

    const { data, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return mapUser(data);
  },
};

export default User;

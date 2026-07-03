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
    // Tìm trước
    let query = supabase.from('users').select('*');
    if (filter._id || filter.id) query = query.eq('id', filter._id || filter.id);
    if (filter.isCharacterCreated !== undefined) query = query.eq('is_character_created', filter.isCharacterCreated);

    const { data: existing, error: findError } = await query.maybeSingle();
    if (findError) throw findError;
    if (!existing) return null;

    // Cập nhật
    const dbUpdates = {};
    if (updates.gender !== undefined)              dbUpdates.gender = updates.gender;
    if (updates.spiritRoot !== undefined)          dbUpdates.spirit_root = updates.spiritRoot;
    if (updates.spiritRootGrade !== undefined)     dbUpdates.spirit_root_grade = updates.spiritRootGrade;
    if (updates.isCharacterCreated !== undefined)  dbUpdates.is_character_created = updates.isCharacterCreated;
    if (updates.spiritStones !== undefined)        dbUpdates.spirit_stones = updates.spiritStones;

    const { data, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', existing.id)
      .select('*')
      .single();
    if (error) throw error;
    return opts.new ? mapUser(data) : mapUser(existing);
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
};

export default User;

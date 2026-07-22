import supabase from '../config/supabase.js';

// ─── Helper: map DB row → JS object ──────────────────────────────────────────
export const mapRefreshToken = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    userId: row.user_id,
    token: row.token,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    isRevoked: row.is_revoked,
    createdAt: row.created_at,
  };
};

export const RefreshToken = {
  async create({ userId, token, expiresAt }) {
    const { data, error } = await supabase
      .from('refresh_tokens')
      .insert({ user_id: userId, token, expires_at: expiresAt })
      .select('*')
      .single();
    if (error) throw error;
    return mapRefreshToken(data);
  },

  async findOne(filter) {
    let query = supabase.from('refresh_tokens').select('*');
    if (filter.token)      query = query.eq('token', filter.token);
    if (filter.isRevoked !== undefined) query = query.eq('is_revoked', filter.isRevoked);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return mapRefreshToken(data);
  },

  async updateOne(filter, update) {
    const dbUpdates = {};
    if (update.isRevoked !== undefined) dbUpdates.is_revoked = update.isRevoked;
    let query = supabase.from('refresh_tokens').update(dbUpdates);
    if (filter.token)   query = query.eq('token', filter.token);
    if (filter._id || filter.id) query = query.eq('id', filter._id || filter.id);
    const { error } = await query;
    if (error) throw error;
  },

  async deleteOne(filter) {
    let query = supabase.from('refresh_tokens').delete();
    if (filter._id || filter.id) query = query.eq('id', filter._id || filter.id);
    if (filter.token)  query = query.eq('token', filter.token);
    const { error } = await query;
    if (error) throw error;
  },

  async save(tokenObj) {
    const { error } = await supabase
      .from('refresh_tokens')
      .update({ is_revoked: tokenObj.isRevoked })
      .eq('id', tokenObj.id || tokenObj._id);
    if (error) throw error;
  },

  /**
   * Thu hồi tất cả refresh tokens của một user (khi đổi mật khẩu)
   */
  async revokeAllForUser(userId) {
    const { error } = await supabase
      .from('refresh_tokens')
      .update({ is_revoked: true })
      .eq('user_id', userId)
      .eq('is_revoked', false);
    if (error) throw error;
  },

  /**
   * Xóa tất cả tokens hết hạn và đã bị revoke (dùng cho cron job)
   */
  async deleteExpired() {
    const now = new Date().toISOString();
    // Xóa tokens hết hạn
    const { error: e1 } = await supabase
      .from('refresh_tokens')
      .delete()
      .lt('expires_at', now);
    if (e1) throw e1;
    // Xóa tokens đã revoke quá 24 giờ
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { error: e2 } = await supabase
      .from('refresh_tokens')
      .delete()
      .eq('is_revoked', true)
      .lt('created_at', cutoff);
    if (e2) throw e2;
  },
};

export default RefreshToken;

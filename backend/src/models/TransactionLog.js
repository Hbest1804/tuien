import supabase from '../config/supabase.js';

// ─── Ghi log giao dịch ────────────────────────────────────────────────────────
export const logTransaction = async (userId, { type, itemId = null, itemName = null, quantity = 1, spiritStonesDelta, detail = {} }) => {
  try {
    await supabase.from('transaction_history').insert({
      user_id: userId,
      type,
      item_id: itemId,
      item_name: itemName,
      quantity,
      spirit_stones_delta: spiritStonesDelta,
      detail,
    });
  } catch (err) {
    // Ghi log không được fail silent — không ảnh hưởng business logic
    console.error('[TransactionLog] Error:', err.message);
  }
};

// ─── Lấy lịch sử giao dịch ───────────────────────────────────────────────────
export const getHistory = async (userId, { page = 1, type = null } = {}) => {
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('transaction_history')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    transactions: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  };
};

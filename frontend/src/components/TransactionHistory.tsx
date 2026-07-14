import { useState, useEffect } from 'react';
import { getTransactionHistory } from '../services/chatService';

interface Transaction {
  id: string;
  type: string;
  item_name: string | null;
  quantity: number;
  spirit_stones_delta: number;
  detail: any;
  created_at: string;
}

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  shop_buy:     { label: 'Mua Shop',    icon: '🛒', color: '#3b82f6' },
  shop_sell:    { label: 'Bán Shop',    icon: '💰', color: '#10b981' },
  auction_bid:  { label: 'Đặt Thầu',   icon: '🏮', color: '#f59e0b' },
  auction_win:  { label: 'Thắng ĐG',   icon: '🏆', color: '#a855f7' },
  auction_sell: { label: 'Bán ĐG',     icon: '📦', color: '#10b981' },
  combat_win:   { label: 'Chiến Thắng',icon: '⚔️', color: '#ef4444' },
  dungeon_reward:{ label: 'Bí Cảnh',   icon: '🗺️', color: '#06b6d4' },
};

export const TransactionHistory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  const load = async (p: number, type: string) => {
    setLoading(true);
    try {
      const res = await getTransactionHistory(p, type || undefined);
      setTransactions(res.data.transactions);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page, typeFilter); }, [page, typeFilter]);

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem' }}>
          📊 Lịch Sử Giao Dịch
        </h2>
        <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{total.toLocaleString()} giao dịch</div>
      </div>

      {/* Filter by type */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button
          onClick={() => { setTypeFilter(''); setPage(1); }}
          style={{
            padding: '0.3rem 0.7rem',
            borderRadius: '0.4rem',
            border: 'none',
            cursor: 'pointer',
            background: !typeFilter ? 'rgba(124,58,237,0.7)' : 'rgba(255,255,255,0.06)',
            color: !typeFilter ? '#fff' : '#94a3b8',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >Tất cả</button>
        {Object.entries(TYPE_LABELS).map(([type, meta]) => (
          <button
            key={type}
            onClick={() => { setTypeFilter(type); setPage(1); }}
            style={{
              padding: '0.3rem 0.7rem',
              borderRadius: '0.4rem',
              border: 'none',
              cursor: 'pointer',
              background: typeFilter === type ? 'rgba(124,58,237,0.7)' : 'rgba(255,255,255,0.06)',
              color: typeFilter === type ? '#fff' : '#94a3b8',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            {meta.icon} {meta.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#a78bfa', padding: '2rem' }}>Đang tải...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>
              Chưa có giao dịch nào.
            </div>
          ) : transactions.map(tx => {
            const meta = TYPE_LABELS[tx.type] || { label: tx.type, icon: '📌', color: '#94a3b8' };
            const isPositive = tx.spirit_stones_delta >= 0;
            return (
              <div
                key={tx.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '0.5rem',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{meta.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#e2e8f0' }}>
                    {meta.label} {tx.item_name ? `— ${tx.item_name}` : ''}
                    {tx.quantity > 1 ? ` ×${tx.quantity}` : ''}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem' }}>
                    {new Date(tx.created_at).toLocaleString('vi-VN')}
                  </div>
                </div>
                <div style={{
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: isPositive ? '#10b981' : '#ef4444',
                  whiteSpace: 'nowrap',
                }}>
                  {isPositive ? '+' : ''}{tx.spirit_stones_delta.toLocaleString()} 💎
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{
              padding: '0.4rem 0.75rem',
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: '0.4rem',
              color: '#94a3b8',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
            }}
          >← Trước</button>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '2' }}>
            {page}/{totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{
              padding: '0.4rem 0.75rem',
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: '0.4rem',
              color: '#94a3b8',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            }}
          >Sau →</button>
        </div>
      )}
    </div>
  );
};

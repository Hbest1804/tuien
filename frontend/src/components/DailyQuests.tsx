import { useState, useEffect } from 'react';
import { getDailyQuests, claimDailyQuest } from '../services/questService';

interface DailyQuest {
  questId: string;
  name: string;
  desc: string;
  icon: string;
  progress: number;
  targetCount: number;
  progressPct: number;
  completed: boolean;
  claimed: boolean;
  reward: { spiritStones?: number };
}

export const DailyQuests = () => {
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await getDailyQuests();
      setQuests(res.data.quests);
      setDate(res.data.date);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleClaim = async (questId: string) => {
    setClaiming(questId);
    try {
      await claimDailyQuest(questId);
      await load();
    } finally {
      setClaiming(null);
    }
  };

  if (loading) return (
    <div style={{ padding: '2rem', color: '#a78bfa', textAlign: 'center' }}>
      Đang tải nhiệm vụ hàng ngày...
    </div>
  );

  const completedCount = quests.filter(q => q.completed).length;
  const claimedCount = quests.filter(q => q.claimed).length;

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.4rem' }}>
          📋 Nhiệm Vụ Hàng Ngày
        </h2>
        <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
          Ngày: {date} — Hoàn thành: {completedCount}/{quests.length} — Đã nhận: {claimedCount}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {quests.map(q => (
          <div
            key={q.questId}
            style={{
              background: q.claimed
                ? 'rgba(16,185,129,0.08)'
                : q.completed
                  ? 'rgba(245,158,11,0.1)'
                  : 'rgba(255,255,255,0.04)',
              border: `1px solid ${q.claimed ? 'rgba(16,185,129,0.25)' : q.completed ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '0.75rem',
              padding: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{q.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 600,
                  color: q.claimed ? '#10b981' : '#e2e8f0',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  {q.name}
                  {q.claimed && <span style={{ fontSize: '0.7rem', color: '#10b981' }}>✅ Đã nhận</span>}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{q.desc}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.85rem' }}>
                  +{q.reward?.spiritStones?.toLocaleString() || 0} 💎
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                flex: 1,
                height: '6px',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '999px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, q.progressPct * 100)}%`,
                  background: q.completed
                    ? 'linear-gradient(90deg, #10b981, #34d399)'
                    : 'linear-gradient(90deg, #7c3aed, #a855f7)',
                  borderRadius: '999px',
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <span style={{ color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                {q.progress}/{q.targetCount}
              </span>
              {q.completed && !q.claimed && (
                <button
                  onClick={() => handleClaim(q.questId)}
                  disabled={claiming === q.questId}
                  style={{
                    padding: '0.3rem 0.75rem',
                    background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    opacity: claiming === q.questId ? 0.6 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {claiming === q.questId ? '...' : '🎁 Nhận'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { getMainQuests, checkMainQuest } from '../services/questService';

interface MainQuest {
  id: string;
  title: string;
  desc: string;
  detail: string;
  icon: string;
  reward: { spiritStones?: number; itemId?: string; itemQty?: number };
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  index: number;
}

export const MainQuestPanel = () => {
  const [quests, setQuests] = useState<MainQuest[]>([]);
  const [currentQuest, setCurrentQuest] = useState<MainQuest | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{ message: string; completed: boolean } | null>(null);

  const load = async () => {
    try {
      const res = await getMainQuests();
      setQuests(res.data.quests);
      setCurrentQuest(res.data.currentQuest);
      setCompletedCount(res.data.completedCount);
      setTotalCount(res.data.totalCount);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCheck = async () => {
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await checkMainQuest();
      setCheckResult({ message: res.data.message, completed: res.data.completed });
      if (res.data.completed) {
        await load();
      }
    } catch (err: any) {
      setCheckResult({ message: err.response?.data?.message || 'Lỗi server', completed: false });
    } finally {
      setChecking(false);
    }
  };

  if (loading) return (
    <div style={{ padding: '2rem', color: '#a78bfa', textAlign: 'center' }}>Đang tải...</div>
  );

  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem' }}>
          📜 Nhiệm Vụ Chính
        </h2>
        {/* Overall progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
              borderRadius: '999px', transition: 'width 0.5s',
            }} />
          </div>
          <span style={{ color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* Current quest highlight */}
      {currentQuest && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(168,85,247,0.1))',
          border: '1px solid rgba(168,85,247,0.4)',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.6rem' }}>{currentQuest.icon}</span>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#a78bfa', fontWeight: 600 }}>
                NHIỆM VỤ HIỆN TẠI #{currentQuest.index}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0' }}>
                {currentQuest.title}
              </div>
            </div>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>
            {currentQuest.detail}
          </p>
          {currentQuest.reward && (
            <div style={{ fontSize: '0.8rem', color: '#f59e0b', marginBottom: '0.75rem' }}>
              🎁 Phần thưởng: {currentQuest.reward.spiritStones?.toLocaleString()} 💎
              {currentQuest.reward.itemId && ` + ${currentQuest.reward.itemQty}x vật phẩm`}
            </div>
          )}
          <button
            onClick={handleCheck}
            disabled={checking}
            style={{
              padding: '0.5rem 1.25rem',
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              border: 'none',
              borderRadius: '0.5rem',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.85rem',
              opacity: checking ? 0.6 : 1,
            }}
          >
            {checking ? '⏳ Kiểm tra...' : '✅ Kiểm tra hoàn thành'}
          </button>
          {checkResult && (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              background: checkResult.completed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.1)',
              color: checkResult.completed ? '#10b981' : '#ef4444',
              fontSize: '0.85rem',
            }}>
              {checkResult.message}
            </div>
          )}
        </div>
      )}

      {/* Quest list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {quests.map(q => (
          <div
            key={q.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              background: q.isCompleted
                ? 'rgba(16,185,129,0.07)'
                : q.isCurrent
                  ? 'rgba(124,58,237,0.12)'
                  : 'rgba(255,255,255,0.02)',
              border: `1px solid ${q.isCompleted ? 'rgba(16,185,129,0.2)' : q.isCurrent ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: '0.5rem',
              opacity: q.isLocked ? 0.4 : 1,
            }}
          >
            <span style={{ fontSize: '1.2rem', minWidth: '1.8rem', textAlign: 'center' }}>
              {q.isCompleted ? '✅' : q.isLocked ? '🔒' : q.icon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 600,
                fontSize: '0.85rem',
                color: q.isCompleted ? '#10b981' : q.isLocked ? '#475569' : '#e2e8f0',
              }}>
                {q.index}. {q.title}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{q.desc}</div>
            </div>
            {q.reward?.spiritStones && (
              <div style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                +{q.reward.spiritStones.toLocaleString()} 💎
              </div>
            )}
          </div>
        ))}
      </div>

      {completedCount === totalCount && totalCount > 0 && (
        <div style={{
          marginTop: '1.5rem', textAlign: 'center',
          color: '#f59e0b', fontWeight: 700, fontSize: '1.1rem',
        }}>
          🎊 Đã hoàn thành toàn bộ nhiệm vụ chính!
        </div>
      )}
    </div>
  );
};

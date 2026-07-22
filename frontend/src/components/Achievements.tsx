import { useState, useEffect } from 'react';
import { getAchievements } from '../services/achievementService';

interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  titleReward: string | null;
  isUnlocked: boolean;
  unlockedAt: string | null;
}

export const Achievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeTitle, setActiveTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  useEffect(() => {
    getAchievements().then(res => {
      setAchievements(res.data.achievements);
      setActiveTitle(res.data.activeTitle);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = achievements.filter(a => {
    if (filter === 'unlocked') return a.isUnlocked;
    if (filter === 'locked') return !a.isUnlocked;
    return true;
  });

  const unlocked = achievements.filter(a => a.isUnlocked).length;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#a78bfa' }}>
      Đang tải thành tựu...
    </div>
  );

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem' }}>
          🏆 Thành Tựu
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.85rem',
            color: '#fff',
            fontWeight: 600,
          }}>
            {unlocked}/{achievements.length} Mở khóa
          </span>
          {activeTitle && (
            <span style={{
              background: 'linear-gradient(135deg, #d97706, #f59e0b)',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.85rem',
              color: '#fff',
              fontWeight: 600,
            }}>
              Danh hiệu: {activeTitle}
            </span>
          )}
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {(['all', 'unlocked', 'locked'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8rem',
              background: filter === f ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.05)',
              color: filter === f ? '#fff' : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            {f === 'all' ? 'Tất cả' : f === 'unlocked' ? '✅ Đã mở' : '🔒 Chưa mở'}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '0.75rem',
      }}>
        {filtered.map(ach => (
          <div
            key={ach.id}
            style={{
              background: ach.isUnlocked
                ? 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(168,85,247,0.1))'
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${ach.isUnlocked ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '0.75rem',
              padding: '1rem',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start',
              opacity: ach.isUnlocked ? 1 : 0.6,
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              fontSize: '2rem',
              filter: ach.isUnlocked ? 'none' : 'grayscale(1)',
              minWidth: '2.5rem',
              textAlign: 'center',
            }}>
              {ach.isUnlocked ? ach.icon : '🔒'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 700,
                color: ach.isUnlocked ? '#e2e8f0' : '#64748b',
                fontSize: '0.9rem',
                marginBottom: '0.25rem',
              }}>
                {ach.name}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.4 }}>
                {ach.desc}
              </div>
              {ach.titleReward && (
                <div style={{
                  marginTop: '0.4rem',
                  fontSize: '0.72rem',
                  color: '#f59e0b',
                  fontWeight: 600,
                }}>
                  🎖️ Danh hiệu: {ach.titleReward}
                </div>
              )}
              {ach.isUnlocked && ach.unlockedAt && (
                <div style={{ marginTop: '0.3rem', fontSize: '0.7rem', color: '#64748b' }}>
                  {new Date(ach.unlockedAt).toLocaleDateString('vi-VN')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem', fontSize: '0.9rem' }}>
          Không có thành tựu nào.
        </div>
      )}
    </div>
  );
};

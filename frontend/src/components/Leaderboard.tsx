import { useState, useEffect } from 'react';
import { Trophy, Crown, Flame, Users, Gem, ChevronUp, ChevronDown } from 'lucide-react';
import { getLeaderboard, LeaderboardEntry } from '../services/leaderboardService';
import { useAuth } from '../context/AuthContext';

const GRADE_COLORS: Record<string, { color: string; label: string }> = {
  'Thiên': { color: '#ff6b6b', label: 'Thiên' },
  'Địa':   { color: '#b066ff', label: 'Địa' },
  'Huyền': { color: '#f2ca50', label: 'Huyền' },
  'Hoàng': { color: '#7ed99e', label: 'Hoàng' },
};

const RANK_STYLES = [
  { bg: 'rgba(255, 215, 0, 0.15)',  border: 'rgba(255, 215, 0, 0.4)',  icon: '🥇', glow: '0 0 20px rgba(255,215,0,0.3)' },
  { bg: 'rgba(192, 192, 192, 0.1)', border: 'rgba(192,192,192,0.3)',   icon: '🥈', glow: '0 0 15px rgba(192,192,192,0.2)' },
  { bg: 'rgba(205, 127, 50, 0.1)',  border: 'rgba(205,127,50,0.3)',    icon: '🥉', glow: '0 0 15px rgba(205,127,50,0.2)' },
];

export default function Leaderboard() {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [type, setType] = useState<'realm' | 'stones'>('realm');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getLeaderboard(type);
        setRankings(res.data.leaderboard);
      } catch (err) {
        setError('Không thể tải bảng xếp hạng.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [type]);

  return (
    <div className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop py-8 fade-in-up">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-30" />
            <Trophy size={40} className="text-primary relative" />
          </div>
        </div>
        <h1 className="font-headline-lg text-[36px] md:text-[48px] gradient-text-gold mb-3">
          Thiên Kiêu Bảng
        </h1>
        <p className="text-on-surface-variant text-sm">
          Top 50 tu sĩ mạnh nhất trong thiên hạ
        </p>
      </div>

      {/* Type toggle */}
      <div className="flex justify-center mb-8">
        <div className="flex rounded-xl overflow-hidden border border-primary/20 bg-surface-container/30">
          <button
            onClick={() => setType('realm')}
            className={`flex items-center gap-2 px-6 py-2.5 font-label-caps text-xs transition-all ${
              type === 'realm' ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <Flame size={13} /> Cảnh Giới
          </button>
          <button
            onClick={() => setType('stones')}
            className={`flex items-center gap-2 px-6 py-2.5 font-label-caps text-xs transition-all ${
              type === 'stones' ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <Gem size={13} /> Linh Thạch
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-surface-container animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 text-error">{error}</div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-16">
          <Users size={48} className="mx-auto mb-4 text-on-surface-variant opacity-30" />
          <p className="text-on-surface-variant">Chưa có tu sĩ nào trong bảng xếp hạng.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Top 3 showcase */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {rankings.slice(0, 3).map((entry, i) => {
              const style = RANK_STYLES[i];
              const gradeConfig = GRADE_COLORS[entry.spiritRootGrade || ''] || { color: '#a09682', label: '?' };
              const isMe = entry.userId === user?._id;
              return (
                <div
                  key={entry.userId}
                  className={`relative rounded-2xl p-4 text-center flex flex-col items-center gap-2 ${isMe ? 'ring-2 ring-primary' : ''}`}
                  style={{ background: style.bg, border: `1px solid ${style.border}`, boxShadow: style.glow }}
                >
                  {isMe && <div className="absolute -top-2 -right-2 text-[8px] font-label-caps bg-primary text-background px-2 py-0.5 rounded-full">BẠN</div>}
                  <div className="text-2xl">{style.icon}</div>
                  <div className="font-label-caps text-[9px]" style={{ color: gradeConfig.color }}>
                    #{entry.rank} · {entry.spiritRoot} {entry.spiritRootGrade}
                  </div>
                  <div className="font-headline-sm text-sm text-on-background truncate max-w-full px-1">{entry.username}</div>
                  <div className="font-label-caps text-[10px] px-2 py-0.5 rounded-full" style={{ color: entry.realmColor, backgroundColor: `${entry.realmColor}20` }}>
                    {entry.realmName}
                  </div>
                  {entry.sectName && (
                    <div className="font-label-caps text-[9px] text-on-surface-variant/60">[{entry.sectName}]</div>
                  )}
                  <div className="text-xs font-bold" style={{ color: type === 'stones' ? '#f2ca50' : entry.realmColor }}>
                    {type === 'stones'
                      ? `💎 ${entry.spiritStones.toLocaleString()}`
                      : `${entry.expAccumulated.toLocaleString()} EXP`
                    }
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rank list (4-50) */}
          {rankings.slice(3).map((entry) => {
            const gradeConfig = GRADE_COLORS[entry.spiritRootGrade || ''] || { color: '#a09682', label: '?' };
            const isMe = entry.userId === user?._id;
            return (
              <div
                key={entry.userId}
                className={`flex items-center gap-4 p-3 rounded-xl border transition-all hover:bg-white/3 ${
                  isMe ? 'border-primary/40 bg-primary/5' : 'border-white/5 bg-surface-container/20'
                }`}
              >
                {/* Rank */}
                <div className="w-8 text-center font-label-caps text-sm text-on-surface-variant shrink-0">
                  #{entry.rank}
                </div>

                {/* Username + root */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-on-background truncate">{entry.username}</span>
                    {isMe && <span className="font-label-caps text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full shrink-0">BẠN</span>}
                  </div>
                  <div className="font-label-caps text-[9px] mt-0.5" style={{ color: gradeConfig.color }}>
                    {entry.spiritRoot} {entry.spiritRootGrade}
                    {entry.sectName && <span className="text-on-surface-variant/50 ml-1">[{entry.sectName}]</span>}
                  </div>
                </div>

                {/* Realm */}
                <div className="hidden sm:block">
                  <span className="font-label-caps text-[9px] px-2 py-0.5 rounded-full" style={{ color: entry.realmColor, backgroundColor: `${entry.realmColor}15` }}>
                    {entry.realmName}
                  </span>
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold" style={{ color: type === 'stones' ? '#f2ca50' : entry.realmColor }}>
                    {type === 'stones'
                      ? `💎 ${entry.spiritStones.toLocaleString()}`
                      : `${entry.expAccumulated.toLocaleString()}`
                    }
                  </div>
                  <div className="text-[9px] text-on-surface-variant/50">
                    {type === 'stones' ? 'Linh Thạch' : 'EXP'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

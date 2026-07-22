import { useState, useEffect } from 'react';
import { getPvpStatus, getPvpRankings, findRandomOpponent, challengePlayer } from '../services/pvpService';
import { Trophy, Swords, Search, Crown, Shield } from 'lucide-react';

type PvpStatus = {
  rating: number; wins: number; losses: number;
  tier: { name: string; color: string; icon: string };
  history: any[];
};

type Ranking = {
  rank: number; userId: string; username: string;
  spiritRootGrade: string; rating: number; wins: number; losses: number;
  tier: { name: string; color: string; icon: string };
};

export function PvPArena() {
  const [status, setStatus] = useState<PvpStatus | null>(null);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [tab, setTab] = useState<'arena' | 'rank' | 'history'>('arena');
  const [targetName, setTargetName] = useState('');
  const [opponent, setOpponent] = useState<any | null>(null);
  const [battleResult, setBattleResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [fighting, setFighting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetch = async () => {
    try {
      const [statusRes, rankRes] = await Promise.all([getPvpStatus(), getPvpRankings()]);
      setStatus(statusRes.data);
      setRankings(rankRes.data.rankings || []);
    } catch { }
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type }); setTimeout(() => setMessage(null), 4000);
  };

  const handleFindOpponent = async () => {
    setFighting(true);
    try {
      const res = await findRandomOpponent();
      setOpponent(res.data.opponent);
    } catch (e: any) {
      showMsg(e.response?.data?.message || 'Không tìm thấy đối thủ', 'error');
    }
    setFighting(false);
  };

  const handleChallenge = async (username?: string) => {
    const target = username || targetName.trim();
    if (!target) return;
    setFighting(true);
    try {
      const res = await challengePlayer(target);
      setBattleResult(res.data);
      const newStatus = await getPvpStatus();
      setStatus(newStatus.data);
    } catch (e: any) {
      showMsg(e.response?.data?.message || 'Lỗi thách đấu', 'error');
    }
    setFighting(false);
    setOpponent(null);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-error/30 border-t-error animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="font-label-caps text-error tracking-[0.2em] mb-2">Chiến Đấu</div>
        <h1 className="font-headline-xl text-[40px] text-error drop-shadow-[0_0_20px_rgba(255,100,100,0.4)]">
          ⚔️ Lôi Đài PvP
        </h1>
        <p className="text-on-surface-variant mt-2">Thách đấu tu sĩ khắp thiên hạ, leo rank Tiên Vương.</p>
      </div>

      {/* Toast */}
      {message && (
        <div className={`fixed top-24 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl text-sm font-medium max-w-sm
          ${message.type === 'success' ? 'bg-secondary/20 border border-secondary text-secondary' : 'bg-error/20 border border-error text-error'}`}>
          {message.text}
        </div>
      )}

      {/* My Status Card */}
      {status && (
        <div className="glass-panel rounded-2xl p-6 mb-6 border border-error/20">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="text-center">
              <div className="text-5xl mb-1" style={{ filter: `drop-shadow(0 0 12px ${status.tier.color})` }}>
                {status.tier.icon}
              </div>
              <div className="font-semibold" style={{ color: status.tier.color }}>{status.tier.name}</div>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">{status.rating}</div>
                <div className="text-xs text-on-surface-variant">Rating</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-secondary">{status.wins}</div>
                <div className="text-xs text-on-surface-variant">Thắng</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-error">{status.losses}</div>
                <div className="text-xs text-on-surface-variant">Thua</div>
              </div>
            </div>
            <div className="text-sm text-on-surface-variant">
              <div>Tỷ lệ thắng: <span className="text-secondary font-semibold">
                {status.wins + status.losses > 0 ? Math.round(status.wins / (status.wins + status.losses) * 100) : 0}%
              </span></div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-surface-container rounded-xl p-1">
        {[
          { id: 'arena', label: '⚔️ Lôi Đài', icon: Swords },
          { id: 'rank', label: '🏆 Bảng Rank', icon: Trophy },
          { id: 'history', label: '📜 Lịch Sử', icon: Shield },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all
              ${tab === t.id ? 'bg-error text-white shadow' : 'text-on-surface-variant hover:text-on-background'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Arena tab */}
      {tab === 'arena' && (
        <div className="space-y-5">
          {/* Find random opponent */}
          <div className="glass-panel rounded-2xl p-5 border border-primary/20">
            <h3 className="font-semibold text-on-background mb-3 flex items-center gap-2">
              <Search size={18} className="text-primary" /> Tìm Đối Thủ Ngẫu Nhiên
            </h3>
            {opponent ? (
              <div className="bg-error/10 border border-error/30 rounded-xl p-4 mb-3">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <div className="font-semibold text-on-background">{opponent.username}</div>
                    <div className="text-sm text-on-surface-variant">
                      {opponent.tier?.icon} {opponent.tier?.name} · Rating: {opponent.rating}
                    </div>
                  </div>
                  <button
                    onClick={() => handleChallenge(opponent.username)}
                    disabled={fighting}
                    className="bg-error text-white px-5 py-2 rounded-lg font-semibold hover:bg-red-600 transition-all disabled:opacity-50"
                  >
                    {fighting ? '⚡ Đang đánh...' : '⚔️ Thách Đấu!'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={handleFindOpponent} disabled={fighting}
                className="w-full bg-primary/20 border border-primary text-primary py-3 rounded-xl hover:bg-primary/30 transition-all disabled:opacity-50 font-medium">
                {fighting ? 'Đang tìm...' : '🔍 Tìm Đối Thủ'}
              </button>
            )}
          </div>

          {/* Direct challenge */}
          <div className="glass-panel rounded-2xl p-5 border border-error/20">
            <h3 className="font-semibold text-on-background mb-3 flex items-center gap-2">
              <Swords size={18} className="text-error" /> Thách Đấu Trực Tiếp
            </h3>
            <div className="flex gap-3">
              <input
                value={targetName}
                onChange={e => setTargetName(e.target.value)}
                placeholder="Nhập tên tu sĩ..."
                className="flex-1 bg-surface-container border border-on-surface-variant/30 rounded-xl px-4 py-2.5 text-on-background text-sm focus:outline-none focus:border-error/50"
                onKeyDown={e => e.key === 'Enter' && handleChallenge()}
              />
              <button onClick={() => handleChallenge()} disabled={fighting || !targetName.trim()}
                className="bg-error text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-red-600 transition-all disabled:opacity-50">
                {fighting ? '...' : '⚔️'}
              </button>
            </div>
          </div>

          {/* Battle result */}
          {battleResult && (
            <div className={`glass-panel rounded-2xl p-6 border ${battleResult.won ? 'border-secondary/40' : 'border-error/40'}`}>
              <div className="text-center mb-4">
                <div className="text-5xl mb-2">{battleResult.won ? '🏆' : '💀'}</div>
                <h3 className={`text-xl font-bold ${battleResult.won ? 'text-secondary' : 'text-error'}`}>
                  {battleResult.won ? 'CHIẾN THẮNG!' : 'THUA TRẬN!'}
                </h3>
                <p className="text-on-surface-variant text-sm mt-1">{battleResult.message}</p>
              </div>
              <div className="flex justify-center gap-6 text-center">
                <div>
                  <div className={`text-2xl font-bold ${battleResult.ratingChange >= 0 ? 'text-secondary' : 'text-error'}`}>
                    {battleResult.ratingChange >= 0 ? '+' : ''}{battleResult.ratingChange}
                  </div>
                  <div className="text-xs text-on-surface-variant">Rating thay đổi</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{battleResult.newRating}</div>
                  <div className="text-xs text-on-surface-variant">Rating mới</div>
                </div>
                <div>
                  <div className="text-xl">{battleResult.newTier?.icon}</div>
                  <div className="text-xs font-semibold" style={{ color: battleResult.newTier?.color }}>
                    {battleResult.newTier?.name}
                  </div>
                </div>
              </div>
              <button onClick={() => setBattleResult(null)}
                className="w-full mt-4 bg-surface-container border border-on-surface-variant/30 text-on-surface-variant py-2 rounded-lg hover:border-primary/40 transition-all text-sm">
                Đóng
              </button>
            </div>
          )}
        </div>
      )}

      {/* Rankings tab */}
      {tab === 'rank' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-primary/20">
          <div className="p-4 border-b border-primary/10">
            <h3 className="font-semibold text-primary flex items-center gap-2"><Crown size={18} /> Bảng Xếp Hạng Lôi Đài</h3>
          </div>
          <div className="divide-y divide-primary/10">
            {rankings.map((r) => (
              <div key={r.userId}
                className={`flex items-center px-4 py-3 hover:bg-surface-container/40 transition-colors
                ${r.rank <= 3 ? 'bg-primary/5' : ''}`}>
                <div className="w-8 text-center font-bold text-sm" style={{ color: r.rank === 1 ? '#FFD700' : r.rank === 2 ? '#C0C0C0' : r.rank === 3 ? '#CD7F32' : '#666' }}>
                  {r.rank === 1 ? '👑' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}
                </div>
                <div className="flex-1 ml-3">
                  <div className="font-medium text-on-background text-sm">{r.username}</div>
                  <div className="text-xs text-on-surface-variant">{r.tier.icon} {r.tier.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary text-sm">{r.rating}</div>
                  <div className="text-xs text-on-surface-variant">{r.wins}W / {r.losses}L</div>
                </div>
              </div>
            ))}
            {rankings.length === 0 && (
              <div className="p-8 text-center text-on-surface-variant">Chưa có dữ liệu xếp hạng.</div>
            )}
          </div>
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-primary/20">
          <div className="p-4 border-b border-primary/10">
            <h3 className="font-semibold text-on-background">📜 Lịch Sử Trận Đấu</h3>
          </div>
          <div className="divide-y divide-primary/10">
            {(status?.history || []).slice().reverse().map((h: any, i: number) => (
              <div key={i} className="flex items-center px-4 py-3">
                <div className="text-lg mr-3">{h.won ? '🏆' : '💀'}</div>
                <div className="flex-1">
                  <div className="text-sm text-on-background">vs <span className="font-semibold">{h.opponent}</span></div>
                  <div className="text-xs text-on-surface-variant">{new Date(h.at).toLocaleString('vi-VN')}</div>
                </div>
                <div className={`text-sm font-bold ${h.ratingChange >= 0 ? 'text-secondary' : 'text-error'}`}>
                  {h.ratingChange >= 0 ? '+' : ''}{h.ratingChange}
                </div>
              </div>
            ))}
            {(!status?.history || status.history.length === 0) && (
              <div className="p-8 text-center text-on-surface-variant">Chưa có lịch sử chiến đấu.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

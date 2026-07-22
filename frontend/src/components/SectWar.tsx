import { useState, useEffect } from 'react';
import { getSectWarStatus, getSectWarLeaderboard, declareWar, attackLinhMach } from '../services/sectWarService';
import { Shield, Sword, Clock, Trophy } from 'lucide-react';

export function SectWar() {
  const [status, setStatus] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [tab, setTab] = useState<'map' | 'rank'>('map');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [attackPower, setAttackPower] = useState(100);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const fetch = async () => {
    try {
      const [sRes, lRes] = await Promise.all([getSectWarStatus(), getSectWarLeaderboard()]);
      setStatus(sRes.data);
      setTimeLeft(sRes.data.timeLeft || 0);
      setLeaderboard(lRes.data.leaderboard || []);
    } catch { }
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(p => Math.max(0, p - 1000)), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const showMsg = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage({ text, type }); setTimeout(() => setMessage(null), 4000);
  };

  const formatTime = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDeclare = async () => {
    setActing(true);
    try {
      const res = await declareWar();
      showMsg(res.data.message, 'success');
      await fetch();
    } catch (e: any) {
      showMsg(e.response?.data?.message || 'Lỗi server', 'error');
    }
    setActing(false);
  };

  const handleAttack = async (lmId: string) => {
    setActing(true);
    try {
      const res = await attackLinhMach(lmId, attackPower);
      showMsg(res.data.message, res.data.captured ? 'success' : 'info');
      await fetch();
    } catch (e: any) {
      showMsg(e.response?.data?.message || 'Lỗi server', 'error');
    }
    setActing(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-error/30 border-t-error animate-spin" />
    </div>
  );

  const war = status?.currentWar;
  const linghMachStates = war?.linh_mach_states || {};
  const linghMachList = status?.linghMachList || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="font-label-caps text-error tracking-[0.2em] mb-2">Đại Chiến</div>
        <h1 className="font-headline-xl text-[40px] text-error">🌋 Tông Môn Chiến</h1>
        <p className="text-on-surface-variant mt-2">Tranh giành Linh Mạch — ai chiếm được nhiều nhất sẽ thắng!</p>
      </div>

      {/* Toast */}
      {message && (
        <div className={`fixed top-24 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl text-sm font-medium max-w-sm
          ${message.type === 'success' ? 'bg-secondary/20 border border-secondary text-secondary' :
            message.type === 'error' ? 'bg-error/20 border border-error text-error' :
              'bg-primary/20 border border-primary text-primary'}`}>
          {message.text}
        </div>
      )}

      {/* War status banner */}
      {status?.warActive ? (
        <div className="glass-panel rounded-2xl p-5 mb-6 border border-error/40 bg-error/5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-error animate-pulse" />
              <span className="text-error font-bold">⚔️ TÔNG MÔN CHIẾN ĐANG DIỄN RA</span>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Clock size={16} />
              <span className="font-mono text-lg text-primary">{formatTime(timeLeft)}</span>
            </div>
          </div>
          <div className="mt-2 text-sm text-on-surface-variant">Khai chiến bởi: <span className="text-error font-semibold">{war?.declared_by}</span></div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-5 mb-6 border border-on-surface-variant/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-on-surface-variant text-sm">Chưa có Tông Môn Chiến nào.</div>
              <div className="text-xs text-on-surface-variant/60 mt-1">Chỉ Tông Chủ mới có thể tuyên chiến.</div>
            </div>
            <button onClick={handleDeclare} disabled={acting}
              className="bg-error text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-red-600 transition-all disabled:opacity-50">
              {acting ? '...' : '🔥 Tuyên Chiến!'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-surface-container rounded-xl p-1">
        {[{ id: 'map', label: '🗺 Bản Đồ Linh Mạch' }, { id: 'rank', label: '🏆 Xếp Hạng Tông Môn' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all
              ${tab === t.id ? 'bg-error text-white' : 'text-on-surface-variant hover:text-on-background'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Map tab */}
      {tab === 'map' && (
        <div className="space-y-4">
          {/* Attack power slider */}
          {status?.warActive && (
            <div className="glass-panel rounded-xl p-4 border border-primary/20">
              <label className="text-sm text-on-surface-variant mb-2 block">
                Lực tấn công: <span className="text-primary font-bold">{attackPower}</span> Cống Hiến
              </label>
              <input type="range" min={50} max={500} step={50} value={attackPower}
                onChange={e => setAttackPower(Number(e.target.value))}
                className="w-full accent-primary" />
              <div className="flex justify-between text-xs text-on-surface-variant/60 mt-1">
                <span>50</span><span>500</span>
              </div>
            </div>
          )}

          {/* Linh Mach cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {linghMachList.map((lm: any) => {
              const lmState = linghMachStates[lm.id] || { currentHp: lm.maxHp, controlledBy: null };
              const hpPercent = (lmState.currentHp / lm.maxHp) * 100;
              const controlled = !!lmState.controlledBy;

              return (
                <div key={lm.id} className={`glass-panel rounded-2xl p-5 border transition-all
                  ${controlled ? 'border-primary/40 bg-primary/5' : 'border-error/20'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-on-background">{lm.name}</h3>
                      <p className="text-xs text-on-surface-variant mt-0.5">{lm.desc}</p>
                    </div>
                    {controlled && (
                      <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full font-semibold">
                        🏴 {lmState.controlledBy}
                      </span>
                    )}
                  </div>

                  {/* HP Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-on-surface-variant mb-1">
                      <span>Linh Mạch HP</span>
                      <span>{lmState.currentHp.toLocaleString()} / {lm.maxHp.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-error to-primary rounded-full transition-all duration-500"
                        style={{ width: `${hpPercent}%` }} />
                    </div>
                  </div>

                  <div className="text-xs text-primary mb-3">💎 Bonus: +{lm.spiritBonus} Linh Thạch/giờ</div>

                  {status?.warActive && (
                    <button onClick={() => handleAttack(lm.id)} disabled={acting}
                      className="w-full bg-error/20 border border-error text-error py-2 rounded-xl hover:bg-error/30 transition-all disabled:opacity-50 text-sm font-semibold">
                      {acting ? '...' : `⚔️ Tấn Công (-${attackPower} Cống Hiến)`}
                    </button>
                  )}

                  {/* Recent attacks */}
                  {lmState.attackLog?.length > 0 && (
                    <div className="mt-3 text-xs text-on-surface-variant/60">
                      Gần nhất: {lmState.attackLog[lmState.attackLog.length - 1]?.sect} tấn công
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ranking tab */}
      {tab === 'rank' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-primary/20">
          <div className="p-4 border-b border-primary/10">
            <h3 className="font-semibold text-primary flex items-center gap-2"><Trophy size={18} /> Bảng Xếp Hạng Tông Môn</h3>
          </div>
          <div className="divide-y divide-primary/10">
            {leaderboard.map((r: any, i: number) => (
              <div key={r.sectName} className="flex items-center px-4 py-3">
                <div className="w-8 font-bold text-sm text-center" style={{ color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#666' }}>
                  {i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </div>
                <div className="flex-1 ml-3">
                  <div className="font-semibold text-on-background">{r.sectName}</div>
                  <div className="text-xs text-on-surface-variant">
                    🗺 {r.linghMachControlled} Linh Mạch đang chiếm
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-error">{r.score.toLocaleString()}</div>
                  <div className="text-xs text-on-surface-variant">Điểm tổng</div>
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <div className="p-8 text-center text-on-surface-variant">Chưa có tông môn nào tham chiến.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { getMonsters, fight } from '../services/combatService';

interface Monster {
  id: string;
  name: string;
  desc: string;
  hp: number;
  atk: number;
  def: number;
  expReward: number;
  stoneReward: number;
  realmRequired: number;
  realmName: string;
  realmUnlocked: boolean;
  playerWinChance: number;
  dropItems: { itemId: string; chance: number }[];
}

interface PlayerStats {
  maxHp: number;
  atk: number;
  def: number;
}

interface CombatLog {
  turn: number;
  actor: 'player' | 'monster';
  damage: number;
  monsterHpLeft?: number;
  playerHpLeft?: number;
}

const REALM_COLORS = ['#94a3b8', '#3b82f6', '#f59e0b', '#a855f7', '#ef4444'];

export const CombatArena = () => {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [selected, setSelected] = useState<Monster | null>(null);
  const [loading, setLoading] = useState(true);
  const [fighting, setFighting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showLog, setShowLog] = useState(false);

  useEffect(() => {
    getMonsters().then(res => {
      setMonsters(res.data.monsters);
      setPlayerStats(res.data.playerStats);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleFight = async () => {
    if (!selected) return;
    setFighting(true);
    setResult(null);
    setShowLog(false);
    try {
      const res = await fight(selected.id);
      setResult(res.data);
    } catch (err: any) {
      setResult({ won: false, message: err.response?.data?.message || 'Lỗi server' });
    } finally {
      setFighting(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#a78bfa' }}>
      ⚔️ Đang tải chiến trường...
    </div>
  );

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' }}>
        ⚔️ Đấu Trường Yêu Thú
      </h2>

      {/* Player Stats */}
      {playerStats && (
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.25rem',
          padding: '0.75rem 1rem',
          background: 'rgba(124,58,237,0.12)',
          border: '1px solid rgba(124,58,237,0.25)',
          borderRadius: '0.75rem',
          flexWrap: 'wrap',
        }}>
          <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600 }}>Chỉ số của bạn:</span>
          <StatBadge label="❤️ HP" value={playerStats.maxHp || 0} color="#ef4444" />
          <StatBadge label="⚔️ ATK" value={playerStats.atk || 0} color="#f59e0b" />
          <StatBadge label="🛡️ DEF" value={playerStats.def || 0} color="#3b82f6" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Monster List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {monsters.map(m => (
            <div
              key={m.id}
              onClick={() => { if (m.realmUnlocked) { setSelected(m); setResult(null); } }}
              style={{
                background: selected?.id === m.id
                  ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.08))'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${selected?.id === m.id ? 'rgba(239,68,68,0.5)' : m.realmUnlocked ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}`,
                borderRadius: '0.75rem',
                padding: '1rem',
                cursor: m.realmUnlocked ? 'pointer' : 'default',
                opacity: m.realmUnlocked ? 1 : 0.45,
                transition: 'all 0.2s',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '1rem',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '1rem' }}>{m.name}</span>
                  <span style={{
                    fontSize: '0.65rem',
                    padding: '0.1rem 0.4rem',
                    background: `${REALM_COLORS[m.realmRequired] || '#64748b'}22`,
                    border: `1px solid ${REALM_COLORS[m.realmRequired] || '#64748b'}55`,
                    borderRadius: '999px',
                    color: REALM_COLORS[m.realmRequired] || '#64748b',
                    fontWeight: 600,
                  }}>
                    {m.realmUnlocked ? m.realmName : `🔒 ${m.realmName}`}
                  </span>
                </div>
                <div style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: '0.5rem' }}>{m.desc}</div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <StatBadge label="❤️" value={m.hp} color="#ef4444" />
                  <StatBadge label="⚔️" value={m.atk} color="#f59e0b" />
                  <StatBadge label="🛡️" value={m.def} color="#3b82f6" />
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#10b981', fontSize: '0.78rem', fontWeight: 600 }}>+{m.expReward.toLocaleString()} EXP</div>
                <div style={{ color: '#f59e0b', fontSize: '0.78rem', fontWeight: 600 }}>+{m.stoneReward.toLocaleString()} 💎</div>
                {m.realmUnlocked && (
                  <div style={{
                    marginTop: '0.4rem',
                    fontSize: '0.72rem',
                    color: m.playerWinChance >= 0.5 ? '#10b981' : '#ef4444',
                  }}>
                    Thắng: {Math.round(m.playerWinChance * 100)}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Fight Panel */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '1rem',
          padding: '1.25rem',
          position: 'sticky',
          top: '1rem',
        }}>
          {!selected ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem 1rem', fontSize: '0.88rem' }}>
              ← Chọn yêu thú để tấn công
            </div>
          ) : (
            <>
              <h3 style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                {selected.name}
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1rem' }}>{selected.desc}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                <StatRow label="❤️ HP" value={selected.hp} />
                <StatRow label="⚔️ ATK" value={selected.atk} />
                <StatRow label="🛡️ DEF" value={selected.def} />
              </div>

              <div style={{ marginBottom: '1rem', fontSize: '0.8rem' }}>
                <div style={{ color: '#64748b', marginBottom: '0.2rem' }}>Phần thưởng:</div>
                <div style={{ color: '#10b981', fontWeight: 600 }}>+{selected.expReward.toLocaleString()} EXP</div>
                <div style={{ color: '#f59e0b', fontWeight: 600 }}>+{selected.stoneReward.toLocaleString()} Linh Thạch</div>
              </div>

              <button
                onClick={handleFight}
                disabled={fighting}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  opacity: fighting ? 0.7 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {fighting ? '⚔️ Đang chiến đấu...' : '⚔️ Tấn Công!'}
              </button>

              {/* Combat Result */}
              {result && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{
                    padding: '0.75rem',
                    background: result.won ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${result.won ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.83rem',
                    color: result.won ? '#10b981' : '#ef4444',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                  }}>
                    {result.message}
                  </div>

                  {result.rewards && (
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                      <div>+{result.rewards.expGained?.toLocaleString()} EXP</div>
                      <div>+{result.rewards.stonesGained?.toLocaleString()} 💎</div>
                      {result.rewards.drops?.length > 0 && (
                        <div style={{ color: '#f59e0b' }}>
                          Loot: {result.rewards.drops.map((d: any) => d.itemData?.name || d.itemId).join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  {result.combatLog?.length > 0 && (
                    <>
                      <button
                        onClick={() => setShowLog(v => !v)}
                        style={{
                          width: '100%',
                          padding: '0.4rem',
                          background: 'rgba(255,255,255,0.06)',
                          border: 'none',
                          borderRadius: '0.4rem',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                        }}
                      >
                        {showLog ? '▲ Ẩn chiến đấu log' : '▼ Xem chiến đấu log'}
                      </button>
                      {showLog && (
                        <div style={{
                          marginTop: '0.4rem',
                          maxHeight: '180px',
                          overflowY: 'auto',
                          fontSize: '0.72rem',
                          lineHeight: 1.6,
                          color: '#94a3b8',
                          background: 'rgba(0,0,0,0.2)',
                          borderRadius: '0.4rem',
                          padding: '0.5rem',
                        }}>
                          {(result.combatLog as CombatLog[]).map((log, i) => (
                            <div key={i} style={{ color: log.actor === 'player' ? '#10b981' : '#ef4444' }}>
                              Turn {log.turn} — {log.actor === 'player' ? '⚔️ Bạn' : '👹 Thú'}
                              {' '}gây {log.damage} sát thương
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const StatBadge = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <span style={{ fontSize: '0.78rem', color, fontWeight: 600 }}>
    {label} {value.toLocaleString()}
  </span>
);

const StatRow = ({ label, value }: { label: string; value: number }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
    <span style={{ color: '#94a3b8' }}>{label}</span>
    <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{value.toLocaleString()}</span>
  </div>
);

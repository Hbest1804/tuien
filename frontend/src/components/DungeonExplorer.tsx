import { useState, useEffect } from 'react';
import {
  getDungeonStatus, startExploration, advanceFloor,
  resolveFloorEvent, fightBoss, claimDungeonRewards
} from '../services/dungeonService';


type FloorEvent = {
  floor: number; type: string; title?: string; desc?: string; icon?: string;
  reward?: { spiritStones?: number; expBonus?: number };
  penalty?: { spiritStones?: number };
  resolved: boolean;
};

type DungeonState = {
  dungeons: any[];
  isExploring: boolean;
  currentDungeonId: string | null;
  exploreStartedAt: string | null;
  currentFloor: number;
  floorEvents: FloorEvent[];
};

const RARITY_COLORS: Record<string, string> = {
  'Thường': '#a0a0a0', 'Hiếm': '#f2ca50', 'Cực Phẩm': '#b066ff',
};
const TYPE_COLORS: Record<string, string> = {
  treasure: '#f2ca50', blessing: '#7ed99e', merchant: '#b066ff',
  ambush: '#ff6b6b', trap: '#ff8c42', elite: '#ff4444', boss: '#ff0000',
};

export function DungeonExplorer() {
  const [state, setState] = useState<DungeonState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [bossResult, setBossResult] = useState<any | null>(null);
  const [selectedDungeon, setSelectedDungeon] = useState<string | null>(null);

  const fetch = async () => {
    try {
      const res = await getDungeonStatus();
      setState(res.data);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const showMsg = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleStart = async (dungeonId: string) => {
    setActionLoading(true);
    try {
      const res = await startExploration(dungeonId);
      setState(prev => prev ? { ...prev, ...res.data } : null);
      showMsg(res.data.message, 'success');
    } catch (e: any) {
      showMsg(e.response?.data?.message || 'Lỗi server', 'error');
    }
    setActionLoading(false);
  };

  const handleAdvance = async () => {
    setActionLoading(true);
    try {
      const res = await advanceFloor();
      setState(prev => prev ? { ...prev, currentFloor: res.data.currentFloor, floorEvents: res.data.floorEvents } : null);
      showMsg(res.data.message, 'success');
    } catch (e: any) {
      showMsg(e.response?.data?.message || 'Lỗi server', 'error');
    }
    setActionLoading(false);
  };

  const handleResolve = async () => {
    setActionLoading(true);
    try {
      const res = await resolveFloorEvent();
      setState(prev => prev ? { ...prev, floorEvents: res.data.floorEvents } : null);
      showMsg(res.data.message, 'success');
    } catch (e: any) {
      showMsg(e.response?.data?.message || 'Lỗi server', 'error');
    }
    setActionLoading(false);
  };

  const handleBoss = async () => {
    setActionLoading(true);
    try {
      const res = await fightBoss();
      setBossResult(res.data);
      setState(prev => prev ? { ...prev, isExploring: false, currentFloor: 0, floorEvents: [] } : null);
      showMsg(res.data.message, res.data.won ? 'success' : 'error');
    } catch (e: any) {
      showMsg(e.response?.data?.message || 'Lỗi server', 'error');
    }
    setActionLoading(false);
  };

  const handleClaim = async () => {
    setActionLoading(true);
    try {
      const res = await claimDungeonRewards();
      setState(prev => prev ? { ...prev, isExploring: false, currentFloor: 0, floorEvents: [] } : null);
      showMsg(res.data.message, 'success');
    } catch (e: any) {
      showMsg(e.response?.data?.message || 'Lỗi server', 'error');
    }
    setActionLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    </div>
  );

  const currentDungeon = state?.dungeons.find(d => d.id === state?.currentDungeonId);
  const currentEvent = state?.isExploring
    ? state.floorEvents.find(e => e.floor === state.currentFloor)
    : null;
  const allResolved = currentEvent?.resolved ?? true;
  const isBossFloor = currentDungeon && state?.currentFloor === currentDungeon.floors;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="font-label-caps text-secondary tracking-[0.2em] mb-2">Thám Hiểm</div>
        <h1 className="font-headline-xl text-[40px] gradient-text-gold">Bí Cảnh</h1>
        <p className="text-on-surface-variant mt-2">Chinh phục bí cảnh nhiều tầng, đánh Boss nhận đồ Hoàng Kim.</p>
      </div>

      {/* Toast */}
      {message && (
        <div className={`fixed top-24 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl animate-fade-in text-sm font-medium max-w-sm
          ${message.type === 'success' ? 'bg-secondary/20 border border-secondary text-secondary' :
            message.type === 'error' ? 'bg-error/20 border border-error text-error' :
              'bg-primary/20 border border-primary text-primary'}`}>
          {message.text}
        </div>
      )}

      {/* Boss Result Modal */}
      {bossResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl p-8 max-w-lg w-full">
            <div className={`text-5xl text-center mb-4 ${bossResult.won ? 'animate-bounce' : ''}`}>
              {bossResult.won ? '🏆' : '💀'}
            </div>
            <h2 className={`text-2xl font-bold text-center mb-3 ${bossResult.won ? 'text-primary' : 'text-error'}`}>
              {bossResult.won ? 'CHIẾN THẮNG!' : 'THẤT BẠI!'}
            </h2>
            <p className="text-on-surface-variant text-center text-sm mb-6">{bossResult.message}</p>
            {bossResult.won && bossResult.legendaryDrops?.length > 0 && (
              <div className="mb-4">
                <p className="text-primary font-semibold mb-2 text-center">✨ Đồ Hoàng Kim:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {bossResult.legendaryDrops.map((d: any, i: number) => (
                    <div key={i} className="bg-primary/10 border border-primary/40 rounded-lg px-3 py-2 text-sm text-primary">
                      {d.quantity}x {d.itemData?.name || d.itemId}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setBossResult(null)}
              className="w-full bg-primary/20 border border-primary text-primary py-3 rounded-xl hover:bg-primary/30 transition-all">
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Currently exploring */}
      {state?.isExploring && currentDungeon && (
        <div className="glass-panel rounded-2xl p-6 mb-8 border border-primary/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-primary">{currentDungeon.name}</h2>
            <span className="text-on-surface-variant text-sm">Tầng {state.currentFloor} / {currentDungeon.floors}</span>
          </div>

          {/* Floor progress bar */}
          <div className="w-full h-2 bg-surface-container rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 rounded-full"
              style={{ width: `${((state.currentFloor) / currentDungeon.floors) * 100}%` }}
            />
          </div>

          {/* Floor event */}
          {currentEvent && (
            <div className={`rounded-xl p-5 mb-5 border`}
              style={{ borderColor: `${TYPE_COLORS[currentEvent.type] || '#555'}40`, background: `${TYPE_COLORS[currentEvent.type] || '#555'}10` }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{currentEvent.icon || '⭐'}</span>
                <div>
                  <div className="font-semibold" style={{ color: TYPE_COLORS[currentEvent.type] || '#fff' }}>
                    {currentEvent.type === 'boss' ? `👹 BOSS — ${currentDungeon.bossData?.name}` : currentEvent.title}
                  </div>
                  <div className="text-xs text-on-surface-variant mt-0.5">
                    {currentEvent.type === 'boss' ? currentDungeon.bossData?.desc : currentEvent.desc}
                  </div>
                </div>
              </div>
              {currentEvent.resolved ? (
                <div className="text-secondary text-sm font-medium">✅ Đã giải quyết</div>
              ) : currentEvent.type === 'boss' ? (
                <button onClick={handleBoss} disabled={actionLoading}
                  className="mt-2 bg-error/20 border border-error text-error px-6 py-2 rounded-lg hover:bg-error/30 transition-all disabled:opacity-50 font-semibold">
                  {actionLoading ? 'Đang chiến đấu...' : '⚔️ Đánh Boss!'}
                </button>
              ) : (
                <button onClick={handleResolve} disabled={actionLoading}
                  className="mt-2 bg-primary/20 border border-primary text-primary px-6 py-2 rounded-lg hover:bg-primary/30 transition-all disabled:opacity-50">
                  {actionLoading ? 'Đang xử lý...' : '▶ Giải quyết sự kiện'}
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            {allResolved && !isBossFloor && (
              <button onClick={handleAdvance} disabled={actionLoading}
                className="bg-secondary/20 border border-secondary text-secondary px-5 py-2.5 rounded-xl hover:bg-secondary/30 transition-all disabled:opacity-50 font-medium">
                {actionLoading ? '...' : `⬆ Lên Tầng ${state.currentFloor + 1}`}
              </button>
            )}
            <button onClick={handleClaim} disabled={actionLoading}
              className="bg-surface-container border border-on-surface-variant/30 text-on-surface-variant px-5 py-2.5 rounded-xl hover:border-error/50 hover:text-error transition-all disabled:opacity-50">
              {actionLoading ? '...' : '🚪 Rút lui (Thu thưởng theo giờ)'}
            </button>
          </div>
        </div>
      )}

      {/* Dungeon list */}
      {!state?.isExploring && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {state?.dungeons.filter(d => d.id !== 'dung_sect').map(dungeon => {
            const locked = dungeon.requiredRealmIndex > 99; // Can compare with user realm if available
            return (
              <div
                key={dungeon.id}
                className={`glass-panel rounded-2xl p-5 border transition-all duration-300 cursor-pointer group
                  ${dungeon.color === 'error' ? 'border-error/20 hover:border-error/50' : 'border-primary/20 hover:border-primary/50'}
                  ${selectedDungeon === dungeon.id ? 'border-primary scale-[1.02]' : ''}`}
                onClick={() => setSelectedDungeon(selectedDungeon === dungeon.id ? null : dungeon.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-on-background group-hover:text-primary transition-colors">
                    {dungeon.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${dungeon.color === 'error' ? 'bg-error/20 text-error' : 'bg-secondary/20 text-secondary'}`}>
                      {dungeon.floors} tầng
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-surface-container text-on-surface-variant">
                      ☠ {dungeon.danger}%
                    </span>
                  </div>
                </div>
                <p className="text-on-surface-variant text-sm mb-3">{dungeon.description}</p>
                <div className="text-xs text-primary mb-4">💎 {dungeon.spiritStonesPerHour.toLocaleString()} Linh Thạch/giờ</div>

                {selectedDungeon === dungeon.id && (
                  <div className="mt-2 border-t border-primary/20 pt-3">
                    <div className="text-xs text-on-surface-variant mb-2">Boss cuối: <span className="text-error font-semibold">{dungeon.bossData?.name}</span></div>
                    <div className="text-xs text-on-surface-variant mb-3">Đồ Hoàng Kim: {dungeon.legendaryDrops?.length || 0} loại</div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStart(dungeon.id); }}
                      disabled={actionLoading}
                      className="w-full bg-primary text-on-primary py-2.5 rounded-xl font-semibold hover:bg-primary-fixed-dim transition-all disabled:opacity-50"
                    >
                      {actionLoading ? '...' : `⚔️ Tiến vào bí cảnh`}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

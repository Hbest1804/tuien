import { AlertTriangle, Diamond, Landmark, Plus, Minus, Compass, MapPin, Sparkles, Gem, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDungeonStatus, startExploration, claimDungeonRewards, Dungeon } from '../services/dungeonService';
import { REALMS } from '../config/cultivationConstants';

export default function WorldMap() {
  const { user } = useAuth();
  const [dungeons, setDungeons] = useState<Dungeon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExploring, setIsExploring] = useState(false);
  const [currentDungeonId, setCurrentDungeonId] = useState<string | null>(null);
  const [exploreStartedAt, setExploreStartedAt] = useState<string | null>(null);
  const [selectedDungeonId, setSelectedDungeonId] = useState<string | null>(null);

  const [exploreTime, setExploreTime] = useState<string>('00:00:00');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchDungeons = async () => {
    try {
      const res = await getDungeonStatus();
      setDungeons(res.data.dungeons);
      setIsExploring(res.data.isExploring);
      setCurrentDungeonId(res.data.currentDungeonId);
      setExploreStartedAt(res.data.exploreStartedAt);
      if (res.data.currentDungeonId) {
        setSelectedDungeonId(res.data.currentDungeonId);
      } else if (res.data.dungeons.length > 0) {
        setSelectedDungeonId(res.data.dungeons[0].id);
      }
    } catch (err) {
      console.error('Lỗi lấy thông tin bản đồ/bí cảnh:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.isCharacterCreated) {
      fetchDungeons();
    }
  }, [user]);

  // Timer cho thám hiểm
  useEffect(() => {
    if (!isExploring || !exploreStartedAt) return;
    const start = new Date(exploreStartedAt).getTime();
    
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = now - start;
      if (diff < 0) return;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setExploreTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [isExploring, exploreStartedAt]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStart = async (dungeonId: string) => {
    setActionLoading(true);
    try {
      const res = await startExploration(dungeonId);
      setIsExploring(res.data.isExploring);
      setCurrentDungeonId(res.data.currentDungeonId);
      setExploreStartedAt(res.data.exploreStartedAt);
      showToast(res.data.message);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể bắt đầu thám hiểm.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaim = async () => {
    setActionLoading(true);
    try {
      const res = await claimDungeonRewards();
      setIsExploring(false);
      setCurrentDungeonId(null);
      setExploreStartedAt(null);
      showToast(res.data.message);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể nhận thưởng.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const selected = dungeons.find(d => d.id === selectedDungeonId);

  return (
    <div className="flex-grow relative mx-margin-mobile md:mx-margin-desktop mt-6 mb-8 rounded-2xl border border-primary/15 shadow-2xl overflow-hidden z-10 min-h-[75vh]">

      {/* ── Map Background ── */}
      <div className="absolute inset-0 bg-[#07090f] z-0">
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#f2ca50" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div className="absolute inset-0 opacity-30">
          <div className="absolute w-[40%] h-[50%] top-[10%] left-[15%] rounded-full bg-[#0d1a0f] blur-3xl" />
          <div className="absolute w-[30%] h-[40%] top-[40%] right-[10%] rounded-full bg-[#1a100d] blur-3xl" />
          <div className="absolute w-[25%] h-[35%] top-[5%] right-[25%] rounded-full bg-[#0a1520] blur-2xl" />
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_40%_35%,rgba(126,217,158,0.06)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_60%,rgba(242,202,80,0.04)_0%,transparent_50%)]" />
      </div>

      {/* ── Map Markers ── */}
      <div className="absolute inset-0 z-10">
        {dungeons.map(loc => {
          const colorMap: Record<string, string> = {
            primary: '#f2ca50', error: '#ffb4ab', secondary: '#7ed99e',
          };
          const c = colorMap[loc.color || 'primary'];
          const size = loc.type === 'sect' ? 48 : loc.type === 'forbidden' ? 40 : 32;
          const isSelected = selectedDungeonId === loc.id;
          const isActiveExploration = isExploring && currentDungeonId === loc.id;

          const renderIcon = () => {
            if (loc.type === 'sect') return <Landmark size={22} />;
            if (loc.type === 'forbidden') return <AlertTriangle size={18} />;
            return <Diamond size={14} />;
          };

          return (
            <div
              key={loc.id}
              className="absolute flex flex-col items-center map-marker group cursor-pointer"
              style={{ top: loc.top, left: loc.left, transform: 'translate(-50%, -50%)' }}
              onClick={() => {
                if (!isExploring) setSelectedDungeonId(loc.id);
              }}
            >
              <div
                className={`rounded-full border-2 flex items-center justify-center relative transition-all duration-300 ${isActiveExploration ? 'scale-110' : ''}`}
                style={{
                  width: size,
                  height: size,
                  borderColor: c,
                  background: `rgba(${loc.color === 'primary' ? '15,12,3' : loc.color === 'error' ? '15,3,3' : '3,15,8'}, 0.85)`,
                  boxShadow: (isSelected || isActiveExploration) ? `0 0 20px ${c}80, 0 0 40px ${c}30` : `0 0 8px ${c}40`,
                }}
              >
                {/* Ping ring for active or selected */}
                {(isSelected || isActiveExploration || loc.type === 'sect') && (
                  <div
                    className="animate-ping-slow absolute inset-0 rounded-full border"
                    style={{ borderColor: `${c}60` }}
                  />
                )}
                <span style={{ color: c }}>{renderIcon()}</span>
              </div>

              {/* Label */}
              <span
                className="mt-1.5 font-label-caps text-[9px] px-2 py-0.5 rounded border transition-all duration-300 whitespace-nowrap"
                style={{
                  color: isActiveExploration ? '#fff' : c,
                  background: isActiveExploration ? c : 'rgba(7,9,15,0.85)',
                  borderColor: `${c}30`,
                  opacity: (isSelected || isActiveExploration) ? 1 : 0,
                }}
              >
                {isActiveExploration ? 'ĐANG THÁM HIỂM' : loc.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Info Panel (top-left) ── */}
      {selected && (
        <div className="absolute top-5 left-5 glass-panel p-5 rounded-xl z-20 w-80 transition-all duration-500 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={16} className="text-primary" />
            <h2 className="font-headline-md text-primary text-[20px]">{selected.name}</h2>
          </div>
          <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">{selected.description}</p>

          {/* Dungeon Stats */}
          {selected.type !== 'sect' && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between text-[11px] font-label-caps bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/10">
                <span className="text-on-surface-variant">Yêu Cầu:</span>
                <span style={{ color: REALMS[selected.requiredRealmIndex]?.color }}>{REALMS[selected.requiredRealmIndex]?.name}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-label-caps bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/10">
                <span className="flex items-center gap-1 text-on-surface-variant"><Gem size={12}/> Linh Thạch:</span>
                <span className="text-primary">{selected.spiritStonesPerHour}/h</span>
              </div>

              {selected.danger > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1 font-label-caps text-error text-[10px]">
                      <AlertTriangle size={12} /> Độ Nguy Hiểm
                    </span>
                    <span className="font-label-caps text-error text-[10px]">{selected.danger}%</span>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-1 overflow-hidden">
                    <div className="bg-error h-full rounded-full" style={{ width: `${selected.danger}%`, boxShadow: '0 0 8px rgba(255,180,171,0.5)' }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 pt-4 border-t border-primary/10">
            {isExploring && currentDungeonId === selected.id ? (
              <div className="flex flex-col items-center gap-3">
                <div className="text-[24px] font-mono gradient-text-gold tracking-widest drop-shadow-[0_0_15px_rgba(242,202,80,0.4)]">
                  {exploreTime}
                </div>
                <div className="font-label-caps text-on-surface-variant text-[10px] flex items-center gap-1 mb-2">
                  <Clock size={12} /> Đang Thám Hiểm
                </div>
                <button
                  onClick={handleClaim}
                  disabled={actionLoading}
                  className="w-full energy-pulse bg-primary text-on-primary py-3 rounded-xl font-headline-md text-sm hover:bg-primary-fixed-dim transition-all shadow-[0_0_15px_rgba(242,202,80,0.3)] disabled:opacity-50"
                >
                  {actionLoading ? 'Đang xử lý...' : 'Thu Hoạch & Rút Lui'}
                </button>
              </div>
            ) : isExploring ? (
              <div className="text-center font-label-caps text-on-surface-variant text-[10px] py-2">
                Ngươi đang thám hiểm nơi khác.
              </div>
            ) : selected.type === 'sect' ? (
              <div className="text-center font-label-caps text-primary/70 text-[10px] py-2">
                Khu vực an toàn. Hãy về mục Tu Luyện.
              </div>
            ) : (
              <button
                onClick={() => handleStart(selected.id)}
                disabled={actionLoading || loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-primary/40 text-primary hover:bg-primary/10 hover:shadow-[0_0_20px_rgba(242,202,80,0.15)] font-label-caps transition-all disabled:opacity-50"
              >
                Tiến Vào Thám Hiểm <Sparkles size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Controls (bottom-right) ── */}
      <div className="absolute bottom-5 right-5 glass-panel p-1.5 rounded-xl z-20 flex flex-col gap-1">
        {[Plus, Minus, Compass].map((Icon, i) => (
          <button
            key={i}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200 text-on-surface-variant"
          >
            <Icon size={16} />
          </button>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-6 py-3 rounded-xl font-body-md text-sm animate-fade-in shadow-2xl"
          style={{
            background: toast.type === 'success' ? 'rgba(126,217,158,0.15)' : 'rgba(255,107,107,0.15)',
            border: `1px solid ${toast.type === 'success' ? '#7ed99e' : '#ff6b6b'}`,
            color: toast.type === 'success' ? '#7ed99e' : '#ff6b6b',
            backdropFilter: 'blur(10px)',
          }}
        >
          {toast.type === 'error' && <AlertTriangle size={16} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

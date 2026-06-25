import { useState, useEffect, useRef, useCallback } from 'react';
import { Flame, Wind, Zap, Star, TrendingUp, LogIn, LogOut, ChevronUp, AlertCircle, Clock, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  CultivationData,
  getCultivationStatus,
  startCultivation,
  stopCultivation,
  doBreakthrough,
  joinSect,
  leaveSect,
} from '../services/cultivationService';
import SpiritEffect from './SpiritEffect';

// ─── Cảnh giới metadata ───────────────────────────────────────────────────────
const MAJOR_STAGES = ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Đại Viên Mãn'];
const STAGES: string[] = MAJOR_STAGES.flatMap(k => Array.from({ length: 9 }, (_, i) => `${k} Tầng ${i + 1}`));
// 36 phần tử: Sơ Kỳ Tầng 1 → Sơ Kỳ Tầng 9 → Trung Kỳ Tầng 1 → ... → Đại Viên Mãn Tầng 9

const REALMS = [
  { id: 0, name: 'Luyện Khí',  color: '#7ed99e', glow: 'rgba(126,217,158,0.4)', stages: STAGES },
  { id: 1, name: 'Trúc Cơ',   color: '#f2ca50', glow: 'rgba(242,202,80,0.4)',  stages: STAGES },
  { id: 2, name: 'Kim Đan',   color: '#f2ca50', glow: 'rgba(242,202,80,0.5)',  stages: STAGES },
  { id: 3, name: 'Nguyên Anh',color: '#b066ff', glow: 'rgba(176,102,255,0.4)', stages: STAGES },
  { id: 4, name: 'Hóa Thần',  color: '#b066ff', glow: 'rgba(176,102,255,0.5)', stages: STAGES },
];

// ─── Game constants ───────────────────────────────────────────────────────────
const SECONDS_PER_YEAR = 3600; // 1 giờ thực = 1 năm tu luyện
const LIFESPAN_DRAIN: number[] = [1, 1, 1, 1, 0]; // hao mòn đồng đều 1 thọ nguyên/năm mọi cảnh giới

// ─── Floating spirit particle ──────────────────────────────────────────────────
function SpiritParticle({ active, color }: { active: boolean; color: string }) {
  const count = 14;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${10 + (i * 6.5) % 80}%`,
            width: active ? `${2 + (i % 3)}px` : '0px',
            height: active ? `${2 + (i % 3)}px` : '0px',
            background: color,
            borderRadius: '50%',
            opacity: active ? 0 : 0,
            boxShadow: `0 0 6px ${color}`,
            animation: active
              ? `float-particle ${4 + (i % 5)}s ${(i * 0.4)}s linear infinite`
              : 'none',
            transition: 'width 0.6s ease, height 0.6s ease',
          }}
        />
      ))}
    </div>
  );
}

// ─── Sect modal ───────────────────────────────────────────────────────────────
interface SectModalProps {
  onConfirm: (name: string) => void;
  onCancel: () => void;
  loading: boolean;
}

const PRESET_SECTS = [
  'Thanh Vân Tông', 'Huyền Thiên Môn', 'Băng Tuyết Cung',
  'Lôi Phong Viện', 'Vạn Kiếm Tông', 'Hỏa Linh Phái',
];

function SectModal({ onConfirm, onCancel, loading }: SectModalProps) {
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="glass-panel rounded-2xl p-8 w-full max-w-md mx-4 border border-primary/30"
        style={{ boxShadow: '0 0 60px rgba(242,202,80,0.15)' }}
      >
        <h3 className="font-headline-md text-on-background mb-2">Gia Nhập Tông Môn</h3>
        <p className="font-body-md text-on-surface-variant text-sm mb-6">
          Gia nhập tông môn sẽ tăng tốc độ tu luyện lên <span className="text-primary font-bold">2.5×</span> so với tán tu.
        </p>

        {/* Preset */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESET_SECTS.map((s) => (
            <button
              key={s}
              onClick={() => setName(s)}
              className={`px-3 py-1 rounded-full text-xs font-label-caps border transition-all duration-200 ${
                name === s
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'border-on-surface-variant/20 text-on-surface-variant hover:border-primary/50 hover:text-primary/80'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim().length >= 2 && !loading) {
              onConfirm(name.trim());
            }
          }}
          placeholder="Hoặc nhập tên tông môn tự chọn..."
          maxLength={30}
          className="w-full bg-surface-container border border-on-surface-variant/20 rounded-lg px-4 py-3 text-on-background font-body-md text-sm focus:outline-none focus:border-primary/60 mb-6"
        />

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-on-surface-variant/20 text-on-surface-variant py-3 rounded-xl font-body-md text-sm hover:border-primary/30 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => name.trim().length >= 2 && onConfirm(name.trim())}
            disabled={name.trim().length < 2 || loading}
            className="flex-1 bg-primary/90 text-on-primary py-3 rounded-xl font-body-md text-sm font-semibold hover:bg-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? 'Đang xử lý...' : 'Gia Nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function Cultivation() {
  const { user } = useAuth();
  const [cult, setCult] = useState<CultivationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showSectModal, setShowSectModal] = useState(false);
  const [localExp, setLocalExp] = useState(0);
  const [localYearsWaiting, setLocalYearsWaiting] = useState(0);
  const [localTotalYears, setLocalTotalYears] = useState(0);
  const [expandedRealm, setExpandedRealm] = useState<number | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // ─── Fetch status ─────────────────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCultivationStatus();
      const data = res.data.cultivation;
      setCult(data);
      setLocalExp(data.currentExp);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi tải dữ liệu tu luyện. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.isCharacterCreated) fetchStatus();
  }, [user, fetchStatus]);

  // ─── Local tick: cập nhật EXP mỗi giây mà không gọi API ──────────────
  useEffect(() => {
    if (!cult?.isTraining || !cult.trainingStartedAt) return;
    const cap = cult.realmExpRequired ?? Infinity;
    const startTime = new Date(cult.trainingStartedAt).getTime();
    
    const update = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const gained = elapsed * (cult.speed || 0);
      const next = cult.expAccumulated + gained;
      setLocalExp(cap !== null && cap !== Infinity ? Math.min(next, cap) : next);
    };

    // Update immediately once, then set interval
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [cult?.isTraining, cult?.speed, cult?.realmExpRequired, cult?.trainingStartedAt, cult?.expAccumulated]);

  // ─── Local tick: đếm số năm chờ đột phá real-time ──────────────────
  useEffect(() => {
    if (!cult?.isBreakthroughReady || !cult.breakthroughReadyAt) {
      setLocalYearsWaiting(cult?.yearsWaiting ?? 0);
      return;
    }
    const readyAt = new Date(cult.breakthroughReadyAt).getTime();
    const update = () => {
      const elapsed = (Date.now() - readyAt) / 1000;
      setLocalYearsWaiting(elapsed / SECONDS_PER_YEAR);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [cult?.isBreakthroughReady, cult?.breakthroughReadyAt, cult?.yearsWaiting]);

  // ─── Local tick: đếm tổng thời gian tu đạo real-time ────────────────
  useEffect(() => {
    if (!cult?.createdAt) return;
    const createdAtTime = new Date(cult.createdAt).getTime();
    const update = () => {
      const elapsed = (Date.now() - createdAtTime) / 1000;
      setLocalTotalYears(elapsed / SECONDS_PER_YEAR);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [cult?.createdAt]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const handleToggleTraining = async () => {
    if (!cult) return;
    setActionLoading(true);
    try {
      if (cult.isTraining) {
        const res = await stopCultivation();
        setCult(res.data.cultivation);
        setLocalExp(res.data.cultivation.currentExp);
        showToast(`🧘 Ngưng tu luyện. Tích lũy được ${res.data.gained ?? 0} EXP.`);
      } else {
        const res = await startCultivation();
        setCult(res.data.cultivation);
        setLocalExp(res.data.cultivation.currentExp);
        showToast('⚡ Bắt đầu tu luyện!');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Lỗi';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBreakthrough = async () => {
    setActionLoading(true);
    try {
      const res = await doBreakthrough();
      setCult(res.data.cultivation);
      setLocalExp(res.data.cultivation.currentExp);
      showToast(res.data.message || '🌟 Đột phá thành công!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Chưa đủ EXP';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinSect = async (name: string) => {
    setActionLoading(true);
    try {
      const res = await joinSect(name);
      setCult(res.data.cultivation);
      setLocalExp(res.data.cultivation.currentExp);
      setShowSectModal(false);
      showToast(res.data.message || '🏯 Gia nhập tông môn thành công!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Lỗi';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveSect = async () => {
    if (!window.confirm('Xác nhận rời tông môn? Tốc độ tu luyện sẽ giảm xuống.')) return;
    setActionLoading(true);
    try {
      const res = await leaveSect();
      setCult(res.data.cultivation);
      setLocalExp(res.data.cultivation.currentExp);
      showToast(res.data.message || '💨 Đã rời tông môn.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Lỗi';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Derived values ───────────────────────────────────────────────────────
  const realm = REALMS[cult?.realmIndex ?? 0] || REALMS[0];
  const isBreakthroughReady = cult?.isBreakthroughReady ?? false;
  const progress = cult
    ? (cult.realmExpRequired === null || cult.realmExpRequired === Infinity)
      ? 1
      : Math.min(localExp / cult.realmExpRequired, 1)
    : 0;
  const canBreakthrough = cult
    ? cult.realmIndex < REALMS.length - 1 && isBreakthroughReady
    : false;

  // Thọ nguyên real-time
  const lifespanMax = (cult?.lifespanMax === null || cult?.lifespanMax === undefined) ? Infinity : cult.lifespanMax;
  const drainPerYear = LIFESPAN_DRAIN[cult?.realmIndex ?? 0] ?? 0;
  const localLifespan = isBreakthroughReady
    ? Math.max(0, (cult?.lifespan ?? 100) - localYearsWaiting * drainPerYear)
    : (cult?.lifespan ?? 100);
  const lifespanPct = lifespanMax === Infinity ? 100 : Math.min((localLifespan / lifespanMax) * 100, 100);
  const lifespanWarning = lifespanPct < 20 && lifespanMax !== Infinity;

  // Tính tầng hiện tại từ progress cục bộ (real-time) — 36 tầng tổng
  const localStageIndex = (cult?.realmExpRequired === null || cult?.realmExpRequired === Infinity)
    ? 35
    : Math.min(Math.floor(progress * 36), 35);
  const localMajorIndex     = Math.floor(localStageIndex / 9);  // 0–3 (Sơ Kỳ → Đại Viên Mãn)
  const localSubLevel       = (localStageIndex % 9) + 1;        // 1–9
  const localMajorStageName = MAJOR_STAGES[localMajorIndex];

  // ─── Not character created ────────────────────────────────────────────────
  if (!user?.isCharacterCreated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass-panel rounded-2xl p-10 text-center max-w-md">
          <AlertCircle size={40} className="text-primary mx-auto mb-4 opacity-70" />
          <h2 className="font-headline-md text-on-background mb-2">Chưa tạo nhân vật</h2>
          <p className="text-on-surface-variant font-body-md text-sm">Hãy khai mở linh căn trước khi tu luyện.</p>
        </div>
      </div>
    );
  }

  if (loading && !cult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary animate-pulse font-label-caps tracking-widest">Đang tải tu luyện...</div>
      </div>
    );
  }

  if (error && !cult) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass-panel rounded-2xl p-10 text-center max-w-md border border-error/30">
          <AlertCircle size={40} className="text-error mx-auto mb-4 opacity-70" />
          <h2 className="font-headline-md text-on-background mb-2">Lỗi Kết Nối</h2>
          <p className="text-on-surface-variant font-body-md text-sm mb-6">{error}</p>
          <button
            onClick={fetchStatus}
            className="px-6 py-3 rounded-xl bg-error/10 text-error border border-error/20 font-body-md text-sm hover:bg-error/20 transition-all"
          >
            Thử Lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-6">

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl font-body-md text-sm shadow-2xl backdrop-blur-sm border transition-all duration-300 ${
            toast.type === 'error'
              ? 'bg-error-container/90 border-error/30 text-on-error-container'
              : 'bg-surface-container/90 border-primary/30 text-on-background'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* ── Sect Modal ── */}
      {showSectModal && (
        <SectModal
          onConfirm={handleJoinSect}
          onCancel={() => setShowSectModal(false)}
          loading={actionLoading}
        />
      )}

      {/* ── Header ── */}
      <div className="text-center mb-2 relative">
        <div className="font-label-caps text-primary tracking-[0.2em] mb-2">Con Đường Tu Tiên</div>
        <h1 className="font-headline-lg text-on-background">Tu Luyện</h1>
        
        {/* Tu đạo tuế nguyệt (Tổng thời gian tu luyện) */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <Clock size={14} className="text-on-surface-variant/70" />
          <span className="font-label-caps text-[11px] text-on-surface-variant/70">
            Tu đạo tuế nguyệt:
          </span>
          <span className="font-headline-sm text-primary text-[16px]">
            {Math.floor(localTotalYears)} năm
          </span>
        </div>
      </div>

      {/* ── Realm Road ── */}
      <div className="glass-panel rounded-2xl p-6">
        <p className="font-label-caps text-on-surface-variant text-center mb-5 tracking-widest">Cảnh Giới Tu Luyện</p>
        <div className="flex items-center justify-center gap-1 md:gap-2 flex-wrap">
          {REALMS.map((r, i) => {
            const isCurrent = i === (cult?.realmIndex ?? 0);
            const isPassed  = i < (cult?.realmIndex ?? 0);
            return (
              <div key={r.id} className="flex items-center gap-1 md:gap-2">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-3 h-3 rounded-full transition-all duration-500 ${isCurrent ? 'scale-150' : ''} ${isPassed ? 'opacity-80' : isCurrent ? '' : 'opacity-30'}`}
                    style={{
                      background: r.color,
                      boxShadow: isCurrent ? `0 0 12px ${r.glow}, 0 0 24px ${r.glow}` : 'none',
                      animation: isCurrent ? 'pulse-aura 2s ease-in-out infinite alternate' : 'none',
                    }}
                  />
                  <span
                    className="font-label-caps text-[9px] md:text-[10px]"
                    style={{ color: isCurrent ? r.color : isPassed ? `${r.color}99` : 'rgba(160,150,130,0.4)' }}
                  >
                    {r.name}
                  </span>
                </div>
                {i < REALMS.length - 1 && (
                  <div
                    className="w-5 md:w-10 h-px mb-4"
                    style={{
                      background: isPassed
                        ? `linear-gradient(90deg, ${r.color}80, ${REALMS[i+1].color}80)`
                        : 'rgba(100,90,70,0.3)',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main cultivation card ── */}
      <div
        className="glass-panel rounded-3xl p-8 relative overflow-hidden"
        style={{ borderColor: cult?.isTraining ? `${realm.color}40` : 'rgba(212,175,55,0.12)' }}
      >
        {/* Aura background khi đang train */}
        {cult?.isTraining && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
            style={{
              background: `radial-gradient(ellipse at 50% 50%, ${realm.glow} 0%, transparent 70%)`,
              opacity: 0.3,
              animation: 'pulse-aura 3s ease-in-out infinite alternate',
            }}
          />
        )}

        {/* Dynamic elemental particle effect when training */}
        {cult?.isTraining && user?.spiritRoot && (
           <SpiritEffect type={user.spiritRoot} color={realm.color} />
        )}
        {/* Fallback generic spirit particle if no spirit root (should not happen) */}
        {!user?.spiritRoot && <SpiritParticle active={cult?.isTraining ?? false} color={realm.color} />}

        <div className="relative z-10">
          {/* Current realm badge */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${realm.color}18`, border: `1px solid ${realm.color}40` }}
              >
                <Star size={18} style={{ color: realm.color }} />
              </div>
              <div>
                <div className="font-label-caps text-on-surface-variant text-[10px]">Cảnh Giới Hiện Tại</div>
                <div className="font-headline-md text-[22px] leading-tight" style={{ color: realm.color }}>
                  {realm.name}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="font-label-caps text-[11px] px-2 py-0.5 rounded-full"
                    style={{ background: `${realm.color}18`, color: realm.color, border: `1px solid ${realm.color}40` }}
                  >
                    {localMajorStageName}
                  </span>
                  <span className="font-label-caps text-[10px] text-on-surface-variant/60">
                    Tầng {localSubLevel} / 9
                  </span>
                </div>
              </div>
            </div>

            {/* Training status badge */}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-label-caps transition-all duration-500 ${
                isBreakthroughReady
                  ? 'border-yellow-400/60 text-yellow-300 bg-yellow-400/10'
                  : cult?.isTraining
                  ? 'border-secondary/40 text-secondary bg-secondary/10'
                  : 'border-on-surface-variant/20 text-on-surface-variant bg-surface-container'
              }`}
              style={isBreakthroughReady ? { animation: 'pulse-aura 1.5s ease-in-out infinite alternate' } : {}}
            >
              {isBreakthroughReady ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-yellow-400" style={{ animation: 'pulse-aura 1s ease-in-out infinite alternate' }} />
                  Viên Mãn ✦ Chờ Đột Phá
                </>
              ) : cult?.isTraining ? (
                <>
                  <span
                    className="w-2 h-2 rounded-full bg-secondary"
                    style={{ animation: 'pulse-aura 1.5s ease-in-out infinite alternate' }}
                  />
                  Đang Tu Luyện
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-on-surface-variant/40" />
                  Nghỉ Ngơi
                </>
              )}
            </div>
          </div>

          {/* EXP Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between items-end mb-2">
              <div>
                <span className="font-label-caps text-on-surface-variant text-[10px]">Linh Khí Tích Lũy</span>
                <div className="font-headline-md text-[28px] mt-0.5" style={{ color: realm.color }}>
                  {Math.floor(localExp).toLocaleString()}
                  <span className="text-on-surface-variant text-[14px] font-body-md ml-1">
                    / {cult?.realmExpRequired === undefined || cult.realmExpRequired === null || cult.realmExpRequired === Infinity
                        ? '∞'
                        : cult.realmExpRequired.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-label-caps text-on-surface-variant text-[10px] mb-0.5">Tốc Độ</div>
                <div className="font-body-md text-sm" style={{ color: cult?.isTraining ? realm.color : 'rgba(160,150,130,0.6)' }}>
                  {cult?.speed?.toFixed(3) ?? '0.000'} <span className="text-on-surface-variant text-xs">EXP/s</span>
                </div>
              </div>
            </div>

            {/* Progress bar — chia 4 tầng */}
            <div className="relative w-full h-3 rounded-full bg-surface-container-high overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${Math.min(progress * 100, 100)}%`,
                  background: `linear-gradient(90deg, ${realm.color}80, ${realm.color})`,
                  boxShadow: cult?.isTraining ? `0 0 12px ${realm.glow}` : 'none',
                }}
              />
              {/* 3 vạch chia 4 tầng */}
              {[25, 50, 75].map((pct) => (
                <div
                  key={pct}
                  className="absolute top-0 bottom-0 w-px"
                  style={{ left: `${pct}%`, background: 'rgba(0,0,0,0.35)' }}
                />
              ))}
            </div>
            {/* Stage labels — 4 kỳ chính */}
            <div className="flex justify-between mt-1">
              {MAJOR_STAGES.map((s, i) => (
                <div
                  key={s}
                  className="font-label-caps text-[9px] transition-colors duration-300"
                  style={{
                    color: i < localMajorIndex
                      ? `${realm.color}80`
                      : i === localMajorIndex
                      ? realm.color
                      : 'rgba(160,150,130,0.3)',
                    width: '25%',
                    textAlign: i === 0 ? 'left' : i === 3 ? 'right' : 'center',
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* ── Thọ Nguyên & Năm Tu Luyện ── */}
          {isBreakthroughReady && (
            <div
              className="mb-6 rounded-2xl p-4 border"
              style={{
                borderColor: lifespanWarning ? 'rgba(239,68,68,0.4)' : 'rgba(234,179,8,0.25)',
                background: lifespanWarning
                  ? 'rgba(239,68,68,0.06)'
                  : 'rgba(234,179,8,0.05)',
              }}
            >
              {/* Cảnh báo thọ nguyên cạn */}
              {lifespanWarning && (
                <div
                  className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30"
                  style={{ animation: 'pulse-aura 1s ease-in-out infinite alternate' }}
                >
                  <AlertCircle size={14} className="text-red-400 shrink-0" />
                  <span className="font-label-caps text-[10px] text-red-400">
                    THọO NGUYÊN CẠN KIỆT! HÃY ĐỘT PHÁ NGAY!
                  </span>
                </div>
              )}

              <div className="flex justify-between items-start mb-3">
                {/* Số năm chờ */}
                <div>
                  <div className="font-label-caps text-[10px] text-on-surface-variant mb-1 flex items-center gap-1">
                    <Clock size={10} />
                    Năm Tu Luyện Chờ Đột Phá
                  </div>
                  <div
                    className="font-headline-md text-[28px]"
                    style={{ color: lifespanWarning ? '#ef4444' : '#facc15' }}
                  >
                    {Math.floor(localYearsWaiting)}
                    <span className="text-on-surface-variant text-[13px] font-body-md ml-1">năm</span>
                  </div>
                  <div className="font-body-md text-[10px] text-on-surface-variant/50 mt-0.5">
                    Hao mòn: {drainPerYear} thọ nguyên/năm
                  </div>
                </div>

                {/* Thọ nguyên */}
                <div className="text-right">
                  <div className="font-label-caps text-[10px] text-on-surface-variant mb-1 flex items-center justify-end gap-1">
                    <Heart size={10} />
                    Thọ Nguyên
                  </div>
                  <div
                    className="font-headline-md text-[28px]"
                    style={{ color: lifespanWarning ? '#ef4444' : '#fb923c' }}
                  >
                    {lifespanMax === Infinity
                      ? '∞'
                      : Math.ceil(localLifespan).toLocaleString()}
                    <span className="text-on-surface-variant text-[13px] font-body-md ml-1">
                      / {lifespanMax === Infinity ? '∞' : lifespanMax.toLocaleString()} năm
                    </span>
                  </div>
                </div>
              </div>

              {/* Thanh thọ nguyên */}
              {lifespanMax !== Infinity && (
                <div className="w-full h-2.5 rounded-full bg-surface-container-high overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${lifespanPct}%`,
                      background: lifespanWarning
                        ? 'linear-gradient(90deg, #ef444480, #ef4444)'
                        : lifespanPct < 50
                        ? 'linear-gradient(90deg, #f9731680, #f97316)'
                        : 'linear-gradient(90deg, #fb923c80, #facc15)',
                      boxShadow: lifespanWarning ? '0 0 8px rgba(239,68,68,0.6)' : '0 0 8px rgba(250,204,21,0.4)',
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Toggle training */}
            <button
              id="btn-toggle-training"
              onClick={handleToggleTraining}
              disabled={actionLoading || isBreakthroughReady}
              title={isBreakthroughReady ? 'Tu vi đã viên mãn, hãy đột phá trước' : undefined}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-headline-md text-[18px] transition-all duration-300 disabled:opacity-50 ${
                cult?.isTraining
                  ? 'bg-surface-container border border-error/30 text-error hover:bg-error/10'
                  : isBreakthroughReady
                  ? 'border border-on-surface-variant/10 text-on-surface-variant/40 cursor-not-allowed'
                  : 'border text-primary hover:bg-primary/10 energy-pulse ornate-corners'
              }`}
              style={cult?.isTraining || isBreakthroughReady ? {} : {
                borderColor: `${realm.color}60`,
                boxShadow: `0 0 20px ${realm.glow}`,
              }}
            >
              {cult?.isTraining ? (
                <><Wind size={20} className="shrink-0" /> Ngưng Tu Luyện</>
              ) : (
                <><Flame size={20} className="shrink-0" style={{ color: isBreakthroughReady ? undefined : realm.color }} /> Bắt Đầu Tu Luyện</>
              )}
            </button>

            {/* Breakthrough */}
            {cult && cult.realmIndex < REALMS.length - 1 && (
              <button
                id="btn-breakthrough"
                onClick={handleBreakthrough}
                disabled={!canBreakthrough || actionLoading}
                className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-headline-md text-[18px] transition-all duration-300 ${
                  canBreakthrough
                    ? 'border text-yellow-300 hover:bg-yellow-400/20'
                    : 'border border-on-surface-variant/10 text-on-surface-variant/40 cursor-not-allowed'
                }`}
                style={canBreakthrough ? {
                  borderColor: 'rgba(234,179,8,0.7)',
                  background: 'rgba(234,179,8,0.08)',
                  boxShadow: '0 0 24px rgba(234,179,8,0.35)',
                  animation: 'pulse-aura 1.5s ease-in-out infinite alternate',
                } : {}}
              >
                <ChevronUp size={20} />
                Đột Phá
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Speed breakdown ── */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-secondary" />
          <span className="font-label-caps text-on-surface-variant tracking-widest">Chi Tiết Tốc Độ Tu Luyện</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Tốc Độ Cơ Bản',
              value: `${(cult?.baseSpeed ?? 0).toFixed(3)}`,
              unit: 'EXP/s',
              color: '#7ed99e',
              icon: <Zap size={14} />,
              desc: cult?.isSectMember ? 'Tông Môn' : 'Tán Tu',
            },
            {
              label: 'Hệ Số Linh Căn',
              value: `×${(cult?.spiritRootMultiplier ?? 1).toFixed(1)}`,
              unit: user?.spiritRootGrade || '',
              color: '#f2ca50',
              icon: <Star size={14} />,
              desc: user?.spiritRoot || '',
            },
            {
              label: 'Tốc Độ Thực Tế',
              value: `${(cult?.speed ?? 0).toFixed(3)}`,
              unit: 'EXP/s',
              color: realm.color,
              icon: <Flame size={14} />,
              desc: cult?.isTraining ? '⚡ Đang chạy' : '— Dừng',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-surface-container rounded-xl p-4 text-center border border-on-surface-variant/10"
            >
              <div className="flex items-center justify-center gap-1 mb-2" style={{ color: stat.color }}>
                {stat.icon}
                <span className="font-label-caps text-[9px]">{stat.label}</span>
              </div>
              <div className="font-headline-md text-[22px]" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="font-label-caps text-[9px] text-on-surface-variant mt-1">{stat.unit}</div>
              <div className="font-body-md text-[11px] text-on-surface-variant/60 mt-0.5">{stat.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sect panel ── */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/30">
              <span className="text-primary text-xs">宗</span>
            </div>
            <span className="font-label-caps text-on-surface-variant tracking-widest">Tông Môn</span>
          </div>
          {cult?.isSectMember && (
            <span className="font-label-caps text-[9px] px-3 py-1 rounded-full bg-secondary/10 border border-secondary/30 text-secondary">
              Đệ Tử
            </span>
          )}
        </div>

        {cult && cult.isSectMember ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-headline-md text-[22px] text-on-background">{cult.sectName}</div>
              <div className="font-body-md text-sm text-on-surface-variant mt-1">
                Tốc độ tu luyện tăng <span className="text-secondary font-bold">2.5×</span> so với tán tu
              </div>
              {cult.sectJoinedAt && (
                <div className="font-label-caps text-[9px] text-on-surface-variant/50 mt-2">
                  Gia nhập: {new Date(cult.sectJoinedAt).toLocaleDateString('vi-VN')}
                </div>
              )}
            </div>
            <button
              id="btn-leave-sect"
              onClick={handleLeaveSect}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-error/20 text-error/70 font-body-md text-sm hover:bg-error/10 hover:border-error/40 transition-all duration-200 disabled:opacity-40"
            >
              <LogOut size={14} />
              Rời Tông
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-body-md text-on-surface-variant text-sm">Hiện đang là <span className="text-primary">Tán Tu</span></div>
              <div className="font-body-md text-on-surface-variant/60 text-xs mt-1">
                Gia nhập tông môn để tốc độ tăng <span className="text-secondary">2.5×</span>
              </div>
            </div>
            <button
              id="btn-join-sect"
              onClick={() => setShowSectModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-secondary/10 border border-secondary/30 text-secondary font-body-md text-sm hover:bg-secondary/20 hover:border-secondary/50 transition-all duration-200"
            >
              <LogIn size={14} />
              Gia Nhập
            </button>
          </div>
        )}
      </div>

      {/* ── Realm info ── */}
      <div className="glass-panel rounded-2xl p-6">
        <p className="font-label-caps text-on-surface-variant tracking-widest mb-4">Lịch Sử Cảnh Giới</p>
        <div className="flex flex-col gap-2">
          {REALMS.map((r, i) => {
            const isCurrent = i === (cult?.realmIndex ?? 0);
            const isPassed  = i < (cult?.realmIndex ?? 0);
            const isLocked  = i > (cult?.realmIndex ?? 0);
            const isExpanded = expandedRealm === i;
            const canExpand = isCurrent || isPassed;

            // Tính stage info cho từng realm (0-35)
            const realmStageProgress = isCurrent ? localStageIndex : isPassed ? 35 : -1;

            return (
              <div key={r.id} className="rounded-xl border transition-all duration-300"
                style={{
                  borderColor: isCurrent ? `${r.color}50` : isPassed ? `${r.color}20` : 'rgba(100,90,70,0.1)',
                  background: isCurrent ? `${r.color}08` : 'transparent',
                  boxShadow: isCurrent && isExpanded ? `0 0 20px ${r.glow}` : 'none',
                  opacity: isLocked ? 0.3 : 1,
                }}
              >
                {/* Header row — clickable */}
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  disabled={isLocked}
                  onClick={() => canExpand && setExpandedRealm(isExpanded ? null : i)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        background: r.color,
                        boxShadow: isCurrent ? `0 0 8px ${r.color}` : 'none',
                        animation: isCurrent ? 'pulse-aura 2s ease-in-out infinite alternate' : 'none',
                      }}
                    />
                    <div>
                      <span className="font-label-caps text-[11px]" style={{ color: isCurrent ? r.color : isPassed ? `${r.color}99` : 'rgba(160,150,130,0.4)' }}>
                        {r.name}
                      </span>
                      {isCurrent && (
                        <span
                          className="ml-2 font-label-caps text-[9px] px-1.5 py-0.5 rounded-full"
                          style={{ background: `${r.color}20`, color: r.color }}
                        >
                          {localMajorStageName} · Tầng {localSubLevel}
                        </span>
                      )}
                      {isPassed && (
                        <span className="ml-2 font-label-caps text-[9px] text-on-surface-variant/40">✓ Hoàn thành</span>
                      )}
                      {isLocked && (
                        <span className="ml-2 font-label-caps text-[9px] text-on-surface-variant/30">Chưa đạt tới</span>
                      )}
                    </div>
                  </div>
                  {canExpand && (
                    <span
                      className="font-label-caps text-[9px] text-on-surface-variant/40 transition-transform duration-200"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}
                    >
                      ▼
                    </span>
                  )}
                </button>

                {/* Expanded: hiển thị 4 kỳ × 9 tầng */}
                {isExpanded && canExpand && (
                  <div className="px-4 pb-4">
                    <div className="flex flex-col gap-3">
                      {MAJOR_STAGES.map((majorStage, mi) => {
                        const majorStart   = mi * 9;
                        const majorEnd     = majorStart + 8;
                        const majorAllDone = realmStageProgress > majorEnd;
                        const majorActive  = realmStageProgress >= majorStart && realmStageProgress <= majorEnd;
                        return (
                          <div key={majorStage} className="flex items-center gap-2">
                            {/* Tên kỳ */}
                            <div className="shrink-0" style={{ width: '66px' }}>
                              <span
                                className="font-label-caps text-[9px]"
                                style={{
                                  color: majorAllDone
                                    ? `${r.color}80`
                                    : majorActive
                                    ? r.color
                                    : 'rgba(160,150,130,0.3)',
                                }}
                              >
                                {majorStage}
                              </span>
                            </div>
                            {/* 9 ô tầng */}
                            <div className="flex gap-1 flex-1">
                              {Array.from({ length: 9 }, (_, si) => {
                                const idx     = majorStart + si;
                                const isDone  = idx < realmStageProgress;
                                const isCurr  = idx === realmStageProgress;
                                return (
                                  <div key={si} className="flex-1 flex flex-col items-center gap-0.5">
                                    <div
                                      className="w-full h-2 rounded-sm transition-all duration-300"
                                      style={{
                                        background: isCurr
                                          ? r.color
                                          : isDone
                                          ? `${r.color}55`
                                          : 'rgba(100,90,70,0.15)',
                                        boxShadow: isCurr ? `0 0 5px ${r.color}` : 'none',
                                      }}
                                    />
                                    <span
                                      className="font-label-caps"
                                      style={{
                                        fontSize: '7px',
                                        color: isCurr
                                          ? r.color
                                          : isDone
                                          ? `${r.color}55`
                                          : 'rgba(160,150,130,0.2)',
                                      }}
                                    >
                                      {si + 1}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            {majorAllDone && (
                              <span className="font-label-caps text-[9px] shrink-0" style={{ color: `${r.color}60` }}>✓</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Mini progress bar cho cảnh giới hiện tại */}
                    {isCurrent && cult && cult.realmExpRequired !== null && cult.realmExpRequired !== Infinity && (
                      <div className="mt-3">
                        <div className="flex justify-between mb-1">
                          <span className="font-label-caps text-[9px] text-on-surface-variant/50">Tiến độ trong cảnh giới</span>
                          <span className="font-label-caps text-[9px]" style={{ color: r.color }}>
                            {Math.floor(localExp).toLocaleString()} / {cult.realmExpRequired.toLocaleString()} EXP
                          </span>
                        </div>
                        <div className="relative w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{
                              width: `${Math.min(progress * 100, 100)}%`,
                              background: `linear-gradient(90deg, ${r.color}70, ${r.color})`,
                            }}
                          />
                          {[25, 50, 75].map((p) => (
                            <div key={p} className="absolute top-0 bottom-0 w-px" style={{ left: `${p}%`, background: 'rgba(0,0,0,0.3)' }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

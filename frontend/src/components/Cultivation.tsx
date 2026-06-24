import { useState, useEffect, useRef, useCallback } from 'react';
import { Flame, Wind, Zap, Star, TrendingUp, LogIn, LogOut, ChevronUp, AlertCircle } from 'lucide-react';
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
const REALMS = [
  { id: 0, name: 'Luyện Khí',  color: '#7ed99e', glow: 'rgba(126,217,158,0.4)' },
  { id: 1, name: 'Trúc Cơ',   color: '#f2ca50', glow: 'rgba(242,202,80,0.4)'  },
  { id: 2, name: 'Kim Đan',   color: '#f2ca50', glow: 'rgba(242,202,80,0.5)'  },
  { id: 3, name: 'Nguyên Anh',color: '#b066ff', glow: 'rgba(176,102,255,0.4)' },
  { id: 4, name: 'Hóa Thần',  color: '#b066ff', glow: 'rgba(176,102,255,0.5)' },
];

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
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showSectModal, setShowSectModal] = useState(false);
  const [localExp, setLocalExp] = useState(0);

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
      const res = await getCultivationStatus();
      const data = res.data.cultivation;
      setCult(data);
      setLocalExp(data.currentExp);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.isCharacterCreated) fetchStatus();
  }, [user, fetchStatus]);

  // ─── Local tick: cập nhật EXP mỗi giây mà không gọi API ──────────────────
  useEffect(() => {
    if (!cult?.isTraining) return;
    const interval = setInterval(() => {
      setLocalExp((prev) => prev + (cult.speed || 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cult?.isTraining, cult?.speed]);

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
    if (!confirm('Xác nhận rời tông môn? Tốc độ tu luyện sẽ giảm xuống.')) return;
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
  const progress = cult
    ? cult.realmExpRequired === Infinity
      ? 1
      : Math.min(localExp / cult.realmExpRequired, 1)
    : 0;
  const canBreakthrough = cult
    ? cult.realmIndex < REALMS.length - 1 && localExp >= cult.realmExpRequired
    : false;

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
      <div className="text-center mb-2">
        <div className="font-label-caps text-primary tracking-[0.2em] mb-2">Con Đường Tu Tiên</div>
        <h1 className="font-headline-lg text-on-background">Tu Luyện</h1>
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
                <div className="font-headline-md text-[22px]" style={{ color: realm.color }}>
                  {realm.name}
                </div>
              </div>
            </div>

            {/* Training status badge */}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-label-caps transition-all duration-500 ${
                cult?.isTraining
                  ? 'border-secondary/40 text-secondary bg-secondary/10'
                  : 'border-on-surface-variant/20 text-on-surface-variant bg-surface-container'
              }`}
            >
              {cult?.isTraining ? (
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
                    / {cult?.realmExpRequired === undefined || cult.realmExpRequired === Infinity
                        ? '∞'
                        : cult.realmExpRequired.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-label-caps text-on-surface-variant text-[10px] mb-0.5">Tốc Độ</div>
                <div className="font-body-md text-sm" style={{ color: cult?.isTraining ? realm.color : 'rgba(160,150,130,0.6)' }}>
                  {cult?.speed.toFixed(3) ?? '0.000'} <span className="text-on-surface-variant text-xs">EXP/s</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 rounded-full bg-surface-container-high overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${Math.min(progress * 100, 100)}%`,
                  background: `linear-gradient(90deg, ${realm.color}80, ${realm.color})`,
                  boxShadow: cult?.isTraining ? `0 0 12px ${realm.glow}` : 'none',
                }}
              />
            </div>
            <div className="text-right mt-1 font-label-caps text-[10px] text-on-surface-variant">
              {(progress * 100).toFixed(1)}%
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Toggle training */}
            <button
              id="btn-toggle-training"
              onClick={handleToggleTraining}
              disabled={actionLoading}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-headline-md text-[18px] transition-all duration-300 disabled:opacity-50 ${
                cult?.isTraining
                  ? 'bg-surface-container border border-error/30 text-error hover:bg-error/10'
                  : 'border text-primary hover:bg-primary/10 energy-pulse ornate-corners'
              }`}
              style={cult?.isTraining ? {} : {
                borderColor: `${realm.color}60`,
                boxShadow: `0 0 20px ${realm.glow}`,
              }}
            >
              {cult?.isTraining ? (
                <><Wind size={20} className="shrink-0" /> Ngưng Tu Luyện</>
              ) : (
                <><Flame size={20} className="shrink-0" style={{ color: realm.color }} /> Bắt Đầu Tu Luyện</>
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
                    ? 'bg-primary/10 border border-primary text-primary hover:bg-primary/20 hover:gold-glow-strong'
                    : 'border border-on-surface-variant/10 text-on-surface-variant/40 cursor-not-allowed'
                }`}
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

        {cult?.isSectMember ? (
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
        <p className="font-label-caps text-on-surface-variant tracking-widest mb-4">Thông Tin Cảnh Giới</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {REALMS.map((r, i) => {
            const isCurrent = i === (cult?.realmIndex ?? 0);
            const isPassed  = i < (cult?.realmIndex ?? 0);
            return (
              <div
                key={r.id}
                className={`rounded-xl p-4 border transition-all duration-300 ${
                  isCurrent
                    ? 'border-opacity-60 bg-opacity-10'
                    : isPassed
                    ? 'opacity-60 border-opacity-10'
                    : 'opacity-30 border-opacity-5'
                }`}
                style={{
                  borderColor: isCurrent ? r.color : `${r.color}20`,
                  background: isCurrent ? `${r.color}10` : 'transparent',
                  boxShadow: isCurrent ? `0 0 20px ${r.glow}` : 'none',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: r.color, boxShadow: isCurrent ? `0 0 6px ${r.color}` : 'none' }}
                  />
                  <span className="font-label-caps text-[10px]" style={{ color: r.color }}>
                    {r.name} {isCurrent && '← Hiện tại'}
                  </span>
                </div>
                <div className="font-body-md text-[11px] text-on-surface-variant/60">
                  {isPassed ? '✓ Đã vượt qua' : isCurrent ? 'Đang tu luyện' : 'Chưa đạt tới'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

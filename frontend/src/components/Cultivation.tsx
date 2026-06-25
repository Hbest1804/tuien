import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Clock } from 'lucide-react';
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
import axios from 'axios';
import { REALMS, LIFESPAN_DRAIN, MAJOR_STAGES } from '../config/cultivationConstants';

import RealmRoad from './RealmRoad';
import CultivationCard from './CultivationCard';
import SpeedBreakdown from './SpeedBreakdown';
import SectPanel from './SectPanel';
import SectModal from './SectModal';

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
  const [localIdleYears, setLocalIdleYears] = useState(0);
  const [localTotalYears, setLocalTotalYears] = useState(0);
  const [fetchedAt, setFetchedAt] = useState<number>(Date.now());

  useEffect(() => {
    if (cult) {
      setFetchedAt(Date.now());
    }
  }, [cult]);

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
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : 'Lỗi tải dữ liệu tu luyện. Vui lòng thử lại.';
      setError(msg || 'Lỗi tải dữ liệu tu luyện. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.isCharacterCreated) fetchStatus();
  }, [user, fetchStatus]);

  // ─── Unified Real-time Tick ─────────────────────────────────────────
  useEffect(() => {
    const updateAll = () => {
      const now = Date.now();

      // 1. EXP Tick
      if (cult?.isTraining && cult.trainingStartedAt) {
        const cap = cult.realmExpRequired ?? Infinity;
        const startTime = new Date(cult.trainingStartedAt).getTime();
        const elapsed = (now - startTime) / 1000;
        const gained = elapsed * (cult.speed || 0);
        const next = cult.expAccumulated + gained;
        setLocalExp(cap !== null && cap !== Infinity ? Math.min(next, cap) : next);
      }

      // 2. Years Waiting Tick
      if (cult?.breakthroughReadyAt) {
        const readyTime = new Date(cult.breakthroughReadyAt).getTime();
        const elapsedSeconds = Math.max(0, (now - readyTime) / 1000);
        setLocalYearsWaiting(elapsedSeconds / 3600);
      } else {
        setLocalYearsWaiting(cult?.yearsWaiting ?? 0);
      }

      // 3. Idle Years Tick
      if (!cult?.isTraining) {
        const elapsedSeconds = Math.max(0, (now - fetchedAt) / 1000);
        setLocalIdleYears(elapsedSeconds / 3600);
      } else {
        setLocalIdleYears(0);
      }

      // 4. Total Years Tick
      if (cult?.createdAt) {
        const startTime = new Date(cult.createdAt).getTime();
        const elapsedSeconds = Math.max(0, (now - startTime) / 1000);
        setLocalTotalYears(elapsedSeconds / 3600);
      }
    };

    updateAll();
    const interval = setInterval(updateAll, 1000);
    return () => clearInterval(interval);
  }, [cult, fetchedAt]);

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
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : 'Lỗi';
      showToast(msg || 'Lỗi', 'error');
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
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : 'Chưa đủ EXP';
      showToast(msg || 'Chưa đủ EXP', 'error');
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
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : 'Lỗi';
      showToast(msg || 'Lỗi', 'error');
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
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : 'Lỗi';
      showToast(msg || 'Lỗi', 'error');
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
  
  // Trừ hao mòn dựa trên thời gian idle thực tế
  const localLifespan = cult?.isTraining
    ? (cult?.lifespan ?? 100)
    : Math.max(0, (cult?.lifespan ?? 100) - localIdleYears * drainPerYear);

  const lifespanPct = lifespanMax === Infinity ? 100 : Math.min((localLifespan / lifespanMax) * 100, 100);
  const lifespanWarning = lifespanPct < 20 && lifespanMax !== Infinity;

  // Tính tầng hiện tại từ progress cục bộ (real-time)
  const localStageIndex = (cult?.realmExpRequired === null || cult?.realmExpRequired === Infinity)
    ? 35
    : Math.min(Math.floor(progress * 36), 35);
  const localMajorIndex     = Math.floor(localStageIndex / 9);  // 0–3
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

      <RealmRoad cult={cult} />

      <CultivationCard
        cult={cult}
        realm={realm}
        user={user}
        localExp={localExp}
        progress={progress}
        localMajorStageName={localMajorStageName}
        localSubLevel={localSubLevel}
        isBreakthroughReady={isBreakthroughReady}
        localLifespan={localLifespan}
        lifespanMax={lifespanMax}
        lifespanPct={lifespanPct}
        lifespanWarning={lifespanWarning}
        localYearsWaiting={localYearsWaiting}
        localIdleYears={localIdleYears}
        drainPerYear={drainPerYear}
        actionLoading={actionLoading}
        canBreakthrough={canBreakthrough}
        onToggleTraining={handleToggleTraining}
        onBreakthrough={handleBreakthrough}
      />

      <SpeedBreakdown
        cult={cult}
        realm={realm}
        userSpiritRootGrade={user?.spiritRootGrade}
        userSpiritRoot={user?.spiritRoot}
      />

      <SectPanel
        cult={cult}
        actionLoading={actionLoading}
        onOpenModal={() => setShowSectModal(true)}
        onLeaveSect={handleLeaveSect}
      />
    </div>
  );
}

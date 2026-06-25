import { Star, Flame, Wind, ChevronUp, AlertCircle, Clock, Heart } from 'lucide-react';
import { CultivationData } from '../services/cultivationService';
import { RealmConfig, MAJOR_STAGES, REALMS } from '../config/cultivationConstants';
import SpiritEffect from './SpiritEffect';
import SpiritParticle from './SpiritParticle';

interface CultivationCardProps {
  cult: CultivationData | null;
  realm: RealmConfig;
  user: any; // Ideally we should have a User type imported
  localExp: number;
  progress: number;
  localMajorStageName: string;
  localSubLevel: number;
  isBreakthroughReady: boolean;
  localLifespan: number;
  lifespanMax: number;
  lifespanPct: number;
  lifespanWarning: boolean;
  localYearsWaiting: number;
  localIdleYears: number;
  drainPerYear: number;
  actionLoading: boolean;
  canBreakthrough: boolean;
  onToggleTraining: () => void;
  onBreakthrough: () => void;
}

export default function CultivationCard({
  cult,
  realm,
  user,
  localExp,
  progress,
  localMajorStageName,
  localSubLevel,
  isBreakthroughReady,
  localLifespan,
  lifespanMax,
  lifespanPct,
  lifespanWarning,
  localYearsWaiting,
  localIdleYears,
  drainPerYear,
  actionLoading,
  canBreakthrough,
  onToggleTraining,
  onBreakthrough,
}: CultivationCardProps) {
  return (
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
      {/* Fallback generic spirit particle if no spirit root */}
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
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-label-caps transition-all duration-500 ${isBreakthroughReady
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
                  color: i < MAJOR_STAGES.indexOf(localMajorStageName)
                    ? `${realm.color}80`
                    : i === MAJOR_STAGES.indexOf(localMajorStageName)
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
        {!cult?.isTraining && (
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
                  THỌ NGUYÊN CẠN KIỆT! HÃY ĐỘT PHÁ NGAY!
                </span>
              </div>
            )}

            <div className="flex justify-between items-start mb-3">
              {/* Số năm chờ */}
              <div>
                <div className="font-label-caps text-[10px] text-on-surface-variant mb-1 flex items-center gap-1">
                  <Clock size={10} />
                  {isBreakthroughReady ? 'Năm Tu Luyện Chờ Đột Phá' : 'Thời Gian Ngưng Tu Luyện'}
                </div>
                <div
                  className="font-headline-md text-[28px]"
                  style={{ color: lifespanWarning ? '#ef4444' : '#facc15' }}
                >
                  {Math.floor(isBreakthroughReady ? localYearsWaiting : localIdleYears)}
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
            onClick={onToggleTraining}
            disabled={actionLoading || isBreakthroughReady}
            title={isBreakthroughReady ? 'Tu vi đã viên mãn, hãy đột phá trước' : undefined}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-headline-md text-[18px] transition-all duration-300 disabled:opacity-50 ${cult?.isTraining
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
              onClick={onBreakthrough}
              disabled={!canBreakthrough || actionLoading}
              className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-headline-md text-[18px] transition-all duration-300 ${canBreakthrough
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
  );
}

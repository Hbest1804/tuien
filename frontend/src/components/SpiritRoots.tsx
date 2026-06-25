import { Activity, Flame, Leaf, Sparkles, Zap, Droplets, Mountain, Wind, Sun, Moon, Eye, Skull, Brain, Shield } from 'lucide-react';
import { useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCultivationStatus, CultivationData } from '../services/cultivationService';
import { LIFESPAN_DRAIN } from '../config/cultivationConstants';
import CharacterAvatar from './CharacterAvatar';
import SpiritEffect from './SpiritEffect';

// ─── Spirit root metadata ─────────────────────────────────────────────────────
const SPIRIT_ROOT_META: Record<string, {
  icon: ReactNode;
  color: string;
  glow: string;
  desc: string;
  tags: string[];
}> = {
  'Kim': { icon: <Shield size={20} />, color: '#e8d5a3', glow: 'rgba(232,213,163,0.4)', desc: 'Cương Kim chi đạo — phòng thủ vô song, khí phong sắc bén như kiếm trắng.', tags: ['Phòng Thủ', 'Kim Hệ', 'Kiếm Pháp'] },
  'Mộc': { icon: <Leaf size={20} />, color: '#7ed99e', glow: 'rgba(126,217,158,0.4)', desc: 'Vạn vật sinh sôi — hồi phục mạnh mẽ, linh khí nuôi dưỡng không dứt.', tags: ['Hồi Phục', 'Mộc Hệ', 'Sinh Trưởng'] },
  'Thủy': { icon: <Droplets size={20} />, color: '#60b8e0', glow: 'rgba(96,184,224,0.4)', desc: 'Thượng thiện nhược thủy — biến hóa vô cùng, nhu cương tương tế.', tags: ['Linh Hoạt', 'Thủy Hệ', 'Biến Hóa'] },
  'Hỏa': { icon: <Flame size={20} />, color: '#ff7043', glow: 'rgba(255,112,67,0.4)', desc: 'Liệt diệm thiêu thiên — công kích vô song, hủy diệt tuyệt đối.', tags: ['Công Kích', 'Hỏa Hệ', 'Thiêu Đốt'] },
  'Thổ': { icon: <Mountain size={20} />, color: '#a0836b', glow: 'rgba(160,131,107,0.4)', desc: 'Hậu thổ vô biên — phòng thủ như núi, bền vững trường cửu.', tags: ['Bền Vững', 'Thổ Hệ', 'Phòng Thủ'] },
  'Lôi': { icon: <Zap size={20} />, color: '#b066ff', glow: 'rgba(176,102,255,0.4)', desc: 'Thiên Lôi vô định — tốc độ cực nhanh, công phá mọi phòng thủ.', tags: ['Tốc Độ', 'Lôi Hệ', 'Xuyên Phá'] },
  'Băng': { icon: <Sparkles size={20} />, color: '#87ceeb', glow: 'rgba(135,206,235,0.4)', desc: 'Hàn Băng vạn lý — phong ấn kẻ thù, khống chế chiến trường.', tags: ['Khống Chế', 'Băng Hệ', 'Phong Ấn'] },
  'Phong': { icon: <Wind size={20} />, color: '#98f0c8', glow: 'rgba(152,240,200,0.4)', desc: 'Phong thần vô ảnh — thân pháp hư vô, công thủ biến ảo.', tags: ['Tốc Độ', 'Phong Hệ', 'Thân Pháp'] },
  'Quang': { icon: <Sun size={20} />, color: '#fff176', glow: 'rgba(255,241,118,0.4)', desc: 'Thánh Quang soi rọi — tịnh hóa tà khí, hỗ trợ đồng đội.', tags: ['Thánh Hệ', 'Hỗ Trợ', 'Tịnh Hóa'] },
  'Ám': { icon: <Moon size={20} />, color: '#7e57c2', glow: 'rgba(126,87,194,0.4)', desc: 'Ám Dạ vô tận — thao túng linh hồn, ám công tuyệt diệt.', tags: ['Ám Hệ', 'Linh Hồn', 'Ám Công'] },
  'Huyết': { icon: <Eye size={20} />, color: '#ef5350', glow: 'rgba(239,83,80,0.4)', desc: 'Huyết Hải thao thiên — luyện huyết thành công, bá đạo vô song.', tags: ['Huyết Hệ', 'Bá Đạo', 'Huyết Chiến'] },
  'Độc': { icon: <Skull size={20} />, color: '#a5d63f', glow: 'rgba(165,214,63,0.4)', desc: 'Vạn Độc bất xâm — trăm độc đều thông, tản độc vô hình.', tags: ['Độc Hệ', 'Ô Nhiễm', 'Phòng Độc'] },
  'Tinh Thần': { icon: <Brain size={20} />, color: '#f48fb1', glow: 'rgba(244,143,177,0.4)', desc: 'Thần Thức vô biên — hồn pháp tối thượng, khống chế tinh thần kẻ thù.', tags: ['Thần Hệ', 'Hồn Pháp', 'Khống Chế'] },
  'Hỗn Nguyên': { icon: <Sparkles size={20} />, color: '#ffd700', glow: 'rgba(255,215,0,0.5)', desc: 'Vạn Cổ Độc Nhất — hỗn nguyên chi khí, dung hợp mọi thuộc tính.', tags: ['Vạn Năng', 'Hỗn Nguyên', 'Huyền Thoại'] },
  'Âm Dương': { icon: <Sparkles size={20} />, color: '#e040fb', glow: 'rgba(224,64,251,0.5)', desc: 'Nhị Nguyên Chi Căn — âm dương cân bằng, công thủ hoàn hảo.', tags: ['Âm Dương', 'Cân Bằng', 'Huyền Thoại'] },
  'Không Gian': { icon: <Sparkles size={20} />, color: '#40c4ff', glow: 'rgba(64,196,255,0.5)', desc: 'Không Gian Pháp Tắc — xuyên không gian, vượt qua mọi quy tắc.', tags: ['Không Gian', 'Xuyên Việt', 'Huyền Thoại'] },
};

const GRADE_META: Record<string, { label: string; color: string; bg: string; stars: number }> = {
  'Thiên': { label: 'Thiên Phẩm', color: '#ffd700', bg: 'rgba(255,215,0,0.1)', stars: 4 },
  'Địa': { label: 'Địa Phẩm', color: '#b066ff', bg: 'rgba(176,102,255,0.1)', stars: 3 },
  'Huyền': { label: 'Huyền Phẩm', color: '#60b8e0', bg: 'rgba(96,184,224,0.1)', stars: 2 },
  'Hoàng': { label: 'Hoàng Phẩm', color: '#7ed99e', bg: 'rgba(126,217,158,0.1)', stars: 1 },
};

// Attribute scores based on spirit root (flavor)
const ATTR_BASE: Record<string, number[]> = {
  'Kim': [55, 85, 60, 70], 'Mộc': [60, 65, 75, 90], 'Thủy': [80, 55, 85, 65],
  'Hỏa': [65, 70, 90, 55], 'Thổ': [50, 95, 55, 75], 'Lôi': [75, 60, 95, 50],
  'Băng': [90, 60, 70, 65], 'Phong': [85, 55, 80, 70], 'Quang': [70, 65, 65, 95],
  'Ám': [95, 50, 85, 55], 'Huyết': [85, 75, 70, 60], 'Độc': [80, 65, 85, 60],
  'Tinh Thần': [95, 50, 90, 65],
  'Hỗn Nguyên': [95, 95, 95, 95], 'Âm Dương': [90, 80, 90, 80], 'Không Gian': [85, 70, 95, 70],
};

// ─── Animated bar ─────────────────────────────────────────────────────────────
function AnimatedBar({ pct, color, delay }: { pct: number; color: string; delay: number }) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{
          width: animate ? `${pct}%` : '0%',
          background: `linear-gradient(90deg, ${color}80, ${color})`,
          boxShadow: `0 0 8px ${color}60`,
          transitionDelay: `${delay}ms`,
        }}
      />
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function SpiritRoots() {
  const { user } = useAuth();
  const [cult, setCult] = useState<CultivationData | null>(null);
  const [localExp, setLocalExp] = useState(0);
  const [localIdleYears, setLocalIdleYears] = useState(0);
  const [fetchedAt, setFetchedAt] = useState<number>(Date.now());

  useEffect(() => {
    if (cult) {
      setFetchedAt(Date.now());
    }
  }, [cult]);

  // Fetch cultivation data
  const fetchCult = useCallback(async () => {
    if (!user?.isCharacterCreated) return;
    try {
      const res = await getCultivationStatus();
      setCult(res.data.cultivation);
      setLocalExp(res.data.cultivation.currentExp);
    } catch (err) {
      console.error('Failed to fetch cultivation data:', err);
    }
  }, [user?.isCharacterCreated]);

  useEffect(() => { fetchCult(); }, [fetchCult]);

  // Live EXP and Idle tick
  useEffect(() => {
    const updateAll = () => {
      const now = Date.now();
      
      // EXP Tick
      if (cult?.isTraining && cult.trainingStartedAt) {
        const cap = cult.realmExpRequired ?? Infinity;
        const startTime = new Date(cult.trainingStartedAt).getTime();
        const elapsed = (now - startTime) / 1000;
        const gained = elapsed * (cult.speed || 0);
        const next = cult.expAccumulated + gained;
        setLocalExp(cap !== null && cap !== Infinity ? Math.min(next, cap) : next);
      }

      // Idle Years Tick for Lifespan drain
      if (!cult?.isTraining) {
        const elapsedSeconds = Math.max(0, (now - fetchedAt) / 1000);
        setLocalIdleYears(elapsedSeconds / 3600);
      } else {
        setLocalIdleYears(0);
      }
    };

    updateAll();
    const interval = setInterval(updateAll, 1000);
    return () => clearInterval(interval);
  }, [cult, fetchedAt]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const spiritRoot = user?.spiritRoot ?? null;
  const grade = user?.spiritRootGrade ?? null;
  const rootMeta = spiritRoot ? (SPIRIT_ROOT_META[spiritRoot] ?? null) : null;
  const gradeMeta = grade ? (GRADE_META[grade] ?? null) : null;
  const realmColor = cult?.realmColor ?? '#f2ca50';
  const progress = cult
    ? cult.realmExpRequired === undefined
      ? 0
      : Math.min(localExp / cult.realmExpRequired, 1)
    : 0;

  // Attribute scores based on spirit root (flavor)
  const attrs = (() => {
    const base = spiritRoot ? (ATTR_BASE[spiritRoot] ?? [60, 60, 60, 60]) : [50, 50, 50, 50];
    const gBonus = grade === 'Thiên' ? 20 : grade === 'Địa' ? 12 : grade === 'Huyền' ? 6 : 0;
    return [
      { name: 'Thần Thức', value: Math.min(base[0] + gBonus, 100), color: '#60b8e0' },
      { name: 'Thể Phách', value: Math.min(base[1] + gBonus, 100), color: '#ef5350' },
      { name: 'Ngộ Tính', value: Math.min(base[2] + gBonus, 100), color: '#f2ca50' },
      { name: 'Phúc Duyên', value: Math.min(base[3] + gBonus, 100), color: '#7ed99e' },
    ];
  })();

  // Lifespan from realm
  const maxLifespan = (cult?.lifespanMax === null || cult?.lifespanMax === undefined) ? Infinity : cult.lifespanMax;
  
  const drainPerYear = LIFESPAN_DRAIN[cult?.realmIndex ?? 0] ?? 0;
  const localLifespanFloat = cult?.isTraining
    ? (cult?.lifespan ?? 100)
    : Math.max(0, (cult?.lifespan ?? 100) - localIdleYears * drainPerYear);
    
  const curLifespan = cult ? (maxLifespan === Infinity ? Infinity : Math.ceil(localLifespanFloat)) : 100;

  if (!user) return null;

  return (
    <div className="flex-grow pt-8 pb-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full flex flex-col md:flex-row gap-6 relative z-10">

      {/* ── Left: Character Visual ── */}
      <section className="w-full md:w-5/12 lg:w-1/2 relative min-h-[70vh] md:min-h-[88vh] glass-panel rounded-2xl overflow-hidden group flex flex-col">

        {/* Background aura */}
        <div
          className="absolute inset-0 pointer-events-none aura-pulse"
          style={{
            background: rootMeta
              ? `radial-gradient(ellipse at center 40%, ${rootMeta.glow} 0%, transparent 65%)`
              : 'radial-gradient(ellipse at center 40%, rgba(242,202,80,0.08) 0%, transparent 65%)',
            opacity: 0.7,
          }}
        />

        {/* Rotating rings (bg decoration) */}
        <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-10 pointer-events-none">
          <div className="animate-spin-slow absolute inset-0 rounded-full border" style={{ borderStyle: 'dashed', borderColor: rootMeta?.color ?? '#f2ca50' }} />
          <div className="animate-spin-slow-r absolute inset-8 rounded-full border" style={{ borderColor: `${rootMeta?.color ?? '#7ed99e'}60` }} />
        </div>

        {/* ── Character fills full height ── */}
        <div className="flex-1 relative">
          <CharacterAvatar
            gender={user.gender}
            isTraining={cult?.isTraining ?? false}
            spiritColor={rootMeta?.color ?? '#f2ca50'}
            spiritGlow={rootMeta?.glow ?? 'rgba(242,202,80,0.4)'}
            realmIndex={cult?.realmIndex ?? 0}
          />
        </div>

        {/* ── Info overlay at bottom ── */}
        <div className="relative z-30 px-6 pb-6 pt-4" style={{ background: 'linear-gradient(to top, rgba(10,11,13,0.95) 60%, transparent)' }}>

          {/* Spirit root name + grade stars */}
          <div className="text-center mb-3">
            <p className="font-label-caps tracking-[0.2em] text-[11px] mb-1.5" style={{ color: rootMeta?.color ?? '#f2ca50' }}>
              {spiritRoot ? `${spiritRoot} Linh Căn` : 'Linh Căn Chưa Khai'}
            </p>
            {gradeMeta && (
              <div className="flex items-center justify-center gap-1.5 mb-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full transition-all"
                    style={{
                      background: i < gradeMeta.stars ? gradeMeta.color : 'rgba(100,90,70,0.25)',
                      boxShadow: i < gradeMeta.stars ? `0 0 6px ${gradeMeta.color}` : 'none',
                    }}
                  />
                ))}
              </div>
            )}
            <h2 className="font-headline-md text-[20px]" style={{ color: gradeMeta?.color ?? '#f2ca50' }}>
              {gradeMeta?.label ?? ''}
            </h2>
          </div>

          {/* Realm + sect */}
          {cult && (
            <div className="text-center mb-3">
              <p className="font-label-caps text-[10px] tracking-widest" style={{ color: realmColor }}>
                {cult.realmName} {cult.isTraining && '· Đang Tu Luyện'}
              </p>
              {cult.isSectMember && (
                <p className="font-label-caps text-[9px] text-on-surface-variant/60 mt-0.5">🏯 {cult.sectName}</p>
              )}
            </div>
          )}

          {/* Gender + username badges */}
          <div className="flex items-center justify-center gap-2">
            <div className="px-3 py-1 rounded-full bg-surface-container/80 border border-on-surface-variant/15 backdrop-blur-sm">
              <span className="font-label-caps text-[10px] text-on-surface-variant">
                {user.gender === 'male' ? '♂ Nam Tu Sĩ' : user.gender === 'female' ? '♀ Nữ Tu Sĩ' : '— Chưa Xác Định'}
              </span>
            </div>
            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/25 backdrop-blur-sm">
              <span className="font-label-caps text-[10px] text-primary">{user.username}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Right: Stats ── */}
      <section className="w-full md:w-7/12 lg:w-1/2 flex flex-col gap-4">

        {/* ── Spirit Root detail card ── */}
        <div 
          className="glass-panel rounded-2xl p-6 relative overflow-hidden beam-sweep transition-all duration-1000"
          style={{
            boxShadow: `inset 0 0 30px ${rootMeta?.glow ? rootMeta.glow.replace('0.4', '0.1').replace('0.5', '0.15') : 'transparent'}`,
            borderColor: `${rootMeta?.color ?? '#f2ca50'}30`
          }}
        >
          {/* Dynamic elemental particle effect */}
          {spiritRoot && rootMeta && <SpiritEffect type={spiritRoot} color={rootMeta.color} />}

          <div className="absolute top-0 left-0 w-full h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${rootMeta?.color ?? '#f2ca50'}80, transparent)` }} />

          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="flex-1">
              <div className="font-label-caps text-[10px] text-on-surface-variant mb-2">Linh Căn Đặc Tính</div>
              <h1 className="font-headline-xl text-[28px] md:text-[34px] mb-3 leading-tight flex items-center gap-3 transition-colors duration-1000" style={{ color: rootMeta?.color ?? '#f2ca50' }}>
                {rootMeta && (
                  <div 
                    className="float-icon flex items-center justify-center p-2 rounded-xl shrink-0" 
                    style={{ 
                      background: `${rootMeta.color}15`, 
                      boxShadow: `0 0 20px ${rootMeta.glow}, inset 0 0 10px ${rootMeta.glow}`,
                      border: `1px solid ${rootMeta.color}40`
                    }}
                  >
                    {rootMeta.icon}
                  </div>
                )}
                <span style={{ 
                  textShadow: rootMeta?.glow ? `0 0 20px ${rootMeta.glow}, 0 0 40px ${rootMeta.glow}` : 'none',
                }}>
                  {spiritRoot ? `${spiritRoot} Linh Căn` : 'Chưa Khai Linh Căn'}
                </span>
              </h1>
              <p className="font-body-md text-on-surface-variant text-sm leading-relaxed italic">
                {rootMeta?.desc ?? 'Linh căn chưa được khai mở. Hãy hoàn thành tạo nhân vật.'}
              </p>

              {/* Tags */}
              {rootMeta?.tags && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {rootMeta.tags.map((tag, i) => (
                    <span
                      key={tag}
                      className="font-label-caps text-[9px] px-3 py-1.5 rounded-full border float-icon"
                      style={{ 
                        borderColor: `${rootMeta.color}50`, 
                        color: rootMeta.color, 
                        background: `${rootMeta.color}15`,
                        boxShadow: `0 0 10px ${rootMeta.glow}`,
                        animationDelay: `${i * 0.2}s`
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Grade badge */}
            {gradeMeta && (
              <div
                className="shrink-0 w-16 h-16 rounded-2xl border flex flex-col items-center justify-center gap-1"
                style={{ borderColor: `${gradeMeta.color}40`, background: gradeMeta.bg }}
              >
                <div className="font-headline-md text-[11px] font-bold" style={{ color: gradeMeta.color }}>{grade}</div>
                <div className="flex gap-0.5">
                  {Array.from({ length: gradeMeta.stars }).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: gradeMeta.color }} />
                  ))}
                </div>
                <div className="font-label-caps text-[8px] text-on-surface-variant/60">Phẩm</div>
              </div>
            )}
          </div>

          {/* Speed multiplier info */}
          {grade && (
            <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container border border-on-surface-variant/10">
              <Zap size={12} className="text-primary shrink-0" />
              <span className="font-body-md text-xs text-on-surface-variant">
                Linh căn {gradeMeta?.label} tăng tốc tu luyện{' '}
                <span className="text-primary font-semibold">
                  ×{grade === 'Thiên' ? '3.0' : grade === 'Địa' ? '2.0' : grade === 'Huyền' ? '1.5' : '1.0'}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* ── Cultivation progress (live) ── */}
        {cult && (
          <div className="glass-panel rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${realmColor}50, transparent)` }} />
            <div className="flex justify-between items-end mb-2">
              <span className="font-label-caps text-[10px] flex items-center gap-1.5" style={{ color: realmColor }}>
                <Sparkles size={11} />
                Linh Khí — {cult.realmName}
              </span>
              <span className="font-body-md text-sm font-semibold" style={{ color: realmColor }}>
                {Math.floor(localExp).toLocaleString()}
                {cult.realmExpRequired !== undefined && (
                  <span className="text-on-surface-variant font-normal"> / {cult.realmExpRequired === null || cult.realmExpRequired === Infinity ? '∞' : cult.realmExpRequired.toLocaleString()}</span>
                )}
              </span>
            </div>
            <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden border border-outline-variant/30">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.min(progress * 100, 100)}%`,
                  background: `linear-gradient(90deg, ${realmColor}80, ${realmColor})`,
                  boxShadow: cult.isTraining ? `0 0 12px ${realmColor}60` : 'none',
                }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="font-label-caps text-[9px] text-on-surface-variant/60">
                {cult.isTraining
                  ? `⚡ Đang tu luyện — ${cult.speed.toFixed(3)} EXP/s`
                  : '— Không đang tu luyện'}
              </span>
              <span className="font-label-caps text-[9px]" style={{ color: `${realmColor}80` }}>
                {(progress * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* ── Info grid: Lifespan + Sect ── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-panel rounded-2xl p-4 flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-2">
              <Sparkles size={16} className="text-secondary" />
            </div>
            <span className="font-headline-md text-[20px] text-on-surface">
              {curLifespan === Infinity ? '∞' : curLifespan.toLocaleString()} / {maxLifespan === Infinity ? '∞' : maxLifespan.toLocaleString()}
            </span>
            <span className="font-label-caps text-[9px] text-on-surface-variant/60 mt-1">Năm</span>
          </div>

          <div className="glass-panel rounded-2xl p-4 flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-2">
              <span className="text-primary text-sm font-bold">宗</span>
            </div>
            <span className="font-label-caps text-[9px] text-on-surface-variant mb-1">Tông Môn</span>
            {cult && cult.isSectMember ? (
              <>
                <span className="font-headline-md text-[14px] text-on-surface text-center leading-tight">{cult.sectName}</span>
                <span className="font-label-caps text-[9px] text-secondary mt-1">Đệ Tử</span>
              </>
            ) : (
              <>
                <span className="font-headline-md text-[16px] text-on-surface-variant/40">Tán Tu</span>
                <span className="font-label-caps text-[9px] text-on-surface-variant/40 mt-1">Không tông môn</span>
              </>
            )}
          </div>
        </div>

        {/* ── Attributes ── */}
        <div className="glass-panel rounded-2xl p-5 flex-grow">
          <h3 className="font-headline-md text-[18px] text-primary border-b border-primary/15 pb-3 mb-4 flex items-center gap-2">
            <Activity size={18} />
            Thuộc Tính Tu Tiên
          </h3>
          <ul className="space-y-4">
            {attrs.map((attr, idx) => (
              <li key={idx} className="group">
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: attr.color }} />
                    <span className="font-body-md text-on-surface-variant group-hover:text-on-surface transition-colors text-sm">
                      {attr.name}
                    </span>
                  </div>
                  <span className="font-body-md text-on-surface text-sm font-semibold">{attr.value}</span>
                </div>
                <AnimatedBar pct={attr.value} color={attr.color} delay={idx * 150 + 400} />
              </li>
            ))}
          </ul>
        </div>

        {/* ── Cultivation speed breakdown (mini) ── */}
        {cult && (
          <div className="glass-panel rounded-2xl p-4">
            <p className="font-label-caps text-on-surface-variant text-[9px] tracking-widest mb-3">Tốc Độ Tu Luyện Chi Tiết</p>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-body-md text-on-surface-variant text-xs">
                Cơ bản: <span className="text-secondary font-semibold">{cult.baseSpeed.toFixed(3)}</span>
              </span>
              <span className="text-on-surface-variant/30">×</span>
              <span className="font-body-md text-on-surface-variant text-xs">
                Linh căn: <span className="text-primary font-semibold">×{cult.spiritRootMultiplier.toFixed(1)}</span>
              </span>
              <span className="text-on-surface-variant/30">=</span>
              <span className="font-body-md text-xs font-bold" style={{ color: realmColor }}>
                {cult.speed.toFixed(3)} EXP/s
              </span>
            </div>
          </div>
        )}

      </section>
    </div>
  );
}










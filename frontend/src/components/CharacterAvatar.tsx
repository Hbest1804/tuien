import { useEffect, useState, useRef } from 'react';

interface CharacterAvatarProps {
  gender: 'male' | 'female' | null;
  isTraining: boolean;
  spiritColor: string;
  spiritGlow: string;
  realmIndex?: number;
}

// ─── Sprite frames per state ──────────────────────────────────────────────────
const SPRITES = {
  male: {
    idle:     ['/assets/male_idle_1.png',     '/assets/male_idle_2.png'],
    training: ['/assets/male_training_1.png', '/assets/male_training_2.png'],
  },
  female: {
    idle:     ['/assets/female_idle_1.png',     '/assets/female_idle_2.png'],
    training: ['/assets/female_training_1.png', '/assets/female_training_2.png'],
  },
};

// Preload all sprites
const preload = (srcs: string[]) => {
  if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
    srcs.forEach(s => { const i = new Image(); i.src = s; });
  }
};
export default function CharacterAvatar({
  gender,
  isTraining,
  spiritColor,
  spiritGlow,
  realmIndex = 0,
}: CharacterAvatarProps) {
  useEffect(() => {
    preload([
      ...SPRITES.male.idle, ...SPRITES.male.training,
      ...SPRITES.female.idle, ...SPRITES.female.training,
    ]);
  }, []);

  const key   = gender === 'female' ? 'female' : 'male';
  const state = isTraining ? 'training' : 'idle';
  const frames = SPRITES[key][state];

  // Không đổi frame để tránh nhấp nháy, chỉ lấy frame 0 của state tương ứng
  const frameIdx = 0;
  const characterRef = useRef<HTMLDivElement>(null);
  const rafRef   = useRef<number>();
  const phaseRef = useRef(0);

  // ── Smooth floating via rAF ───────────────────────────────────────────────
  useEffect(() => {
    const amp   = isTraining ? 12 : 5;
    const speed = isTraining ? 0.022 : 0.012;
    const tick = () => {
      phaseRef.current += speed;
      const y = Math.sin(phaseRef.current) * amp;
      if (characterRef.current) {
        characterRef.current.style.transform = `translateY(${y}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isTraining]);

  // ── Orbiting qi particles ─────────────────────────────────────────────────
  const orbits = isTraining ? [
    { r: 115, count: 6, size: 3,   speed: 7  },
    { r: 148, count: 4, size: 2,   speed: 13 },
    { r: 82,  count: 5, size: 2.4, speed: 5  },
  ] : [
    { r: 90, count: 3, size: 1.5, speed: 18 },
  ];

  return (
    <div className="relative w-full h-full flex items-end justify-center overflow-hidden" style={{ minHeight: 400 }}>

      {/* ── Scenic Background ── */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
        style={{
          backgroundImage: `url(${gender === 'female' ? '/assets/bg_female.png' : '/assets/bg_male.png'})`,
          opacity: 0.8,
          filter: isTraining ? 'brightness(1.2) contrast(1.1)' : 'brightness(0.7)'
        }}
      />

      {/* ── Aura background ── */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(ellipse 65% 75% at 50% 55%, ${spiritGlow} 0%, transparent 70%)`,
          opacity: isTraining ? 0.8 : 0.35,
          transition: 'opacity 1.5s ease',
          animation: isTraining ? 'pulse-aura 3s ease-in-out infinite alternate' : 'none',
          mixBlendMode: 'overlay'
        }}
      />

      {/* ── SVG overlay: rings + orbs + particles ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        viewBox="0 0 300 420"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="q-glow">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="q-glow-sm">
            <feGaussianBlur stdDeviation="1.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Spinning dashed rings */}
        {isTraining && (
          <>
            <circle cx="150" cy="240" r="125" fill="none" stroke={spiritColor}
              strokeWidth="1.2" strokeOpacity="0.5" strokeDasharray="6 10" filter="url(#q-glow-sm)">
              <animateTransform attributeName="transform" type="rotate"
                from="0 150 240" to="360 150 240" dur="20s" repeatCount="indefinite"/>
            </circle>
            <circle cx="150" cy="240" r="105" fill="none" stroke={spiritColor}
              strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="2 16">
              <animateTransform attributeName="transform" type="rotate"
                from="360 150 240" to="0 150 240" dur="15s" repeatCount="indefinite"/>
            </circle>
          </>
        )}

        {/* Orbiting orbs */}
        {orbits.flatMap(({ r, count, size, speed }, ri) =>
          Array.from({ length: count }).map((_, pi) => {
            const a0  = (pi / count) * 360;
            const cx  = 150 + r;
            const cy  = 240;
            const dur = `${speed}s`;
            const beg = `${pi * (speed / count)}s`;
            return (
              <g key={`${ri}-${pi}`}>
                <circle cx={cx} cy={cy} r={size * 2.5} fill={spiritColor} opacity={0.3} filter="url(#q-glow)">
                  <animateTransform attributeName="transform" type="rotate"
                    from={`${a0} 150 240`} to={`${a0+360} 150 240`} dur={dur} begin={beg} repeatCount="indefinite"/>
                </circle>
                <circle cx={cx} cy={cy} r={size} fill={spiritColor} opacity={0.9} filter="url(#q-glow-sm)">
                  <animateTransform attributeName="transform" type="rotate"
                    from={`${a0} 150 240`} to={`${a0+360} 150 240`} dur={dur} begin={beg} repeatCount="indefinite"/>
                </circle>
              </g>
            );
          })
        )}

        {/* Rising particles */}
        {isTraining && Array.from({ length: 14 }).map((_, i) => {
          const x   = 75 + i * 12;
          const dur = 2 + (i % 4) * 0.35;
          const del = i * 0.25;
          const r2  = 1 + (i % 3) * 0.6;
          return (
            <circle key={i} cx={x} cy="390" r={r2} fill={spiritColor} opacity="0">
              <animate attributeName="cy"      values="390;280;180;90" dur={`${dur}s`} begin={`${del}s`} repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0;0.9;0.5;0"    dur={`${dur}s`} begin={`${del}s`} repeatCount="indefinite"/>
              <animate attributeName="r"       values={`${r2};${r2*0.5};0`} dur={`${dur}s`} begin={`${del}s`} repeatCount="indefinite"/>
            </circle>
          );
        })}

        {/* Realm stars */}
        {Array.from({ length: Math.min(realmIndex + 1, 6) }).map((_, i) => {
          const total = Math.min(realmIndex + 1, 6);
          const x = 150 - (total - 1) * 9 + i * 18;
          return (
            <polygon key={i}
              points={`${x},42 ${x+1.5},45.5 ${x+5},45.5 ${x+2},48 ${x+3},52 ${x},50 ${x-3},52 ${x-2},48 ${x-5},45.5 ${x-1.5},45.5`}
              fill={spiritColor} opacity={isTraining ? 1 : 0.5} filter="url(#q-glow-sm)">
              {isTraining && (
                <animate attributeName="opacity" values="0.4;1;0.4"
                  dur={`${1.4 + i * 0.18}s`} begin={`${i * 0.12}s`} repeatCount="indefinite"/>
              )}
            </polygon>
          );
        })}
      </svg>

      {/* ── Character sprite (animated) ── */}
      <div
        ref={characterRef}
        className="relative z-20 w-full flex items-end justify-center px-2"
        style={{
          transition: 'transform 0.05s linear',
          filter: isTraining
            ? `drop-shadow(0 0 30px ${spiritColor}) drop-shadow(0 0 12px ${spiritColor}80)`
            : `drop-shadow(0 8px 24px rgba(0,0,0,0.6))`
        }}
      >
        <img
          key={`${key}-${state}-${frameIdx}`}
          src={frames[frameIdx]}
          alt={key === 'female' ? 'Nữ tu sĩ' : 'Nam tu sĩ'}
          className="w-full object-contain object-bottom pointer-events-none"
          style={{
            maxHeight: '420px',
            /* Giữ lại nền đen của AI để làm hào quang tối, chỉ dùng mask để làm mờ viền */
            WebkitMaskImage: 'radial-gradient(ellipse 45% 75% at 50% 55%, black 45%, transparent 85%)',
            maskImage: 'radial-gradient(ellipse 45% 75% at 50% 55%, black 45%, transparent 85%)',
            filter: 'contrast(1.1) brightness(0.95)', 
          }}
          draggable={false}
        />
      </div>

      {/* ── Ground glow ── */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none z-30"
        style={{
          width: '75%',
          height: '50px',
          background: `radial-gradient(ellipse, ${spiritColor}50 0%, transparent 70%)`,
          animation: isTraining ? 'pulse-aura 2.5s ease-in-out infinite alternate' : 'none',
        }}
      />
    </div>
  );
}









import { Activity, Shield, Flame, Plus, Sword, Leaf, Hourglass, Sparkles } from 'lucide-react';
import { CharacterAttribute } from '../types';
import { useEffect, useRef, useState } from 'react';

const attributes: CharacterAttribute[] = [
  { name: 'Thần Thức', value: 60, max: 100, color: 'bg-secondary-fixed' },
  { name: 'Thể Phách',  value: 40, max: 100, color: 'bg-error'          },
  { name: 'Ngộ Tính',  value: 95, max: 100, color: 'bg-primary'         },
  { name: 'Phúc Duyên', value: 75, max: 100, color: 'bg-tertiary-fixed' },
];

function AnimatedBar({ value, max, color, delay }: { value: number; max: number; color: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div ref={ref} className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
        style={{
          width: animate ? `${(value / max) * 100}%` : '0%',
          boxShadow: color.includes('primary') ? '0 0 8px rgba(242,202,80,0.6)' :
                     color.includes('secondary') ? '0 0 8px rgba(126,217,158,0.5)' :
                     color.includes('error') ? '0 0 8px rgba(255,180,171,0.5)' :
                     '0 0 6px rgba(255,255,255,0.3)',
          transitionDelay: `${delay}ms`,
        }}
      />
    </div>
  );
}

export default function SpiritRoots() {
  return (
    <div className="flex-grow pt-8 pb-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full flex flex-col md:flex-row gap-6 relative z-10">

      {/* ── Left: Character Visual ── */}
      <section className="w-full md:w-5/12 lg:w-1/2 relative min-h-[55vh] md:min-h-[80vh] flex items-center justify-center glass-panel rounded-2xl overflow-hidden group">

        {/* Background aura */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/30 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary via-surface-dim to-transparent aura-pulse pointer-events-none" />

        {/* Rotating rings */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 opacity-15 pointer-events-none">
          <div className="animate-spin-slow absolute inset-0 rounded-full border border-primary/60" style={{ borderStyle: 'dashed' }} />
          <div className="animate-spin-slow-r absolute inset-6 rounded-full border border-secondary/40" />
        </div>

        {/* Character silhouette placeholder */}
        <div className="relative z-20 flex flex-col items-center justify-center gap-6 p-8">
          <div className="w-40 h-40 md:w-52 md:h-52 rounded-full border-2 border-primary/30 bg-primary/5 flex items-center justify-center gold-glow-strong group-hover:gold-glow transition-all duration-700 relative">
            <div className="animate-ping-slow absolute inset-0 rounded-full border border-primary/30" />
            <Flame size={72} className="text-primary opacity-80 float-icon" />
          </div>
          <div className="text-center">
            <p className="font-label-caps text-primary tracking-[0.25em] mb-2">Cảnh Giới</p>
            <h2 className="font-headline-lg text-primary-fixed-dim md:text-[40px] text-[30px] drop-shadow-[0_0_20px_rgba(242,202,80,0.5)]">
              Trúc Cơ Kỳ
            </h2>
            <div className="h-[1px] w-24 mx-auto mt-3 bg-gradient-to-r from-transparent via-primary to-transparent" />
            <p className="font-label-caps text-on-surface-variant mt-2 tracking-widest">Tầng 3 / 9</p>
          </div>
        </div>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-surface-container-lowest/80 to-transparent z-20" />
      </section>

      {/* ── Right: Stats ── */}
      <section className="w-full md:w-7/12 lg:w-1/2 flex flex-col gap-4">

        {/* Header Panel */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden beam-sweep">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <h1 className="font-headline-xl text-[36px] md:text-[44px] gradient-text-gold drop-shadow-sm mb-1">
            Đạo Hiệu: Mặc Trần
          </h1>
          <p className="font-body-lg text-on-surface-variant italic mb-6 text-sm">
            "Hỏi thế gian tình là chi, thà cầu trường sinh bất lão."
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-dim/60 border border-primary/20 rounded-xl p-4 flex flex-col items-center text-center group-hover:border-primary/40 transition-colors hover:border-primary/40">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Leaf className="text-primary" size={22} />
              </div>
              <span className="font-label-caps text-on-surface-variant mb-1 text-[10px]">Linh Căn</span>
              <span className="font-headline-md text-primary-fixed-dim text-[18px]">Thiên Linh Căn</span>
              <span className="text-[10px] text-secondary mt-1.5 px-2 py-0.5 bg-secondary/10 rounded-full border border-secondary/20">
                Hỏa Thuộc Tính
              </span>
            </div>

            <div className="bg-surface-dim/60 border border-secondary/20 rounded-xl p-4 flex flex-col items-center text-center hover:border-secondary/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-2">
                <Hourglass className="text-secondary" size={22} />
              </div>
              <span className="font-label-caps text-on-surface-variant mb-1 text-[10px]">Thọ Nguyên</span>
              <span className="font-headline-md text-on-surface text-[18px]">150 / 300</span>
              <span className="text-[10px] text-on-surface-variant mt-1.5">Năm</span>
            </div>
          </div>
        </div>

        {/* Qi Progress */}
        <div className="glass-panel rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="flex justify-between items-end mb-2">
            <span className="font-label-caps text-primary flex items-center gap-1.5">
              <Sparkles size={12} />
              Chân Khí (Qi)
            </span>
            <span className="font-body-md text-primary-fixed-dim font-semibold text-sm">84,500 / 100,000</span>
          </div>
          <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden border border-outline-variant/50">
            <div className="h-full liquid-flow rounded-full bar-animate" style={{ width: '84.5%' }} />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-on-surface-variant/60">Tiến độ tu luyện</span>
            <span className="text-xs text-primary/70">Đột phá tỷ lệ: 45%</span>
          </div>
        </div>

        {/* Attributes */}
        <div className="glass-panel rounded-2xl p-5 flex-grow">
          <h3 className="font-headline-md text-[20px] text-primary border-b border-primary/15 pb-3 mb-4 flex items-center gap-2">
            <Activity size={20} />
            Thuộc Tính Biểu
          </h3>
          <ul className="space-y-4">
            {attributes.map((attr, idx) => (
              <li key={idx} className="group">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-body-md text-on-surface-variant group-hover:text-on-surface transition-colors text-sm">
                    {attr.name}
                  </span>
                  <span className="font-body-md text-on-surface text-sm font-semibold">{attr.value}</span>
                </div>
                <AnimatedBar value={attr.value} max={attr.max} color={attr.color} delay={idx * 150 + 400} />
              </li>
            ))}
          </ul>
        </div>

        {/* Artifact Slots */}
        <div className="glass-panel rounded-2xl p-4">
          <h4 className="font-label-caps text-on-surface-variant text-center mb-4 text-[10px]">Pháp Bảo Bổn Mệnh</h4>
          <div className="flex justify-center gap-3">
            {[
              { icon: <Sword size={24} className="text-primary" />, active: true,  border: 'border-primary/50', glow: 'gold-glow' },
              { icon: <Shield size={20} className="text-on-surface-variant" />, active: false, border: 'border-outline-variant', glow: '' },
              { icon: <Flame size={20} className="text-on-surface-variant" />,  active: false, border: 'border-outline-variant', glow: '' },
              { icon: <Plus size={20} className="text-surface-container-highest" />, active: false, border: 'border-surface-container-high', glow: '' },
            ].map((slot, i) => (
              <div
                key={i}
                className={`w-14 h-14 bg-surface-container border rounded-xl inventory-slot relative flex items-center justify-center ${slot.border} ${slot.glow} ${!slot.active ? 'opacity-50' : ''}`}
              >
                {slot.active && <div className="absolute inset-[3px] border border-primary/20 border-dashed rounded-lg" />}
                {slot.icon}
              </div>
            ))}
          </div>
        </div>

      </section>
    </div>
  );
}

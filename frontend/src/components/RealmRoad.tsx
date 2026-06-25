import { CultivationData } from '../services/cultivationService';
import { REALMS } from '../config/cultivationConstants';

interface RealmRoadProps {
  cult: CultivationData | null;
}

export default function RealmRoad({ cult }: RealmRoadProps) {
  return (
    <div className="glass-panel rounded-2xl p-6">
      <p className="font-label-caps text-on-surface-variant text-center mb-5 tracking-widest">
        Cảnh Giới Tu Luyện
      </p>
      <div className="flex items-center justify-center gap-1 md:gap-2 flex-wrap">
        {REALMS.map((r, i) => {
          const isCurrent = i === (cult?.realmIndex ?? 0);
          const isPassed = i < (cult?.realmIndex ?? 0);
          return (
            <div key={r.id} className="flex items-center gap-1 md:gap-2">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-3 h-3 rounded-full transition-all duration-500 ${isCurrent ? 'scale-150' : ''} ${
                    isPassed ? 'opacity-80' : isCurrent ? '' : 'opacity-30'
                  }`}
                  style={{
                    background: r.color,
                    boxShadow: isCurrent ? `0 0 12px ${r.glow}, 0 0 24px ${r.glow}` : 'none',
                    animation: isCurrent ? 'pulse-aura 2s ease-in-out infinite alternate' : 'none',
                  }}
                />
                <span
                  className="font-label-caps text-[9px] md:text-[10px]"
                  style={{
                    color: isCurrent ? r.color : isPassed ? `${r.color}99` : 'rgba(160,150,130,0.4)',
                  }}
                >
                  {r.name}
                </span>
              </div>
              {i < REALMS.length - 1 && (
                <div
                  className="w-5 md:w-10 h-px mb-4"
                  style={{
                    background: isPassed
                      ? `linear-gradient(90deg, ${r.color}80, ${REALMS[i + 1].color}80)`
                      : 'rgba(100,90,70,0.3)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

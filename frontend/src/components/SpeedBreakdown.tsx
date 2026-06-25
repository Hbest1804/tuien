import { TrendingUp, Zap, Star, Flame } from 'lucide-react';
import { CultivationData } from '../services/cultivationService';
import { RealmConfig } from '../config/cultivationConstants';

interface SpeedBreakdownProps {
  cult: CultivationData | null;
  realm: RealmConfig;
  userSpiritRootGrade: string | undefined;
  userSpiritRoot: string | undefined;
}

export default function SpeedBreakdown({ cult, realm, userSpiritRootGrade, userSpiritRoot }: SpeedBreakdownProps) {
  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={16} className="text-secondary" />
        <span className="font-label-caps text-on-surface-variant tracking-widest">
          Chi Tiết Tốc Độ Tu Luyện
        </span>
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
            unit: userSpiritRootGrade || '',
            color: '#f2ca50',
            icon: <Star size={14} />,
            desc: userSpiritRoot || '',
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
  );
}

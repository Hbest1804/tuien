import { LogOut, LogIn, Award, ChevronRight } from 'lucide-react';
import { CultivationData } from '../services/cultivationService';
import { useNavigate } from 'react-router-dom';

interface SectPanelProps {
  cult: CultivationData | null;
  actionLoading: boolean;
  onOpenModal: () => void;
  onLeaveSect: () => void;
}

const SECT_RANK_COLORS: Record<string, string> = {
  'Tạp Dịch':    '#a09682',
  'Ngoại Môn':   '#7ed99e',
  'Nội Môn':     '#f2ca50',
  'Chân Truyền': '#b066ff',
  'Trưởng Lão':  '#ff6b6b',
  'Tông Chủ':    '#ff4d4d',
};

export default function SectPanel({ cult, actionLoading, onOpenModal, onLeaveSect }: SectPanelProps) {
  const navigate = useNavigate();
  const sectRank = cult?.sectRank || 'Tạp Dịch';
  const rankColor = SECT_RANK_COLORS[sectRank] || '#a09682';

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/30">
            <span className="text-primary text-xs">宗</span>
          </div>
          <span className="font-label-caps text-on-surface-variant tracking-widest">Tông Môn Lãnh Địa</span>
        </div>
      </div>

      {cult && cult.isSectMember ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-headline-md text-[22px] text-on-background flex items-center gap-2">
                {cult.sectName}
                <span className="font-label-caps text-[9px] px-2 py-1 rounded-full border" style={{ color: rankColor, borderColor: `${rankColor}50`, backgroundColor: `${rankColor}15` }}>
                  <Award size={8} className="inline mr-1" />{sectRank}
                </span>
              </div>
              <div className="font-body-md text-sm text-on-surface-variant mt-1">
                Tốc độ tu luyện đang tăng <span className="text-secondary font-bold">2.5×</span>
              </div>
            </div>
            <button
              id="btn-leave-sect"
              onClick={onLeaveSect}
              disabled={actionLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-error/20 text-error/70 font-body-md text-sm hover:bg-error/10 transition-all duration-200 disabled:opacity-40"
            >
              <LogOut size={14} />
            </button>
          </div>

          <button
            onClick={() => navigate('/sect')}
            className="w-full flex items-center justify-between px-4 py-3 bg-surface-container border border-primary/20 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <span className="font-label-caps text-sm text-primary group-hover:text-primary-fixed-dim transition-colors">Trở Về Tông Môn</span>
            <ChevronRight size={16} className="text-primary group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <div className="font-body-md text-on-surface-variant text-sm">
              Hiện đang là <span className="text-primary">Tán Tu Vô Môn</span>
            </div>
            <div className="font-body-md text-on-surface-variant/60 text-xs mt-1">
              Gia nhập tông môn để nhận đặc quyền và điểm cống hiến.
            </div>
          </div>
          <button
            id="btn-join-sect-modal"
            onClick={onOpenModal}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/20 text-primary font-body-md text-sm hover:bg-primary/10 hover:border-primary/40 transition-all duration-200 disabled:opacity-40"
          >
            <LogIn size={14} />
            Gia Nhập
          </button>
        </div>
      )}
    </div>
  );
}

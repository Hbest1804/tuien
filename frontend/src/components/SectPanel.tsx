import { LogOut, LogIn } from 'lucide-react';
import { CultivationData } from '../services/cultivationService';

interface SectPanelProps {
  cult: CultivationData | null;
  actionLoading: boolean;
  onOpenModal: () => void;
  onLeaveSect: () => void;
}

export default function SectPanel({ cult, actionLoading, onOpenModal, onLeaveSect }: SectPanelProps) {
  return (
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
            onClick={onLeaveSect}
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
            <div className="font-body-md text-on-surface-variant text-sm">
              Hiện đang là <span className="text-primary">Tán Tu</span>
            </div>
            <div className="font-body-md text-on-surface-variant/60 text-xs mt-1">
              Gia nhập tông môn để tốc độ tăng <span className="text-secondary">2.5×</span>
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

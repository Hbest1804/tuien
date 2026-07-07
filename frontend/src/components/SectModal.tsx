import { useState } from 'react';

import { SECTS } from '../config/sects';

interface SectModalProps {
  onConfirm: (name: string) => void;
  onCancel: () => void;
  loading: boolean;
}

export default function SectModal({ onConfirm, onCancel, loading }: SectModalProps) {
  const [selectedSect, setSelectedSect] = useState<string>('Thiên Kiếm Tông');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="glass-panel rounded-2xl p-8 w-full max-w-2xl mx-4 border border-primary/30 max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 0 60px rgba(242,202,80,0.15)' }}
      >
        <h3 className="font-headline-md text-on-background mb-2">Gia Nhập Tông Môn</h3>
        <p className="font-body-md text-on-surface-variant text-sm mb-6">
          Gia nhập tông môn sẽ tăng tốc độ tu luyện lên <span className="text-primary font-bold">2.5×</span> so với tán tu.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {SECTS.map((sect) => (
            <div
              key={sect.id}
              onClick={() => setSelectedSect(sect.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                selectedSect === sect.id
                  ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(242,202,80,0.2)]'
                  : 'border-outline-variant/30 bg-surface-container hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full border border-primary/40 overflow-hidden flex-shrink-0">
                  {/* Fallback to initials if image fails or missing */}
                  {sect.masterAvatar ? (
                    <img src={sect.masterAvatar} alt="Sect Master" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; if (e.currentTarget.nextElementSibling) (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'; }} />
                  ) : null}
                  <div className="w-full h-full bg-surface-container flex items-center justify-center font-bold text-primary" style={{ display: sect.masterAvatar ? 'none' : 'flex' }}>
                    {sect.name[0]}
                  </div>
                </div>
                <div>
                  <h3 className="font-headline-md text-on-background">{sect.name}</h3>
                  <div className="text-[10px] font-label-caps text-on-surface-variant/70">
                    Tông Chủ: <span className="text-primary">{sect.master}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant font-body-md line-clamp-2">
                {sect.description}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-on-surface-variant/20 text-on-surface-variant py-3 rounded-xl font-body-md text-sm hover:border-primary/30 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => onConfirm(selectedSect)}
            disabled={loading || !selectedSect}
            className="flex-1 bg-primary text-on-primary py-3 rounded-xl font-headline-md text-sm disabled:opacity-40"
          >
            {loading ? 'Đang vào...' : 'Gia Nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}

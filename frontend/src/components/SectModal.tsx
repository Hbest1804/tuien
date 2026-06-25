import { useState } from 'react';

interface SectModalProps {
  onConfirm: (name: string) => void;
  onCancel: () => void;
  loading: boolean;
}

const PRESET_SECTS = [
  'Thanh Vân Tông', 'Huyền Thiên Môn', 'Băng Tuyết Cung',
  'Lôi Phong Viện', 'Vạn Kiếm Tông', 'Hỏa Linh Phái',
];

export default function SectModal({ onConfirm, onCancel, loading }: SectModalProps) {
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="glass-panel rounded-2xl p-8 w-full max-w-md mx-4 border border-primary/30"
        style={{ boxShadow: '0 0 60px rgba(242,202,80,0.15)' }}
      >
        <h3 className="font-headline-md text-on-background mb-2">Gia Nhập Tông Môn</h3>
        <p className="font-body-md text-on-surface-variant text-sm mb-6">
          Gia nhập tông môn sẽ tăng tốc độ tu luyện lên <span className="text-primary font-bold">2.5×</span> so với tán tu.
        </p>

        {/* Preset */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESET_SECTS.map((s) => (
            <button
              key={s}
              onClick={() => setName(s)}
              className={`px-3 py-1 rounded-full text-xs font-label-caps border transition-all duration-200 ${
                name === s
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'border-on-surface-variant/20 text-on-surface-variant hover:border-primary/50 hover:text-primary/80'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim().length >= 2 && !loading) {
              onConfirm(name.trim());
            }
          }}
          placeholder="Hoặc nhập tên tông môn tự chọn..."
          maxLength={30}
          className="w-full bg-surface-container border border-on-surface-variant/20 rounded-lg px-4 py-3 text-on-background font-body-md text-sm focus:outline-none focus:border-primary/60 mb-6"
        />

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-on-surface-variant/20 text-on-surface-variant py-3 rounded-xl font-body-md text-sm hover:border-primary/30 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => name.trim().length >= 2 && onConfirm(name.trim())}
            disabled={name.trim().length < 2 || loading}
            className="flex-1 bg-primary/90 text-on-primary py-3 rounded-xl font-body-md text-sm font-semibold hover:bg-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? 'Đang xử lý...' : 'Gia Nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { X, Sparkles, Shield, AlertTriangle } from 'lucide-react';
import { getInventoryStatus, InventoryItem } from '../services/inventoryService';
import { CultivationData } from '../services/cultivationService';
import { REALMS } from '../config/cultivationConstants';

interface BreakthroughModalProps {
  onClose: () => void;
  onConfirm: (itemsUsed: { itemId: string; quantity: number }[]) => void;
  cult: CultivationData;
  loading: boolean;
}

export default function BreakthroughModal({ onClose, onConfirm, cult, loading }: BreakthroughModalProps) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [fetching, setFetching] = useState(true);

  const [selectedPill, setSelectedPill] = useState<string>('');
  const [selectedProtection, setSelectedProtection] = useState<string>('');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await getInventoryStatus();
        setInventoryItems(res.data.inventory.items);
      } catch (err) {
        console.error('Lỗi lấy túi đồ', err);
      } finally {
        setFetching(false);
      }
    };
    fetchInventory();
  }, []);

  const nextRealm = REALMS[cult.realmIndex + 1];

  const breakthroughPills = inventoryItems.filter(i => i.subType === 'BREAKTHROUGH');
  const protectionArtifacts = inventoryItems.filter(i => i.subType === 'PROTECTION');

  const handleAutoSelect = () => {
    if (breakthroughPills.length > 0) {
      setSelectedPill(breakthroughPills[0].itemId);
    }
    if (protectionArtifacts.length > 0) {
      setSelectedProtection(protectionArtifacts[0].itemId);
    }
  };

  const handleConfirm = () => {
    const itemsUsed: { itemId: string; quantity: number }[] = [];
    if (selectedPill) itemsUsed.push({ itemId: selectedPill, quantity: 1 });
    if (selectedProtection) itemsUsed.push({ itemId: selectedProtection, quantity: 1 });
    onConfirm(itemsUsed);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={!loading ? onClose : undefined} />
      
      <div className="relative w-full max-w-lg glass-panel rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-headline-sm text-primary flex items-center gap-2">
              <Sparkles size={20} />
              Chuẩn Bị Đột Phá
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">Đột phá lên {nextRealm?.name || 'Cảnh giới mới'}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-full hover:bg-white/10 text-on-surface-variant transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="bg-error/10 border border-error/20 p-4 rounded-xl flex gap-3">
            <AlertTriangle className="text-error shrink-0" size={24} />
            <div className="text-sm">
              <p className="text-error font-bold mb-1">CẢNH BÁO RỦI RO</p>
              <p className="text-on-background/80">Đột phá thất bại sẽ dẫn đến <strong>giáng 1 cảnh giới nhỏ</strong> và hao tổn căn cơ.</p>
              <p className="text-on-background/80 mt-1">Cảnh giới càng cao, sẽ xuất hiện <strong>Thiên Kiếp (Lôi Kiếp)</strong> tàn phá thể xác.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-label-caps text-on-surface-variant mb-2 flex items-center gap-2">
                <Sparkles size={14} className="text-primary"/> Đan Dược Hỗ Trợ (Tăng Tỷ Lệ)
              </label>
              <select
                className="w-full bg-surface-container border border-white/10 rounded-xl p-3 text-on-background text-sm outline-none focus:border-primary/50 transition-colors"
                value={selectedPill}
                onChange={e => setSelectedPill(e.target.value)}
                disabled={fetching || loading}
              >
                <option value="">-- Không dùng đan dược --</option>
                {breakthroughPills.map(item => (
                  <option key={item.itemId} value={item.itemId}>
                    {item.name} (SL: {item.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-label-caps text-on-surface-variant mb-2 flex items-center gap-2">
                <Shield size={14} className="text-secondary"/> Pháp Bảo Phòng Ngự (Chống Lôi Kiếp)
              </label>
              <select
                className="w-full bg-surface-container border border-white/10 rounded-xl p-3 text-on-background text-sm outline-none focus:border-secondary/50 transition-colors"
                value={selectedProtection}
                onChange={e => setSelectedProtection(e.target.value)}
                disabled={fetching || loading}
              >
                <option value="">-- Dùng nhục thân đỡ sét --</option>
                {protectionArtifacts.map(item => (
                  <option key={item.itemId} value={item.itemId}>
                    {item.name} (SL: {item.quantity})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex gap-3">
          <button
            onClick={handleAutoSelect}
            disabled={loading || fetching}
            className="flex-1 py-3 rounded-xl bg-surface-container border border-white/10 text-on-surface-variant font-label-caps text-sm hover:bg-white/5 transition-all"
          >
            Tự động chọn
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || fetching}
            className="flex-[2] py-3 rounded-xl bg-primary text-on-primary font-headline-sm text-sm hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(var(--color-primary),0.3)] disabled:opacity-50"
          >
            {loading ? 'Đang Đột Phá...' : 'Tiến Hành Đột Phá'}
          </button>
        </div>
      </div>
    </div>
  );
}

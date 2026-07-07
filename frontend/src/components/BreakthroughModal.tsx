import { useState, useEffect } from 'react';
import { X, Sparkles, Shield, AlertTriangle, TrendingUp, Zap, CheckCircle } from 'lucide-react';
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

  const currentRealm = REALMS[cult.realmIndex];
  const nextRealm = REALMS[cult.realmIndex + 1];

  const breakthroughPills = inventoryItems.filter(i => i.subType === 'BREAKTHROUGH');
  const protectionArtifacts = inventoryItems.filter(i => i.subType === 'PROTECTION');

  // Tính tỷ lệ thành công + phòng thủ
  const baseSuccessRate = currentRealm?.successRate ?? 1.0;
  const selectedPillData = breakthroughPills.find(i => i.itemId === selectedPill);
  const pillBonus = selectedPillData?.effects?.successRateBonus ?? 0;
  const finalSuccessRate = Math.min(1.0, baseSuccessRate + (pillBonus as number));

  const tribulationDamage = currentRealm?.tribulationDamage ?? 0;
  const selectedProtectionData = protectionArtifacts.find(i => i.itemId === selectedProtection);
  const defenseAmount = (selectedProtectionData?.effects?.tribulationDefense as number) ?? 0;
  const remainingDamage = Math.max(0, tribulationDamage - defenseAmount);
  const tribulationBlocked = tribulationDamage > 0 && defenseAmount >= tribulationDamage;

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

  const successColor = finalSuccessRate >= 0.7 ? '#7ed99e' : finalSuccessRate >= 0.4 ? '#f2ca50' : '#ff6b6b';

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

        <div className="p-6 overflow-y-auto space-y-5">
          {/* ─── Thống kê đột phá ─── */}
          <div className="grid grid-cols-2 gap-3">
            {/* Tỷ lệ thành công */}
            <div className="bg-background/50 rounded-xl p-4 border border-white/10 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-label-caps text-on-surface-variant">
                <TrendingUp size={12} /> Tỷ Lệ Thành Công
              </div>
              <div className="text-3xl font-bold" style={{ color: successColor }}>
                {Math.round(finalSuccessRate * 100)}%
              </div>
              {pillBonus > 0 && (
                <div className="text-xs text-secondary">
                  Cơ bản {Math.round(baseSuccessRate * 100)}% + Đan {Math.round((pillBonus as number) * 100)}%
                </div>
              )}
            </div>

            {/* Lôi Kiếp */}
            <div className={`rounded-xl p-4 border flex flex-col gap-2 ${tribulationDamage > 0 ? 'bg-error/5 border-error/20' : 'bg-secondary/5 border-secondary/20'}`}>
              <div className="flex items-center gap-2 text-xs font-label-caps text-on-surface-variant">
                <Zap size={12} /> Sát Thương Lôi Kiếp
              </div>
              {tribulationDamage > 0 ? (
                <>
                  <div className={`text-3xl font-bold ${tribulationBlocked ? 'text-secondary line-through opacity-50' : 'text-error'}`}>
                    {tribulationDamage.toLocaleString()}
                  </div>
                  {defenseAmount > 0 && (
                    <div className="text-xs text-secondary flex items-center gap-1">
                      {tribulationBlocked ? (
                        <><CheckCircle size={10} /> Đã cản hoàn toàn!</>
                      ) : (
                        <>Còn chịu: <span className="text-error font-bold">{remainingDamage.toLocaleString()}</span></>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-2xl font-bold text-secondary">Không có</div>
              )}
            </div>
          </div>

          {/* ─── Cảnh báo ─── */}
          <div className="bg-error/10 border border-error/20 p-4 rounded-xl flex gap-3">
            <AlertTriangle className="text-error shrink-0 mt-0.5" size={18} />
            <div className="text-sm space-y-1">
              <p className="text-error font-bold text-xs font-label-caps">CẢNH BÁO RỦI RO</p>
              <p className="text-on-background/80">Thất bại sẽ bị <strong>giáng 1 cảnh giới nhỏ</strong> và hao tổn căn cơ.</p>
              {tribulationDamage > 0 && (
                <p className="text-on-background/80">Lôi Kiếp <strong>{tribulationDamage.toLocaleString()} sát thương</strong> — cần Pháp bảo phòng ngự!</p>
              )}
            </div>
          </div>

          {/* ─── Chọn vật phẩm ─── */}
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
                    {item.name} (+{Math.round((item.effects?.successRateBonus as number || 0) * 100)}%) — SL: {item.quantity}
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
                    {item.name} (Cản {(item.effects?.tribulationDefense as number || 0).toLocaleString()} dmg) — SL: {item.quantity}
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
            className="flex-[2] py-3 rounded-xl bg-primary text-on-primary font-headline-sm text-sm hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(242,202,80,0.3)] disabled:opacity-50"
          >
            {loading ? 'Đang Đột Phá...' : `Tiến Hành Đột Phá (${Math.round(finalSuccessRate * 100)}%)`}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { Package, Shield, Sword, Box, Zap, Clock, FlaskConical, BookOpen, ShoppingCart, ChevronRight, Dna } from 'lucide-react';
import { getInventoryStatus, addTestItem, useItem, equipItem, unequipItem, learnTechnique, InventoryData, InventoryItem } from '../services/inventoryService';
import { sellShopItem } from '../services/economyService';
import { useEconomy } from '../context/EconomyContext';

const RARITY_COLORS: Record<string, { text: string; border: string; bg: string }> = {
  'Thường':    { text: 'text-[#a09682]',   border: 'border-[#a09682]/50',   bg: 'bg-[#a09682]/10' },
  'Hiếm':      { text: 'text-[#7ed99e]',   border: 'border-[#7ed99e]/50',   bg: 'bg-[#7ed99e]/10' },
  'Cực Phẩm':  { text: 'text-[#b066ff]',   border: 'border-[#b066ff]/50',   bg: 'bg-[#b066ff]/10' },
  'Thần Cấp':  { text: 'text-[#ff6b6b]',   border: 'border-[#ff6b6b]/50',   bg: 'bg-[#ff6b6b]/10' },
};

function getRarityStyle(rarity: string) {
  return RARITY_COLORS[rarity] ?? { text: 'text-on-surface-variant', border: 'border-on-surface-variant', bg: 'bg-surface-container' };
}

function getItemIcon(type: string) {
  if (type === 'PILL')      return <FlaskConical size={22} />;
  if (type === 'ARTIFACT')  return <Sword size={22} />;
  if (type === 'MATERIAL')  return <Box size={22} />;
  if (type === 'TECHNIQUE') return <BookOpen size={22} />;
  return <Package size={22} />;
}

type TabType = 'items' | 'equipment' | 'buffs';

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('items');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const { fetchBalance } = useEconomy();

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchInventory = useCallback(async () => {
    try {
      const res = await getInventoryStatus();
      setInventory(res.data.inventory);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const handleAction = async (action: () => Promise<any>, successMsg?: string) => {
    if (isActing) return;
    setIsActing(true);
    try {
      const res = await action();
      setInventory(res.data.inventory);
      showMessage(res.data.message || successMsg || 'Thành công!', 'success');
      fetchBalance();
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Lỗi xảy ra', 'error');
    } finally {
      setIsActing(false);
    }
  };

  const handleUseItem = (itemId: string) => handleAction(() => useItem(itemId, 1));
  const handleEquip = (itemId: string) => handleAction(() => equipItem(itemId));
  const handleUnequip = (slot: 'weapon' | 'armor') => handleAction(() => unequipItem(slot));
  const handleLearnTechnique = (itemId: string) => handleAction(() => learnTechnique(itemId));
  const handleSellNPC = (itemId: string) => handleAction(async () => {
    const res = await sellShopItem(itemId, 1);
    // Re-fetch inventory separately since sell doesn't return inventory
    const invRes = await getInventoryStatus();
    return { data: { message: res.data.message, inventory: invRes.data.inventory } };
  });

  const handleCheatItem = async (itemId: string) => {
    try {
      const res = await addTestItem(itemId, 5);
      setInventory(res.data.inventory);
    } catch (err: any) {
      showMessage(err.response?.data?.message || 'Lỗi', 'error');
    }
  };

  if (loading) return <div className="p-8 text-center text-on-surface-variant">Đang mở túi đồ...</div>;
  if (!inventory) return <div className="p-8 text-center text-error">Không thể tải túi đồ.</div>;

  const slots = Array.from({ length: inventory.maxSlots });

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 fade-in-up">
      <div className="text-center mb-8">
        <h1 className="font-headline-lg text-[32px] md:text-[48px] gradient-text-gold mb-2">Không Gian Giới Chỉ</h1>
        <p className="font-body-md text-on-surface-variant">Sức chứa: {inventory.currentSlots} / {inventory.maxSlots}</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 text-center rounded-lg max-w-xl mx-auto text-sm font-medium transition-all ${
          message.type === 'success'
            ? 'bg-primary/10 border border-primary/50 text-primary'
            : 'bg-error/10 border border-error/50 text-error'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Grid túi đồ */}
        <div className="flex-1">
          <div className="bg-surface-container/40 p-6 rounded-2xl border border-primary/10">
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {slots.map((_, index) => {
                const item = inventory.items[index];
                const style = item ? getRarityStyle(item.rarity) : null;
                const isSelected = selectedItem?.itemId === item?.itemId;
                return (
                  <div
                    key={index}
                    className={`relative aspect-square rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                      item
                        ? `${style!.border} ${style!.bg} hover:scale-105 ${isSelected ? 'ring-2 ring-primary' : ''}`
                        : 'border-on-surface-variant/15 bg-background/30'
                    }`}
                    onClick={() => item && setSelectedItem(isSelected ? null : item)}
                    title={item ? `${item.name} (x${item.quantity})` : 'Ô trống'}
                  >
                    {item ? (
                      <>
                        <div className={style!.text}>{getItemIcon(item.type)}</div>
                        <span className="absolute bottom-0.5 right-1 font-label-caps text-[9px] bg-background/80 px-0.5 rounded">{item.quantity}</span>
                      </>
                    ) : (
                      <span className="opacity-10 text-xs">·</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats trang bị */}
          {inventory.equippedStats && (inventory.equippedStats.atkBonus > 0 || inventory.equippedStats.defBonus > 0) && (
            <div className="mt-4 bg-surface-container/40 p-4 rounded-2xl border border-primary/10 flex gap-6">
              <div className="text-center">
                <div className="font-label-caps text-[9px] text-on-surface-variant mb-1">CÔNG KÍCH</div>
                <div className="text-primary font-bold text-lg">+{inventory.equippedStats.atkBonus}</div>
              </div>
              <div className="text-center">
                <div className="font-label-caps text-[9px] text-on-surface-variant mb-1">PHÒNG NGỰ</div>
                <div className="text-secondary font-bold text-lg">+{inventory.equippedStats.defBonus}</div>
              </div>
              {inventory.equippedStats.tribulationDefense > 0 && (
                <div className="text-center">
                  <div className="font-label-caps text-[9px] text-on-surface-variant mb-1">KHÁNG LÔI</div>
                  <div className="text-[#f2ca50] font-bold text-lg">{inventory.equippedStats.tribulationDefense.toLocaleString()}</div>
                </div>
              )}
              {inventory.techniquePassiveBonus > 0 && (
                <div className="text-center">
                  <div className="font-label-caps text-[9px] text-on-surface-variant mb-1">CÔNG PHÁP</div>
                  <div className="text-[#7ed99e] font-bold text-lg">+{Math.round(inventory.techniquePassiveBonus * 100)}%</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Panel */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          
          {/* Tabs */}
          <div className="flex rounded-xl overflow-hidden border border-primary/20">
            {(['items', 'equipment', 'buffs'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 font-label-caps text-[10px] transition-all ${
                  activeTab === tab ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:bg-white/5'
                }`}
              >
                {tab === 'items' ? 'Hành Trang' : tab === 'equipment' ? 'Trang Bị' : 'Buff'}
              </button>
            ))}
          </div>

          {/* Tab: Items */}
          {activeTab === 'items' && (
            <div className="bg-surface-container/60 p-4 rounded-2xl border border-primary/20 max-h-[500px] overflow-y-auto">
              {selectedItem && (
                <div className={`mb-4 p-4 rounded-xl border ${getRarityStyle(selectedItem.rarity).bg} ${getRarityStyle(selectedItem.rarity).border}`}>
                  <div className={`font-headline-sm text-base ${getRarityStyle(selectedItem.rarity).text} mb-1`}>{selectedItem.name}</div>
                  <div className="font-label-caps text-[9px] text-on-surface-variant mb-2">{selectedItem.rarity} · {selectedItem.type}</div>
                  <p className="text-xs text-on-surface-variant mb-3 leading-relaxed">{selectedItem.description}</p>
                  {selectedItem.effects && Object.keys(selectedItem.effects).length > 0 && (
                    <div className="text-xs space-y-1 mb-3">
                      {(selectedItem.effects as any).atkBonus && <div className="text-primary">⚔️ Công kích +{(selectedItem.effects as any).atkBonus}</div>}
                      {(selectedItem.effects as any).defBonus && <div className="text-secondary">🛡️ Phòng ngự +{(selectedItem.effects as any).defBonus}</div>}
                      {(selectedItem.effects as any).tribulationDefense && <div className="text-[#f2ca50]">⚡ Kháng Lôi Kiếp {(selectedItem.effects as any).tribulationDefense.toLocaleString()}</div>}
                      {(selectedItem.effects as any).speedPassiveBonus && <div className="text-[#7ed99e]">📖 Tốc độ +{Math.round((selectedItem.effects as any).speedPassiveBonus * 100)}% vĩnh viễn</div>}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.type === 'PILL' && (
                      <button onClick={() => handleUseItem(selectedItem.itemId)} disabled={isActing}
                        className="flex-1 px-3 py-1.5 bg-primary/20 hover:bg-primary border border-primary/50 hover:text-background rounded-lg text-xs transition-all font-label-caps">
                        Uống ngay
                      </button>
                    )}
                    {selectedItem.type === 'TECHNIQUE' && (
                      <button onClick={() => handleLearnTechnique(selectedItem.itemId)} disabled={isActing}
                        className="flex-1 px-3 py-1.5 bg-secondary/20 hover:bg-secondary border border-secondary/50 hover:text-background rounded-lg text-xs transition-all font-label-caps">
                        Học Công Pháp
                      </button>
                    )}
                    {selectedItem.type === 'ARTIFACT' && (selectedItem.subType === 'WEAPON' || selectedItem.subType === 'ARMOR' || selectedItem.subType === 'PROTECTION') && (
                      <button onClick={() => handleEquip(selectedItem.itemId)} disabled={isActing}
                        className="flex-1 px-3 py-1.5 bg-[#f2ca50]/20 hover:bg-[#f2ca50] border border-[#f2ca50]/50 hover:text-background rounded-lg text-xs transition-all font-label-caps">
                        Trang Bị
                      </button>
                    )}
                    <button onClick={() => handleSellNPC(selectedItem.itemId)} disabled={isActing}
                      className="px-3 py-1.5 bg-error/10 hover:bg-error/20 border border-error/30 text-error rounded-lg text-xs transition-all font-label-caps">
                      Bán NPC
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {inventory.items.map(item => {
                  const style = getRarityStyle(item.rarity);
                  return (
                    <div
                      key={item.itemId}
                      onClick={() => setSelectedItem(selectedItem?.itemId === item.itemId ? null : item)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:bg-white/5 ${
                        selectedItem?.itemId === item.itemId ? `${style.border} ${style.bg}` : 'border-white/5 bg-background/20'
                      }`}
                    >
                      <div className={style.text}>{getItemIcon(item.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${style.text}`}>{item.name}</div>
                        <div className="text-xs text-on-surface-variant">{item.rarity}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-on-surface-variant">×{item.quantity}</span>
                        <ChevronRight size={12} className="text-on-surface-variant/40" />
                      </div>
                    </div>
                  );
                })}
                {inventory.items.length === 0 && <span className="text-sm opacity-50 text-center py-4">Túi đồ trống trơn.</span>}
              </div>
            </div>
          )}

          {/* Tab: Equipment */}
          {activeTab === 'equipment' && (
            <div className="bg-surface-container/60 p-4 rounded-2xl border border-primary/20 space-y-4">
              <h3 className="font-label-caps text-[#f2ca50] text-xs">VŨ KHÍ / PHÁP BẢO</h3>
              {inventory.equippedWeapon ? (
                <div className={`p-3 rounded-xl border ${getRarityStyle(inventory.equippedWeapon.rarity).border} ${getRarityStyle(inventory.equippedWeapon.rarity).bg}`}>
                  <div className={`font-medium text-sm ${getRarityStyle(inventory.equippedWeapon.rarity).text}`}>{inventory.equippedWeapon.name}</div>
                  <div className="text-xs text-on-surface-variant mt-1">{inventory.equippedWeapon.description}</div>
                  {(inventory.equippedWeapon.effects as any)?.atkBonus && (
                    <div className="text-xs text-primary mt-1">⚔️ +{(inventory.equippedWeapon.effects as any).atkBonus} Công kích</div>
                  )}
                  {(inventory.equippedWeapon.effects as any)?.tribulationDefense && (
                    <div className="text-xs text-[#f2ca50] mt-1">⚡ Kháng Lôi {(inventory.equippedWeapon.effects as any).tribulationDefense.toLocaleString()}</div>
                  )}
                  <button onClick={() => handleUnequip('weapon')} disabled={isActing}
                    className="mt-2 w-full py-1 text-xs bg-error/10 border border-error/30 text-error rounded-lg hover:bg-error/20 transition-all font-label-caps">
                    Tháo Ra
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-on-surface-variant/20 text-center text-xs text-on-surface-variant/50">
                  Chưa trang bị vũ khí / pháp bảo
                </div>
              )}

              <h3 className="font-label-caps text-[#7ed99e] text-xs">PHÒNG GIÁP</h3>
              {inventory.equippedArmor ? (
                <div className={`p-3 rounded-xl border ${getRarityStyle(inventory.equippedArmor.rarity).border} ${getRarityStyle(inventory.equippedArmor.rarity).bg}`}>
                  <div className={`font-medium text-sm ${getRarityStyle(inventory.equippedArmor.rarity).text}`}>{inventory.equippedArmor.name}</div>
                  <div className="text-xs text-on-surface-variant mt-1">{inventory.equippedArmor.description}</div>
                  {(inventory.equippedArmor.effects as any)?.defBonus && (
                    <div className="text-xs text-secondary mt-1">🛡️ +{(inventory.equippedArmor.effects as any).defBonus} Phòng ngự</div>
                  )}
                  <button onClick={() => handleUnequip('armor')} disabled={isActing}
                    className="mt-2 w-full py-1 text-xs bg-error/10 border border-error/30 text-error rounded-lg hover:bg-error/20 transition-all font-label-caps">
                    Tháo Ra
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-on-surface-variant/20 text-center text-xs text-on-surface-variant/50">
                  Chưa trang bị giáp phòng thủ
                </div>
              )}

              {inventory.techniquePassiveBonus > 0 && (
                <>
                  <h3 className="font-label-caps text-secondary text-xs">CÔNG PHÁP ĐÃ HỌC</h3>
                  <div className="p-3 rounded-xl border border-secondary/30 bg-secondary/5 flex items-center gap-3">
                    <Dna size={20} className="text-secondary shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-secondary">Tốc độ tu luyện</div>
                      <div className="text-xs text-on-surface-variant">Thụ động +{Math.round(inventory.techniquePassiveBonus * 100)}% vĩnh viễn</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab: Buffs */}
          {activeTab === 'buffs' && (
            <div className="bg-surface-container/60 p-4 rounded-2xl border border-secondary/20 space-y-3">
              <div className="flex justify-between items-center p-2 rounded-lg bg-background/50 border border-white/5">
                <span className="text-xs text-on-surface-variant">Tốc độ (đan dược):</span>
                <span className="font-bold text-primary text-sm">×{inventory.speedBuffMultiplier.toFixed(2)}</span>
              </div>
              {inventory.techniquePassiveBonus > 0 && (
                <div className="flex justify-between items-center p-2 rounded-lg bg-background/50 border border-white/5">
                  <span className="text-xs text-on-surface-variant">Tốc độ (công pháp):</span>
                  <span className="font-bold text-secondary text-sm">+{Math.round(inventory.techniquePassiveBonus * 100)}%</span>
                </div>
              )}
              <div className="flex justify-between items-center p-2 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-xs text-on-surface-variant font-medium">Tổng hệ số:</span>
                <span className="font-bold text-primary text-sm">×{inventory.totalSpeedMultiplier.toFixed(2)}</span>
              </div>

              {inventory.activeBuffs.map((buff, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${
                  buff.buffType === 'SPEED_HEART_DEMON' ? 'bg-error/10 border-error/30' : 'bg-secondary/10 border-secondary/30'
                }`}>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {buff.buffType === 'SPEED_HEART_DEMON' ? (
                      <><span className="text-error">💀</span>
                      <div>
                        <div className="text-xs font-medium text-error">Tẩu Hỏa Nhập Ma</div>
                        <div className="text-xs text-on-surface-variant">×{buff.multiplier} tốc độ</div>
                      </div></>
                    ) : (
                      <><Zap size={14} className="text-secondary shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-secondary">{buff.buffType} (×{buff.multiplier})</div>
                        <div className="text-xs text-on-surface-variant">Hết: {new Date(buff.expiresAt).toLocaleString('vi-VN')}</div>
                      </div></>
                    )}
                  </div>
                  <Clock size={12} className="text-on-surface-variant/50 shrink-0" />
                </div>
              ))}
              {inventory.activeBuffs.length === 0 && (
                <div className="text-sm text-on-surface-variant italic opacity-70 text-center py-4">Không có hiệu ứng nào.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

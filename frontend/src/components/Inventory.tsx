import { useEffect, useState } from 'react';
import { Package, Shield, Sword, Box, Zap, Clock, FlaskConical } from 'lucide-react';
import { getInventoryStatus, addTestItem, useItem, InventoryData, InventoryItem } from '../services/inventoryService';

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [isUsing, setIsUsing] = useState(false);

  const fetchInventory = async () => {
    try {
      const res = await getInventoryStatus();
      setInventory(res.data.inventory);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleUseItem = async (itemId: string) => {
    if (isUsing) return;
    setIsUsing(true);
    try {
      const res = await useItem(itemId, 1);
      setMessage(res.data.message || 'Sử dụng thành công');
      setInventory(res.data.inventory);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Lỗi khi dùng vật phẩm');
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsUsing(false);
    }
  };

  const handleCheatItem = async (itemId: string) => {
    try {
      const res = await addTestItem(itemId, 5);
      setInventory(res.data.inventory);
      setMessage(res.data.message);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Lỗi');
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Thường': return 'text-[#a09682] border-[#a09682]';
      case 'Hiếm': return 'text-[#7ed99e] border-[#7ed99e]';
      case 'Cực Phẩm': return 'text-[#f2ca50] border-[#f2ca50]';
      case 'Thần Cấp': return 'text-[#ff6b6b] border-[#ff6b6b]';
      default: return 'text-on-surface-variant border-on-surface-variant';
    }
  };

  const getItemIcon = (type: string) => {
    if (type === 'PILL') return <FlaskConical size={24} />;
    if (type === 'ARTIFACT') return <Sword size={24} />;
    if (type === 'MATERIAL') return <Box size={24} />;
    return <Package size={24} />;
  };

  if (loading) {
    return <div className="p-8 text-center text-on-surface-variant">Đang mở túi đồ...</div>;
  }

  if (!inventory) {
    return <div className="p-8 text-center text-error">Không thể tải túi đồ.</div>;
  }

  // Create an array for the grid based on maxSlots
  const slots = Array.from({ length: inventory.maxSlots });

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 fade-in-up">
      <div className="text-center mb-10">
        <h1 className="font-headline-lg text-[32px] md:text-[48px] gradient-text-gold mb-2">Không Gian Giới Chỉ</h1>
        <p className="font-body-md text-on-surface-variant">Sức chứa: {inventory.currentSlots} / {inventory.maxSlots}</p>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-primary/10 border border-primary/50 text-primary text-center rounded-lg max-w-xl mx-auto">
          {message}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left: Inventory Grid */}
        <div className="flex-1 bg-surface-container/40 p-6 rounded-2xl border border-primary/10">
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
            {slots.map((_, index) => {
              const item = inventory.items[index];
              return (
                <div 
                  key={index} 
                  className={`relative aspect-square rounded-lg border bg-background/50 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    item ? 'hover:bg-primary/10 ' + getRarityColor(item.rarity) : 'border-on-surface-variant/20'
                  }`}
                  title={item ? `${item.name}\n${item.description}` : 'Ô trống'}
                >
                  {item ? (
                    <>
                      <div className="mb-1">{getItemIcon(item.type)}</div>
                      <span className="absolute bottom-1 right-1 font-label-caps text-[10px] bg-background/80 px-1 rounded">x{item.quantity}</span>
                    </>
                  ) : (
                    <span className="opacity-10">&middot;</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Item Details & Active Buffs */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          
          <div className="bg-surface-container/60 p-6 rounded-2xl border border-primary/20 min-h-[300px]">
            <h3 className="font-headline-md text-primary mb-4 border-b border-primary/20 pb-2">Hành Trang</h3>
            <p className="text-sm text-on-surface-variant mb-6 italic">Nhấn vào vật phẩm trong túi để xem hoặc nhấn "Sử dụng" bên dưới.</p>
            
            <div className="flex flex-col gap-3">
              <h4 className="font-label-caps text-secondary">Vật Phẩm Có Sẵn:</h4>
              {inventory.items.map(item => (
                <div key={item.itemId} className="flex flex-col p-3 border border-primary/10 rounded-lg bg-background/30">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-medium ${getRarityColor(item.rarity).split(' ')[0]}`}>{item.name}</span>
                    <span className="text-xs opacity-70">x{item.quantity}</span>
                  </div>
                  <span className="text-xs text-on-surface-variant mb-2">{item.description}</span>
                  {item.type === 'PILL' && (
                    <button 
                      onClick={() => handleUseItem(item.itemId)}
                      disabled={isUsing}
                      className="self-end mt-1 px-3 py-1 bg-primary/20 hover:bg-primary border border-primary/50 hover:text-background rounded text-xs transition-colors"
                    >
                      Sử dụng
                    </button>
                  )}
                </div>
              ))}
              {inventory.items.length === 0 && <span className="text-sm opacity-50">Túi đồ trống trơn.</span>}
            </div>
          </div>

          {/* Active Buffs */}
          <div className="bg-surface-container/60 p-6 rounded-2xl border border-secondary/20">
            <h3 className="font-headline-md text-secondary mb-4 border-b border-secondary/20 pb-2 flex items-center gap-2">
              <Zap size={18} /> Hiệu Ứng Bổ Trợ
            </h3>
            
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center bg-background/50 p-2 rounded border border-on-surface-variant/20">
                <span className="text-sm">Tổng tốc độ (Đan dược):</span>
                <span className="font-bold text-primary">x{inventory.speedBuffMultiplier}</span>
              </div>

              {inventory.activeBuffs.map((buff, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-secondary/10 border border-secondary/30 rounded-lg">
                  <Clock size={16} className="text-secondary" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-secondary">{buff.buffType} (x{buff.multiplier})</span>
                    <span className="text-xs text-on-surface-variant">Hết hạn: {new Date(buff.expiresAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {inventory.activeBuffs.length === 0 && (
                <div className="text-sm text-on-surface-variant italic opacity-70">Không có hiệu ứng nào.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { ShoppingBag, Sparkles, Gem, Shield, Leaf, X, CheckCircle, AlertCircle, Coins } from 'lucide-react';
import { getShopItems, buyShopItem, ShopItem } from '../services/economyService';
import { useEconomy } from '../context/EconomyContext';
import { useAuth } from '../context/AuthContext';

const RARITY_CONFIG: Record<string, { color: string; glow: string; bg: string; border: string }> = {
  'Thường':    { color: '#a0a0a0', glow: 'rgba(160,160,160,0.3)', bg: 'rgba(160,160,160,0.08)', border: 'rgba(160,160,160,0.2)' },
  'Hiếm':      { color: '#f2ca50', glow: 'rgba(242,202,80,0.4)',  bg: 'rgba(242,202,80,0.08)',  border: 'rgba(242,202,80,0.3)' },
  'Cực Phẩm':  { color: '#b066ff', glow: 'rgba(176,102,255,0.45)',bg: 'rgba(176,102,255,0.1)',  border: 'rgba(176,102,255,0.35)' },
};

const TYPE_LABELS: Record<string, string> = {
  ALL: 'Tất cả',
  PILL: '⚗️ Đan Dược',
  ARTIFACT: '⚔️ Pháp Bảo',
  MATERIAL: '🌿 Nguyên Liệu',
};

function getRarityConfig(rarity: string) {
  return RARITY_CONFIG[rarity] ?? RARITY_CONFIG['Thường'];
}

// ─── Confirm Buy Modal ────────────────────────────────────────────────────────
function BuyModal({ item, onConfirm, onClose, spiritStones }: {
  item: ShopItem;
  onConfirm: (qty: number) => void;
  onClose: () => void;
  spiritStones: number | null;
}) {
  const [qty, setQty] = useState(1);
  const cfg = getRarityConfig(item.rarity);
  const total = item.price * qty;
  const canAfford = spiritStones !== null && spiritStones >= total;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl p-6 border"
        style={{ background: 'rgba(15,16,18,0.97)', borderColor: cfg.border, boxShadow: `0 0 40px ${cfg.glow}` }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-on-surface-variant hover:text-primary transition-colors">
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🏪</div>
          <h3 className="font-headline-md text-on-background text-xl">{item.name}</h3>
          <div className="font-label-caps text-xs mt-1" style={{ color: cfg.color }}>{item.rarity}</div>
        </div>

        <p className="font-body-md text-on-surface-variant text-sm mb-6 text-center">{item.description}</p>

        {/* Quantity selector */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => setQty(q => Math.max(1, q - 1))}
            className="w-8 h-8 rounded-full border border-on-surface-variant/30 text-on-surface-variant hover:border-primary hover:text-primary transition-all flex items-center justify-center font-bold"
          >−</button>
          <span className="font-headline-md text-on-background w-12 text-center">{qty}</span>
          <button
            onClick={() => setQty(q => q + 1)}
            className="w-8 h-8 rounded-full border border-on-surface-variant/30 text-on-surface-variant hover:border-primary hover:text-primary transition-all flex items-center justify-center font-bold"
          >+</button>
        </div>

        {/* Price summary */}
        <div className="rounded-xl p-4 mb-4 flex items-center justify-between" style={{ background: 'rgba(242,202,80,0.06)', border: '1px solid rgba(242,202,80,0.15)' }}>
          <span className="font-body-md text-on-surface-variant text-sm">Tổng chi phí</span>
          <span className="font-headline-md text-primary text-lg">{total.toLocaleString()} 💎</span>
        </div>

        {!canAfford && (
          <div className="flex items-center gap-2 text-error text-sm mb-4 bg-error/10 rounded-lg px-4 py-2">
            <AlertCircle size={16} />
            Không đủ Linh Thạch! (Hiện có: {(spiritStones ?? 0).toLocaleString()})
          </div>
        )}

        <button
          onClick={() => canAfford && onConfirm(qty)}
          disabled={!canAfford}
          className="w-full py-3 rounded-xl font-headline-md text-[16px] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: canAfford ? `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}44)` : 'rgba(255,255,255,0.05)',
            border: `1px solid ${canAfford ? cfg.color : 'rgba(255,255,255,0.1)'}`,
            color: canAfford ? cfg.color : '#666',
            boxShadow: canAfford ? `0 0 20px ${cfg.glow}` : 'none',
          }}
        >
          Xác nhận mua
        </button>
      </div>
    </div>
  );
}

// ─── Shop Item Card ───────────────────────────────────────────────────────────
function ShopItemCard({ item, onBuy }: { item: ShopItem; onBuy: (item: ShopItem) => void }) {
  const cfg = getRarityConfig(item.rarity);

  const getIcon = () => {
    if (item.type === 'PILL') return '⚗️';
    if (item.subType === 'WEAPON') return '⚔️';
    if (item.subType === 'ARMOR' || item.subType === 'PROTECTION') return '🛡️';
    return '🌿';
  };

  return (
    <div
      className="group relative rounded-xl p-4 transition-all duration-300 cursor-pointer hover:-translate-y-1"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
      onClick={() => onBuy(item)}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `0 0 24px ${cfg.glow}`, border: `1px solid ${cfg.color}60` }}
      />

      {/* Rarity badge */}
      <div className="absolute top-3 right-3 font-label-caps text-[9px] px-2 py-0.5 rounded-full"
        style={{ background: `${cfg.color}22`, color: cfg.color, border: `1px solid ${cfg.color}44` }}>
        {item.rarity}
      </div>

      {/* Icon */}
      <div className="text-3xl mb-3 h-10 flex items-center">{getIcon()}</div>

      {/* Name */}
      <h4 className="font-headline-md text-[15px] text-on-background mb-1 group-hover:text-primary transition-colors">
        {item.name}
      </h4>

      {/* Description */}
      <p className="font-body-md text-on-surface-variant text-[11px] leading-relaxed mb-4 line-clamp-2">
        {item.description}
      </p>

      {/* Price */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-primary text-sm">💎</span>
          <span className="font-headline-md text-primary text-[15px]">{item.price.toLocaleString()}</span>
        </div>
        <div
          className="font-label-caps text-[10px] px-3 py-1 rounded-full transition-all duration-300 group-hover:scale-105"
          style={{ background: `${cfg.color}33`, color: cfg.color }}
        >
          Mua
        </div>
      </div>
    </div>
  );
}

// ─── Main Shop Component ──────────────────────────────────────────────────────
export default function Shop() {
  const { user } = useAuth();
  const { spiritStones, pendingStones, isCollecting, fetchBalance, collectStones } = useEconomy();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [shopRes] = await Promise.all([
          getShopItems(),
          fetchBalance(),
        ]);
        setItems(shopRes.data.items);
      } catch {
        showToast('error', 'Không thể tải dữ liệu Thương Hội.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchBalance]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleBuy = async (qty: number) => {
    if (!selectedItem || buying) return;
    setBuying(true);
    try {
      const res = await buyShopItem(selectedItem.itemId, qty);
      await fetchBalance();
      setSelectedItem(null);
      showToast('success', res.data.message);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message ?? 'Mua thất bại.');
    } finally {
      setBuying(false);
    }
  };

  const handleCollect = async () => {
    try {
      const msg = await collectStones();
      showToast('success', msg);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message ?? 'Thu thập thất bại.');
    }
  };

  const filtered = activeType === 'ALL' ? items : items.filter(i => i.type === activeType);

  if (!user?.isCharacterCreated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel rounded-2xl p-10 text-center">
          <div className="text-5xl mb-4">🏪</div>
          <h2 className="font-headline-md text-on-background text-xl mb-2">Thương Hội</h2>
          <p className="text-on-surface-variant">Hãy tạo nhân vật để sử dụng Thương Hội.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative px-4 md:px-8 py-8 max-w-6xl mx-auto">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="orb-gold w-[500px] h-[500px] top-0 right-0 opacity-30" />
        <div className="orb-jade w-[400px] h-[400px] bottom-0 left-0 opacity-20" />
      </div>

      <div className="relative z-10">
        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="font-label-caps text-secondary tracking-[0.2em] mb-2 flex items-center gap-2">
                <ShoppingBag size={14} /> Thương Hội
              </div>
              <h1 className="font-headline-lg text-on-background text-3xl md:text-4xl">
                Linh <span className="gradient-text-gold">Thạch Phường</span>
              </h1>
              <p className="font-body-md text-on-surface-variant mt-2 text-sm">
                Đổi Linh Thạch lấy đan dược, pháp bảo và nguyên liệu quý hiếm.
              </p>
            </div>

            {/* Balance + Collect */}
            <div className="glass-panel rounded-2xl p-4 flex flex-col items-end gap-2 min-w-[180px]">
              <div className="font-label-caps text-on-surface-variant text-[10px]">Linh Thạch</div>
              <div className="font-headline-md text-primary text-2xl flex items-center gap-1">
                💎 {spiritStones !== null ? spiritStones.toLocaleString() : '...'}
              </div>
              {pendingStones > 0 && (
                <button
                  onClick={handleCollect}
                  disabled={isCollecting}
                  className="font-label-caps text-[10px] px-3 py-1.5 rounded-full transition-all duration-300 hover:scale-105 disabled:opacity-50"
                  style={{ background: 'rgba(126,217,158,0.15)', color: '#7ed99e', border: '1px solid rgba(126,217,158,0.3)' }}
                >
                  {isCollecting ? 'Đang thu...' : `+ ${pendingStones} chưa thu`}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Type Filter Tabs ── */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveType(key)}
              className="font-label-caps text-[11px] px-4 py-2 rounded-full transition-all duration-200"
              style={{
                background: activeType === key ? 'rgba(242,202,80,0.15)' : 'rgba(255,255,255,0.04)',
                color: activeType === key ? '#f2ca50' : '#a0926a',
                border: `1px solid ${activeType === key ? 'rgba(242,202,80,0.4)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Items Grid ── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-surface-container animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-on-surface-variant">
            <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
            <p>Không có vật phẩm trong danh mục này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(item => (
              <ShopItemCard key={item.itemId} item={item} onBuy={setSelectedItem} />
            ))}
          </div>
        )}
      </div>

      {/* ── Buy Modal ── */}
      {selectedItem && (
        <BuyModal
          item={selectedItem}
          spiritStones={spiritStones}
          onConfirm={handleBuy}
          onClose={() => !buying && setSelectedItem(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-xl shadow-2xl font-body-md text-sm transition-all animate-fade-in`}
          style={{
            background: toast.type === 'success' ? 'rgba(126,217,158,0.15)' : 'rgba(255,100,100,0.15)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(126,217,158,0.4)' : 'rgba(255,100,100,0.4)'}`,
            color: toast.type === 'success' ? '#7ed99e' : '#ff6b6b',
            backdropFilter: 'blur(10px)',
          }}
        >
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

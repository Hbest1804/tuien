import { useState, useEffect, useCallback } from 'react';
import { Gavel, Plus, Clock, TrendingUp, AlertCircle, CheckCircle, X, RefreshCw, Tag, ChevronDown } from 'lucide-react';
import {
  getAuctionListings, getMyAuctionListings, listAuctionItem, placeBid,
  buyoutListing, claimAuctionListing, cancelAuctionListing,
  AuctionListing, ListItemPayload,
} from '../services/auctionService';
import { getInventoryStatus, InventoryItem } from '../services/inventoryService';
import { useEconomy } from '../context/EconomyContext';
import { useAuth } from '../context/AuthContext';

const RARITY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  'Thường':   { color: '#a0a0a0', bg: 'rgba(160,160,160,0.08)', border: 'rgba(160,160,160,0.2)' },
  'Hiếm':     { color: '#f2ca50', bg: 'rgba(242,202,80,0.08)',  border: 'rgba(242,202,80,0.3)' },
  'Cực Phẩm': { color: '#b066ff', bg: 'rgba(176,102,255,0.1)',  border: 'rgba(176,102,255,0.35)' },
};
const getRarity = (r: string) => RARITY_CONFIG[r] ?? RARITY_CONFIG['Thường'];

// ─── Countdown Timer ──────────────────────────────────────────────────────────
function Countdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining('Hết hạn'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const urgent = new Date(expiresAt).getTime() - Date.now() < 3600000;
  return (
    <span className="flex items-center gap-1 font-label-caps text-[10px]" style={{ color: urgent ? '#ff6b6b' : '#d0c5af' }}>
      <Clock size={10} /> {remaining}
    </span>
  );
}

// ─── Listing Card ─────────────────────────────────────────────────────────────
function ListingCard({ listing, userId, onBid, onBuyout, onClaim, onCancel }: {
  listing: AuctionListing;
  userId: string;
  onBid: (l: AuctionListing) => void;
  onBuyout: (l: AuctionListing) => void;
  onClaim: (l: AuctionListing) => void;
  onCancel: (l: AuctionListing) => void;
}) {
  const cfg = getRarity(listing.itemRarity);
  const isMine = listing.sellerId === userId;
  const isTopBidder = listing.bidderId === userId;
  const displayPrice = listing.currentBid > 0 ? listing.currentBid : listing.startingPrice;
  const canClaim =
    (listing.status === 'pending_claim' && (isMine || isTopBidder)) ||
    (listing.status === 'expired' && isMine && !listing.sellerClaimed);

  return (
    <div className="relative rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>

      {/* Status badges */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-label-caps text-[9px] px-2 py-0.5 rounded-full"
            style={{ background: `${cfg.color}22`, color: cfg.color }}>{listing.itemRarity}</span>
          {isMine && <span className="font-label-caps text-[9px] px-2 py-0.5 rounded-full bg-secondary/15 text-secondary">Của tôi</span>}
          {isTopBidder && !isMine && <span className="font-label-caps text-[9px] px-2 py-0.5 rounded-full bg-primary/15 text-primary">Đang thắng</span>}
        </div>
        {listing.status === 'active' && <Countdown expiresAt={listing.expiresAt} />}
        {listing.status !== 'active' && (
          <span className="font-label-caps text-[9px] text-on-surface-variant">{
            listing.status === 'sold' ? '✅ Đã bán' :
            listing.status === 'expired' ? '⏰ Hết hạn' :
            listing.status === 'cancelled' ? '❌ Đã huỷ' :
            listing.status === 'pending_claim' ? '📦 Chờ claim' : ''
          }</span>
        )}
      </div>

      {/* Item name */}
      <h4 className="font-headline-md text-on-background text-[15px] mb-1">{listing.itemName}</h4>
      <p className="font-label-caps text-[10px] text-on-surface-variant mb-3">
        x{listing.quantity} · Người bán: {listing.sellerName}
      </p>

      {/* Prices */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="font-label-caps text-[9px] text-on-surface-variant mb-0.5">
            {listing.currentBid > 0 ? 'Giá hiện tại' : 'Khởi điểm'}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-primary text-sm">💎</span>
            <span className="font-headline-md text-primary text-[18px]">{displayPrice.toLocaleString()}</span>
          </div>
        </div>
        {listing.buyoutPrice && (
          <div className="text-right">
            <div className="font-label-caps text-[9px] text-on-surface-variant mb-0.5">Mua ngay</div>
            <div className="font-label-caps text-[11px] text-secondary">💎 {listing.buyoutPrice.toLocaleString()}</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {/* Nút bid (không phải người bán, listing active) */}
        {!isMine && listing.status === 'active' && (
          <button onClick={() => onBid(listing)}
            className="flex-1 py-2 rounded-lg font-label-caps text-[11px] transition-all duration-200 hover:scale-105"
            style={{ background: 'rgba(242,202,80,0.12)', color: '#f2ca50', border: '1px solid rgba(242,202,80,0.3)' }}>
            <TrendingUp size={12} className="inline mr-1" />Đặt thầu
          </button>
        )}
        {/* Nút buyout */}
        {!isMine && listing.status === 'active' && listing.buyoutPrice && (
          <button onClick={() => onBuyout(listing)}
            className="flex-1 py-2 rounded-lg font-label-caps text-[11px] transition-all duration-200 hover:scale-105"
            style={{ background: 'rgba(126,217,158,0.12)', color: '#7ed99e', border: '1px solid rgba(126,217,158,0.3)' }}>
            <Tag size={12} className="inline mr-1" />Mua ngay
          </button>
        )}
        {/* Nút huỷ (người bán, chưa có bid) */}
        {isMine && listing.status === 'active' && !listing.bidderId && (
          <button onClick={() => onCancel(listing)}
            className="flex-1 py-2 rounded-lg font-label-caps text-[11px] transition-all duration-200 hover:scale-105"
            style={{ background: 'rgba(255,100,100,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,100,100,0.25)' }}>
            <X size={12} className="inline mr-1" />Huỷ bán
          </button>
        )}
        {/* Nút claim */}
        {canClaim && (
          <button onClick={() => onClaim(listing)}
            className="flex-1 py-2 rounded-lg font-label-caps text-[11px] transition-all duration-200 hover:scale-105"
            style={{ background: 'rgba(176,102,255,0.15)', color: '#b066ff', border: '1px solid rgba(176,102,255,0.35)' }}>
            <CheckCircle size={12} className="inline mr-1" />Nhận hàng/tiền
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Bid Modal ────────────────────────────────────────────────────────────────
function BidModal({ listing, onConfirm, onClose, spiritStones }: {
  listing: AuctionListing;
  onConfirm: (amount: number) => void;
  onClose: () => void;
  spiritStones: number | null;
}) {
  const currentPrice = listing.currentBid > 0 ? listing.currentBid : listing.startingPrice;
  const minBid = Math.ceil(currentPrice * 1.05);
  const [bidAmount, setBidAmount] = useState(minBid);
  const canAfford = spiritStones !== null && spiritStones >= bidAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm rounded-2xl p-6 glass-panel" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-on-surface-variant hover:text-primary"><X size={18} /></button>
        <h3 className="font-headline-md text-on-background text-lg mb-1">Đặt Giá Thầu</h3>
        <p className="text-on-surface-variant text-sm mb-4">{listing.itemName} x{listing.quantity}</p>

        <div className="mb-3">
          <label className="font-label-caps text-[10px] text-on-surface-variant block mb-2">
            Số tiền (tối thiểu: {minBid.toLocaleString()} 💎)
          </label>
          <input
            type="number"
            value={bidAmount}
            min={minBid}
            onChange={e => setBidAmount(Math.max(minBid, parseInt(e.target.value) || minBid))}
            className="w-full bg-surface-container border border-on-surface-variant/20 rounded-lg px-4 py-3 text-on-background font-body-md focus:outline-none focus:border-primary"
          />
        </div>

        {!canAfford && (
          <div className="flex items-center gap-2 text-error text-xs mb-3 bg-error/10 rounded-lg px-3 py-2">
            <AlertCircle size={13} /> Không đủ Linh Thạch (có: {(spiritStones ?? 0).toLocaleString()})
          </div>
        )}

        <button
          onClick={() => canAfford && onConfirm(bidAmount)}
          disabled={!canAfford}
          className="w-full py-3 rounded-xl font-headline-md text-[15px] text-primary transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01]"
          style={{ background: 'rgba(242,202,80,0.15)', border: '1px solid rgba(242,202,80,0.4)' }}
        >
          Đặt {bidAmount.toLocaleString()} 💎
        </button>
      </div>
    </div>
  );
}

// ─── List Item Modal ──────────────────────────────────────────────────────────
function ListItemModal({ inventoryItems, onConfirm, onClose }: {
  inventoryItems: InventoryItem[];
  onConfirm: (payload: ListItemPayload) => void;
  onClose: () => void;
}) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [qty, setQty] = useState(1);
  const [startPrice, setStartPrice] = useState(50);
  const [buyoutPrice, setBuyoutPrice] = useState<number | ''>('');
  const [duration, setDuration] = useState<12 | 24 | 48>(24);
  const [showDropdown, setShowDropdown] = useState(false);

  const sellableItems = inventoryItems.filter(i => i.type !== 'ARTIFACT' || i.quantity > 0);

  const handleSubmit = () => {
    if (!selectedItem) return;
    onConfirm({
      itemId: selectedItem.itemId,
      quantity: qty,
      startingPrice: startPrice,
      buyoutPrice: buyoutPrice ? Number(buyoutPrice) : null,
      durationHours: duration,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md rounded-2xl p-6 glass-panel max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-on-surface-variant hover:text-primary"><X size={18} /></button>
        <h3 className="font-headline-md text-on-background text-lg mb-1">Đăng Bán Vật Phẩm</h3>
        <p className="text-on-surface-variant text-sm mb-5">Phí giao dịch: 5% giá bán cuối.</p>

        {/* Select item */}
        <div className="mb-4 relative">
          <label className="font-label-caps text-[10px] text-on-surface-variant block mb-2">Chọn vật phẩm</label>
          <button
            onClick={() => setShowDropdown(d => !d)}
            className="w-full bg-surface-container border border-on-surface-variant/20 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:border-primary transition-colors"
          >
            <span className="font-body-md text-on-background text-sm">
              {selectedItem ? `${selectedItem.name} (x${selectedItem.quantity})` : 'Chọn vật phẩm...'}
            </span>
            <ChevronDown size={14} className="text-on-surface-variant" />
          </button>
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container border border-on-surface-variant/20 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
              {sellableItems.length === 0 ? (
                <div className="px-4 py-3 text-on-surface-variant text-sm">Túi đồ trống.</div>
              ) : sellableItems.map(item => (
                <button
                  key={item.itemId}
                  onClick={() => { setSelectedItem(item); setQty(1); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-primary/10 transition-colors flex items-center justify-between"
                >
                  <span className="font-body-md text-on-background text-sm">{item.name}</span>
                  <span className="font-label-caps text-[10px] text-on-surface-variant">x{item.quantity}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedItem && (
          <>
            {/* Quantity */}
            <div className="mb-4">
              <label className="font-label-caps text-[10px] text-on-surface-variant block mb-2">Số lượng (max: {selectedItem.quantity})</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setQty(q => Math.max(1, q-1))} className="w-8 h-8 rounded-full border border-on-surface-variant/30 text-on-surface-variant hover:border-primary hover:text-primary transition-all flex items-center justify-center">−</button>
                <input type="number" value={qty} min={1} max={selectedItem.quantity}
                  onChange={e => setQty(Math.min(selectedItem.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="flex-1 bg-surface-container border border-on-surface-variant/20 rounded-lg px-3 py-2 text-center text-on-background font-body-md focus:outline-none focus:border-primary"
                />
                <button onClick={() => setQty(selectedItem.quantity)} className="w-8 h-8 rounded-full border border-on-surface-variant/30 text-on-surface-variant hover:border-primary hover:text-primary transition-all flex items-center justify-center text-xs">All</button>
              </div>
            </div>

            {/* Starting price */}
            <div className="mb-4">
              <label className="font-label-caps text-[10px] text-on-surface-variant block mb-2">Giá khởi điểm (Linh Thạch)</label>
              <input type="number" value={startPrice} min={1}
                onChange={e => setStartPrice(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-surface-container border border-on-surface-variant/20 rounded-lg px-4 py-3 text-on-background font-body-md focus:outline-none focus:border-primary"
              />
            </div>

            {/* Buyout price */}
            <div className="mb-4">
              <label className="font-label-caps text-[10px] text-on-surface-variant block mb-2">Giá mua ngay (để trống nếu không muốn)</label>
              <input type="number" value={buyoutPrice} min={startPrice + 1} placeholder="Không giới hạn"
                onChange={e => setBuyoutPrice(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full bg-surface-container border border-on-surface-variant/20 rounded-lg px-4 py-3 text-on-background font-body-md focus:outline-none focus:border-primary placeholder:text-on-surface-variant/40"
              />
            </div>

            {/* Duration */}
            <div className="mb-6">
              <label className="font-label-caps text-[10px] text-on-surface-variant block mb-2">Thời hạn đấu giá</label>
              <div className="flex gap-2">
                {([12, 24, 48] as const).map(d => (
                  <button key={d} onClick={() => setDuration(d)}
                    className="flex-1 py-2 rounded-lg font-label-caps text-[11px] transition-all duration-200"
                    style={{
                      background: duration === d ? 'rgba(242,202,80,0.15)' : 'rgba(255,255,255,0.04)',
                      color: duration === d ? '#f2ca50' : '#a0926a',
                      border: `1px solid ${duration === d ? 'rgba(242,202,80,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    }}>
                    {d}h
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleSubmit}
              className="w-full py-3 rounded-xl font-headline-md text-[15px] text-primary transition-all hover:scale-[1.01]"
              style={{ background: 'rgba(242,202,80,0.15)', border: '1px solid rgba(242,202,80,0.4)' }}>
              Đăng bán
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Auction House ───────────────────────────────────────────────────────
export default function AuctionHouse() {
  const { user } = useAuth();
  const { spiritStones, fetchBalance } = useEconomy();
  const [tab, setTab] = useState<'browse' | 'mine'>('browse');
  const [listings, setListings] = useState<AuctionListing[]>([]);
  const [myListings, setMyListings] = useState<{ selling: AuctionListing[]; bidding: AuctionListing[] }>({ selling: [], bidding: [] });
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState('newest');
  const [bidTarget, setBidTarget] = useState<AuctionListing | null>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const loadListings = useCallback(async () => {
    try {
      const res = await getAuctionListings({ sort: sortOption });
      setListings(res.data.listings);
    } catch { showToast('error', 'Không thể tải danh sách đấu giá.'); }
  }, [sortOption]);

  const loadMyListings = useCallback(async () => {
    try {
      const res = await getMyAuctionListings();
      setMyListings(res.data);
    } catch { /* ignore */ }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadListings(),
      loadMyListings(),
      fetchBalance(),
      getInventoryStatus().then(r => setInventoryItems(r.data.inventory.items)).catch(() => {}),
    ]);
    setLoading(false);
  }, [loadListings, loadMyListings, fetchBalance]);

  useEffect(() => { if (user?.isCharacterCreated) loadAll(); }, [user, loadAll]);
  useEffect(() => { if (user?.isCharacterCreated) loadListings(); }, [sortOption, loadListings]);

  const userId = user?._id ?? '';

  const handleBid = async (amount: number) => {
    if (!bidTarget || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await placeBid(bidTarget._id, amount);
      showToast('success', res.data.message);
      setBidTarget(null);
      await Promise.all([loadListings(), loadMyListings(), fetchBalance()]);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message ?? 'Đặt thầu thất bại.');
    } finally { setActionLoading(false); }
  };

  const handleBuyout = async (listing: AuctionListing) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await buyoutListing(listing._id);
      showToast('success', res.data.message);
      await Promise.all([loadListings(), loadMyListings(), fetchBalance()]);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message ?? 'Mua ngay thất bại.');
    } finally { setActionLoading(false); }
  };

  const handleClaim = async (listing: AuctionListing) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await claimAuctionListing(listing._id);
      showToast('success', res.data.message);
      await Promise.all([loadMyListings(), fetchBalance()]);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message ?? 'Claim thất bại.');
    } finally { setActionLoading(false); }
  };

  const handleCancel = async (listing: AuctionListing) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await cancelAuctionListing(listing._id);
      showToast('success', res.data.message);
      await Promise.all([loadListings(), loadMyListings()]);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message ?? 'Huỷ thất bại.');
    } finally { setActionLoading(false); }
  };

  const handleListItem = async (payload: ListItemPayload) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await listAuctionItem(payload);
      showToast('success', res.data.message);
      setShowListModal(false);
      await Promise.all([loadListings(), loadMyListings(),
        getInventoryStatus().then(r => setInventoryItems(r.data.inventory.items)).catch(() => {})]);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message ?? 'Đăng bán thất bại.');
    } finally { setActionLoading(false); }
  };

  if (!user?.isCharacterCreated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel rounded-2xl p-10 text-center">
          <div className="text-5xl mb-4">🏛️</div>
          <h2 className="font-headline-md text-on-background text-xl mb-2">Đấu Giá Hội</h2>
          <p className="text-on-surface-variant">Hãy tạo nhân vật để sử dụng Đấu Giá Hội.</p>
        </div>
      </div>
    );
  }

  const allMyItems = [...myListings.selling, ...myListings.bidding];

  return (
    <div className="min-h-screen relative px-4 md:px-8 py-8 max-w-6xl mx-auto">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="orb-epic w-[500px] h-[500px] top-0 right-[-100px] opacity-30" />
        <div className="orb-gold w-[400px] h-[400px] bottom-0 left-0 opacity-20" />
      </div>

      <div className="relative z-10">
        {/* ── Header ── */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="font-label-caps text-secondary tracking-[0.2em] mb-2 flex items-center gap-2">
              <Gavel size={14} /> Đấu Giá Hội
            </div>
            <h1 className="font-headline-lg text-on-background text-3xl md:text-4xl">
              Linh <span className="gradient-text-gold">Bảo Đấu</span>
            </h1>
            <p className="font-body-md text-on-surface-variant mt-2 text-sm">
              Đấu giá vật phẩm hiếm giữa các tu sĩ. Phí giao dịch 5%.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Balance */}
            <div className="glass-panel rounded-xl px-4 py-2 flex items-center gap-2">
              <span className="font-label-caps text-[10px] text-on-surface-variant">Linh Thạch:</span>
              <span className="font-headline-md text-primary text-base">💎 {spiritStones !== null ? spiritStones.toLocaleString() : '...'}</span>
            </div>
            {/* Refresh */}
            <button onClick={loadAll} disabled={loading}
              className="p-2 rounded-xl transition-all hover:text-primary text-on-surface-variant"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            {/* List item */}
            <button onClick={() => setShowListModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-label-caps text-[11px] transition-all hover:scale-105"
              style={{ background: 'rgba(242,202,80,0.15)', color: '#f2ca50', border: '1px solid rgba(242,202,80,0.35)' }}>
              <Plus size={13} /> Đăng bán
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-6 bg-surface-container/50 rounded-xl p-1 w-fit">
          {(['browse', 'mine'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-6 py-2 rounded-lg font-label-caps text-[11px] transition-all duration-200"
              style={{
                background: tab === t ? 'rgba(242,202,80,0.15)' : 'transparent',
                color: tab === t ? '#f2ca50' : '#a0926a',
                border: tab === t ? '1px solid rgba(242,202,80,0.3)' : '1px solid transparent',
              }}>
              {t === 'browse' ? '🏛️ Duyệt đấu giá' : `📦 Của tôi (${allMyItems.length})`}
            </button>
          ))}
        </div>

        {/* ── Browse Tab ── */}
        {tab === 'browse' && (
          <>
            {/* Sort */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {[['newest', 'Mới nhất'], ['ending_soon', 'Sắp hết hạn'], ['price_asc', 'Giá tăng dần'], ['price_desc', 'Giá giảm dần']].map(([v, l]) => (
                <button key={v} onClick={() => setSortOption(v)}
                  className="font-label-caps text-[10px] px-3 py-1.5 rounded-full transition-all duration-200"
                  style={{
                    background: sortOption === v ? 'rgba(242,202,80,0.15)' : 'rgba(255,255,255,0.04)',
                    color: sortOption === v ? '#f2ca50' : '#a0926a',
                    border: `1px solid ${sortOption === v ? 'rgba(242,202,80,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  }}>{l}</button>
              ))}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-52 rounded-xl bg-surface-container animate-pulse" />)}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-20 text-on-surface-variant">
                <Gavel size={48} className="mx-auto mb-4 opacity-30" />
                <p className="mb-2">Chưa có phiên đấu giá nào.</p>
                <p className="text-sm">Hãy là người đầu tiên đăng bán!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings.map(l => (
                  <ListingCard key={l._id} listing={l} userId={userId}
                    onBid={setBidTarget} onBuyout={handleBuyout} onClaim={handleClaim} onCancel={handleCancel} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── My Tab ── */}
        {tab === 'mine' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-headline-md text-on-background text-lg mb-3">Đang đăng bán ({myListings.selling.length})</h3>
              {myListings.selling.length === 0 ? (
                <div className="text-center py-10 text-on-surface-variant text-sm glass-panel rounded-xl">Bạn chưa đăng bán vật phẩm nào.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myListings.selling.map(l => (
                    <ListingCard key={l._id} listing={l} userId={userId}
                      onBid={setBidTarget} onBuyout={handleBuyout} onClaim={handleClaim} onCancel={handleCancel} />
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-headline-md text-on-background text-lg mb-3">Đang thắng thầu ({myListings.bidding.length})</h3>
              {myListings.bidding.length === 0 ? (
                <div className="text-center py-10 text-on-surface-variant text-sm glass-panel rounded-xl">Bạn chưa đặt thầu phiên nào.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myListings.bidding.map(l => (
                    <ListingCard key={l._id} listing={l} userId={userId}
                      onBid={setBidTarget} onBuyout={handleBuyout} onClaim={handleClaim} onCancel={handleCancel} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {bidTarget && (
        <BidModal listing={bidTarget} spiritStones={spiritStones}
          onConfirm={handleBid} onClose={() => !actionLoading && setBidTarget(null)} />
      )}
      {showListModal && (
        <ListItemModal inventoryItems={inventoryItems}
          onConfirm={handleListItem} onClose={() => !actionLoading && setShowListModal(false)} />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-xl shadow-2xl font-body-md text-sm"
          style={{
            background: toast.type === 'success' ? 'rgba(126,217,158,0.15)' : 'rgba(255,100,100,0.15)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(126,217,158,0.4)' : 'rgba(255,100,100,0.4)'}`,
            color: toast.type === 'success' ? '#7ed99e' : '#ff6b6b',
            backdropFilter: 'blur(10px)',
          }}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { getVipPackages, purchaseJade, spendJade } from '../services/vipService';
import { Diamond, Crown, ShoppingBag, Zap } from 'lucide-react';

const TIER_COLORS = ['#cd7f32', '#c0c0c0', '#f2ca50', '#b066ff'];

export function JadeShop() {
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<'shop' | 'vip'>('vip');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetch = async () => {
    try {
      const res = await getVipPackages();
      setData(res.data);
    } catch { }
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const showMsg = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage({ text, type }); setTimeout(() => setMessage(null), 5000);
  };

  const handlePurchase = async (packageId: string) => {
    setActing(true);
    try {
      const res = await purchaseJade(packageId);
      showMsg(res.data.message, 'success');
      await fetch();
    } catch (e: any) {
      showMsg(e.response?.data?.message || 'Lỗi server', 'error');
    }
    setActing(false);
  };

  const handleSpend = async (jadeItemId: string) => {
    setActing(true);
    try {
      const res = await spendJade(jadeItemId);
      showMsg(res.data.message, 'success');
      await fetch();
    } catch (e: any) {
      showMsg(e.response?.data?.message || 'Lỗi server', 'error');
    }
    setActing(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-[#b066ff]/30 border-t-[#b066ff] animate-spin" />
    </div>
  );

  const vipExpiry = data?.vipExpiry ? new Date(data.vipExpiry) : null;
  const isVipActive = vipExpiry && vipExpiry > new Date();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="font-label-caps tracking-[0.2em] mb-2" style={{ color: '#b066ff' }}>Cửa Hàng</div>
        <h1 className="font-headline-xl text-[40px]" style={{
          background: 'linear-gradient(135deg, #b066ff, #f2ca50)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>💎 Cửa Hàng Tiên Ngọc</h1>
        <p className="text-on-surface-variant mt-2">Nâng cấp hành trình tu tiên với Tiên Ngọc đặc biệt.</p>
      </div>

      {/* Toast */}
      {message && (
        <div className={`fixed top-24 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl text-sm font-medium max-w-sm
          ${message.type === 'success' ? 'bg-secondary/20 border border-secondary text-secondary' :
            message.type === 'error' ? 'bg-error/20 border border-error text-error' :
              'bg-[#b066ff]/20 border border-[#b066ff] text-[#b066ff]'}`}>
          {message.text}
        </div>
      )}

      {/* Jade & VIP status */}
      <div className="glass-panel rounded-2xl p-5 mb-6 flex flex-wrap items-center justify-between gap-4"
        style={{ borderColor: '#b066ff30', background: 'rgba(176,102,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: 'rgba(176,102,255,0.2)', border: '1px solid rgba(176,102,255,0.4)' }}>
            💎
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: '#b066ff' }}>
              {(data?.jadeCoins || 0).toLocaleString()}
            </div>
            <div className="text-xs text-on-surface-variant">Tiên Ngọc</div>
          </div>
        </div>
        {isVipActive ? (
          <div className="flex items-center gap-3">
            <Crown size={20} style={{ color: TIER_COLORS[data.vipLevel - 1] || '#ccc' }} />
            <div>
              <div className="font-bold" style={{ color: TIER_COLORS[data.vipLevel - 1] || '#ccc' }}>
                VIP {data.vipLevel}
              </div>
              <div className="text-xs text-on-surface-variant">Hết hạn: {vipExpiry?.toLocaleDateString('vi-VN')}</div>
            </div>
          </div>
        ) : (
          <div className="text-on-surface-variant text-sm">Chưa có VIP</div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-surface-container rounded-xl p-1">
        <button onClick={() => setTab('vip')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2
            ${tab === 'vip' ? 'text-on-primary' : 'text-on-surface-variant hover:text-on-background'}`}
          style={tab === 'vip' ? { background: 'linear-gradient(135deg, #b066ff, #7040c0)' } : {}}>
          <Crown size={16} /> Gói VIP
        </button>
        <button onClick={() => setTab('shop')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2
            ${tab === 'shop' ? 'text-on-primary' : 'text-on-surface-variant hover:text-on-background'}`}
          style={tab === 'shop' ? { background: 'linear-gradient(135deg, #f2ca50, #c49a00)' } : {}}>
          <ShoppingBag size={16} /> Đổi Đồ
        </button>
      </div>

      {/* VIP Packages */}
      {tab === 'vip' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(data?.packages || []).map((pkg: any, i: number) => (
            <div
              key={pkg.id}
              className="glass-panel rounded-2xl p-6 border relative overflow-hidden transition-all duration-300 hover:scale-[1.02]"
              style={{ borderColor: `${TIER_COLORS[i] || '#ccc'}40` }}
            >
              {/* Glow */}
              <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at top right, ${TIER_COLORS[i] || '#ccc'}, transparent 70%)` }} />

              <div className="relative z-10">
                <div className="text-3xl mb-2">
                  {i === 0 ? '🥉' : i === 1 ? '🥈' : '👑'}
                </div>
                <h3 className="font-bold text-on-background mb-1">{pkg.name}</h3>
                <div className="text-2xl font-bold mb-3" style={{ color: TIER_COLORS[i] || '#ccc' }}>
                  {pkg.price.toLocaleString('vi-VN')}đ
                </div>
                <div className="flex items-center gap-2 mb-4 text-sm" style={{ color: '#b066ff' }}>
                  <Diamond size={14} />
                  <span className="font-bold">+{pkg.jadeCoins.toLocaleString()} Tiên Ngọc</span>
                </div>
                <ul className="space-y-1 mb-5">
                  {pkg.benefits.map((b: string, j: number) => (
                    <li key={j} className="text-xs text-on-surface-variant flex items-center gap-2">
                      <Zap size={10} style={{ color: TIER_COLORS[i] || '#ccc' }} />
                      {b}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={acting}
                  className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${TIER_COLORS[i]}cc, ${TIER_COLORS[i]}66)`, color: '#fff', border: `1px solid ${TIER_COLORS[i]}80` }}
                >
                  {acting ? '...' : '💎 Mua Ngay (Demo)'}
                </button>
                <p className="text-xs text-on-surface-variant/50 text-center mt-2">
                  * Demo mode — Admin có thể cấp thủ công
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Jade items shop */}
      {tab === 'shop' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.jadeItems || []).map((item: any) => (
            <div key={item.id}
              className="glass-panel rounded-2xl p-5 border border-[#b066ff]/20 hover:border-[#b066ff]/50 transition-all duration-300 group">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-on-background text-sm">{item.name}</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">{item.description}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg" style={{ color: '#b066ff' }}>{item.jadeCost}</div>
                  <div className="text-xs text-on-surface-variant">Tiên Ngọc</div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="text-xs text-on-surface-variant/60">
                  {item.spiritStones ? `💎 ${item.spiritStones.toLocaleString()} Linh Thạch` : `📦 ${item.quantity}x ${item.name}`}
                </div>
                <button
                  onClick={() => handleSpend(item.id)}
                  disabled={acting || (data?.jadeCoins || 0) < item.jadeCost}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 text-white"
                  style={{
                    background: (data?.jadeCoins || 0) >= item.jadeCost
                      ? 'linear-gradient(135deg, #b066ff, #7040c0)'
                      : '#333',
                  }}
                >
                  {acting ? '...' : (data?.jadeCoins || 0) >= item.jadeCost ? '💎 Đổi' : '❌ Không đủ'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

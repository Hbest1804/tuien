import { useState, useEffect } from 'react';
import { getBlacksmithRecipes, craftItem, enchantItem } from '../services/blacksmithService';
import { Hammer, Sparkles, Package } from 'lucide-react';

export function Blacksmith() {
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<'craft' | 'enchant'>('craft');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [enchantTarget, setEnchantTarget] = useState('');
  const [enchantGem, setEnchantGem] = useState('');
  const [craftResult, setCraftResult] = useState<any>(null);

  const fetch = async () => {
    try {
      const res = await getBlacksmithRecipes();
      setData(res.data);
    } catch { }
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const showMsg = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage({ text, type }); setTimeout(() => setMessage(null), 5000);
  };

  const handleCraft = async (recipeId: string) => {
    setActing(true);
    try {
      const res = await craftItem(recipeId);
      setCraftResult(res.data);
      showMsg(res.data.message, res.data.success ? 'success' : 'error');
      await fetch();
    } catch (e: any) {
      showMsg(e.response?.data?.message || 'Lỗi server', 'error');
    }
    setActing(false);
  };

  const handleEnchant = async () => {
    if (!enchantTarget || !enchantGem) return;
    setActing(true);
    try {
      const res = await enchantItem(enchantTarget, enchantGem);
      showMsg(res.data.message, 'success');
      await fetch();
    } catch (e: any) {
      showMsg(e.response?.data?.message || 'Lỗi server', 'error');
    }
    setActing(false);
  };

  const RARITY_COLORS: Record<string, string> = {
    'Thường': '#a0a0a0', 'Hiếm': '#f2ca50', 'Cực Phẩm': '#b066ff',
  };

  const CATEGORY_LABELS: Record<string, string> = {
    all: 'Tất Cả', weapon: '⚔️ Vũ Khí', armor: '🛡️ Giáp', artifact: '💎 Pháp Bảo', pill: '💊 Đan Dược',
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    </div>
  );

  const recipes = (data?.recipes || []).filter(
    (r: any) => selectedCategory === 'all' || r.category === selectedCategory
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="font-label-caps text-primary tracking-[0.2em] mb-2">Chế Tạo</div>
        <h1 className="font-headline-xl text-[40px] gradient-text-gold">🔨 Luyện Khí Phường</h1>
        <p className="text-on-surface-variant mt-2">Chế tạo và khảm nạm Pháp Bảo từ nguyên liệu bí cảnh.</p>
      </div>

      {/* Toast */}
      {message && (
        <div className={`fixed top-24 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl text-sm font-medium max-w-sm
          ${message.type === 'success' ? 'bg-secondary/20 border border-secondary text-secondary' :
            message.type === 'error' ? 'bg-error/20 border border-error text-error' :
              'bg-primary/20 border border-primary text-primary'}`}>
          {message.text}
        </div>
      )}

      {/* Craft result flash */}
      {craftResult && (
        <div className={`glass-panel rounded-2xl p-5 mb-6 border text-center ${craftResult.success ? 'border-secondary/40 bg-secondary/5' : 'border-error/40 bg-error/5'}`}>
          <div className="text-4xl mb-2">{craftResult.success ? '✅' : '❌'}</div>
          <p className={`font-semibold ${craftResult.success ? 'text-secondary' : 'text-error'}`}>{craftResult.message}</p>
          <button onClick={() => setCraftResult(null)} className="mt-3 text-xs text-on-surface-variant hover:text-on-background">Đóng</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-surface-container rounded-xl p-1">
        <button onClick={() => setTab('craft')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2
            ${tab === 'craft' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-background'}`}>
          <Hammer size={16} /> Chế Tạo
        </button>
        <button onClick={() => setTab('enchant')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2
            ${tab === 'enchant' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-background'}`}>
          <Sparkles size={16} /> Khảm Nạm
        </button>
      </div>

      {/* Craft tab */}
      {tab === 'craft' && (
        <div>
          {/* Category filter */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <button key={k} onClick={() => setSelectedCategory(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${selectedCategory === k ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:border-primary/40'}`}>
                {v}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recipes.map((recipe: any) => (
              <div key={recipe.id}
                className={`glass-panel rounded-2xl p-5 border transition-all duration-300
                  ${recipe.canCraft ? 'border-primary/30 hover:border-primary/60' : recipe.realmUnlocked ? 'border-on-surface-variant/10' : 'border-on-surface-variant/5 opacity-60'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-on-background text-sm">{recipe.name}</h3>
                    {recipe.resultItem && (
                      <span className="text-xs" style={{ color: RARITY_COLORS[recipe.resultItem.rarity] || '#ccc' }}>
                        {recipe.resultItem.rarity} — {recipe.resultItem.name}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs px-2 py-0.5 bg-surface-container rounded-full text-on-surface-variant">
                      {Math.round(recipe.successRate * 100)}% thành công
                    </span>
                    <span className="text-xs text-on-surface-variant">x{recipe.resultQuantity}</span>
                  </div>
                </div>

                {/* Materials needed */}
                <div className="space-y-1 mb-4">
                  {recipe.materials.map((mat: any) => (
                    <div key={mat.itemId} className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant">• {mat.itemData?.name || mat.itemId}</span>
                      <span className={mat.owned >= mat.quantity ? 'text-secondary' : 'text-error'}>
                        {mat.owned} / {mat.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleCraft(recipe.id)}
                  disabled={acting || !recipe.canCraft}
                  className={`w-full py-2 rounded-xl text-sm font-semibold transition-all
                    ${recipe.canCraft
                      ? 'bg-primary text-on-primary hover:bg-primary-fixed-dim'
                      : 'bg-surface-container text-on-surface-variant/40 cursor-not-allowed'}`}
                >
                  {acting ? '⚙️ Đang luyện...' : recipe.canCraft ? '🔨 Chế Tạo' :
                    !recipe.realmUnlocked ? '🔒 Chưa đủ cảnh giới' : '❌ Thiếu nguyên liệu'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enchant tab */}
      {tab === 'enchant' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-primary/20">
            <h3 className="font-semibold text-on-background mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-primary" /> Khảm Đá Quý Vào Pháp Bảo
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">Chọn Pháp Bảo (nhập Item ID)</label>
                <input
                  value={enchantTarget}
                  onChange={e => setEnchantTarget(e.target.value)}
                  placeholder="vd: weapon_moc_kiem"
                  className="w-full bg-surface-container border border-on-surface-variant/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-on-background"
                />
              </div>

              <div>
                <label className="text-xs text-on-surface-variant mb-2 block">Chọn Đá Khảm</label>
                <div className="grid grid-cols-3 gap-3">
                  {(data?.gems || []).map((gem: any) => (
                    <button key={gem.id} onClick={() => setEnchantGem(enchantGem === gem.id ? '' : gem.id)}
                      className={`p-3 rounded-xl border text-left transition-all
                        ${enchantGem === gem.id ? 'border-primary bg-primary/10' : 'border-on-surface-variant/20 hover:border-primary/40'}`}>
                      <div className="font-semibold text-xs text-on-background mb-1">{gem.name}</div>
                      <div className="text-xs text-on-surface-variant">{gem.description}</div>
                      <div className="mt-2 text-xs">
                        {gem.craftMaterials.map((m: any) => (
                          <div key={m.itemId} className="text-primary/80">• {m.quantity}x {m.itemId}</div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleEnchant}
                disabled={acting || !enchantTarget || !enchantGem}
                className="w-full bg-primary text-on-primary py-3 rounded-xl font-semibold hover:bg-primary-fixed-dim transition-all disabled:opacity-50"
              >
                {acting ? '✨ Đang khảm...' : '💎 Khảm Đá'}
              </button>
            </div>
          </div>

          {/* Gem info cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(data?.gems || []).map((gem: any) => (
              <div key={gem.id} className="glass-panel rounded-xl p-4 border border-primary/10">
                <div className="font-bold text-primary mb-1">{gem.name}</div>
                <div className="text-xs text-on-surface-variant mb-2">{gem.description}</div>
                <div className="text-xs text-secondary">
                  Bonus: {JSON.stringify(gem.bonus).replace(/[{}"]/g, '').replace(/:/g, ': ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

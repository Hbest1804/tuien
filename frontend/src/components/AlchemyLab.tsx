import React, { useState, useEffect } from 'react';
import { getRecipes, craftItem } from '../services/alchemyService';

interface Ingredient {
  itemId: string;
  quantity: number;
  itemData: { name: string; rarity?: string };
  have: number;
}

interface Recipe {
  id: string;
  name: string;
  desc: string;
  realmRequired: number;
  successRate: number;
  canCraft: boolean;
  maxCraftable: number;
  realmUnlocked: boolean;
  ingredientsDetails: Ingredient[];
  outputItem: { name: string; rarity?: string; description?: string } | null;
  output: { itemId: string; quantity: number };
}

const RARITY_COLOR: Record<string, string> = {
  'Thường': '#94a3b8',
  'Hiếm': '#3b82f6',
  'Cực Phẩm': '#f59e0b',
};

export const AlchemyLab = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [qty, setQty] = useState(1);
  const [crafting, setCrafting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showAll, setShowAll] = useState(false);

  const load = async () => {
    try {
      const res = await getRecipes();
      setRecipes(res.data.recipes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCraft = async () => {
    if (!selected) return;
    setCrafting(true);
    setResult(null);
    try {
      const res = await craftItem(selected.id, qty);
      setResult(res.data);
      await load(); // Refresh ingredient counts
    } catch (err: any) {
      setResult({ message: err.response?.data?.message || 'Lỗi', successCount: 0 });
    } finally {
      setCrafting(false);
    }
  };

  const visible = showAll ? recipes : recipes.filter(r => r.realmUnlocked);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#a78bfa' }}>
      ⚗️ Đang tải lò luyện đan...
    </div>
  );

  return (
    <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
      {/* Recipe List */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e2e8f0' }}>⚗️ Lò Luyện Đan</h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} />
            Hiển thị công thức chưa mở khóa
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
          {visible.map(r => (
            <div
              key={r.id}
              onClick={() => { setSelected(r); setQty(1); setResult(null); }}
              style={{
                background: selected?.id === r.id
                  ? 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(168,85,247,0.15))'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${selected?.id === r.id ? 'rgba(168,85,247,0.5)' : r.canCraft ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '0.75rem',
                padding: '1rem',
                cursor: 'pointer',
                opacity: r.realmUnlocked ? 1 : 0.5,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.4rem' }}>⚗️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.9rem' }}>{r.name}</div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: r.canCraft ? '#10b981' : '#64748b',
                    fontWeight: 600,
                  }}>
                    {!r.realmUnlocked ? `🔒 Cần ${r.currentRealm}` : r.canCraft ? `✅ Đủ nguyên liệu (${r.maxCraftable}x)` : '⚠️ Thiếu nguyên liệu'}
                  </div>
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: '#f59e0b',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}>
                  {Math.round(r.successRate * 100)}%
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>{r.desc}</div>

              {/* Output */}
              {r.outputItem && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.3rem 0.6rem',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '0.4rem',
                  fontSize: '0.75rem',
                  color: RARITY_COLOR[r.outputItem.rarity || 'Thường'] || '#94a3b8',
                  fontWeight: 600,
                }}>
                  → {r.output.quantity}× {r.outputItem.name}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Craft Panel */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '1rem',
        padding: '1.25rem',
        position: 'sticky',
        top: '1rem',
      }}>
        {!selected ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem 1rem' }}>
            ← Chọn công thức để luyện đan
          </div>
        ) : (
          <>
            <h3 style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: '0.75rem' }}>
              {selected.name}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '1rem', lineHeight: 1.5 }}>
              {selected.desc}
            </p>

            {/* Ingredients */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Nguyên Liệu
              </div>
              {selected.ingredientsDetails.map(ing => {
                const need = ing.quantity * qty;
                const ok = ing.have >= need;
                return (
                  <div key={ing.itemId} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    fontSize: '0.82rem',
                  }}>
                    <span style={{ color: '#e2e8f0' }}>{ing.itemData.name}</span>
                    <span style={{ color: ok ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                      {ing.have}/{need}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Output */}
            <div style={{
              padding: '0.5rem 0.75rem',
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.82rem',
              color: '#f59e0b',
              fontWeight: 600,
            }}>
              Sản phẩm: {qty}× {selected.outputItem?.name || selected.output.itemId}
            </div>

            {/* Success rate */}
            <div style={{ marginBottom: '1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
              Tỷ lệ thành công: <strong style={{ color: '#a78bfa' }}>{Math.round(selected.successRate * 100)}%</strong>
            </div>

            {/* Qty selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={btnSmStyle}>−</button>
              <span style={{ color: '#e2e8f0', fontWeight: 700, minWidth: '2rem', textAlign: 'center' }}>{qty}</span>
              <button onClick={() => setQty(q => Math.min(10, q + 1))} style={btnSmStyle}>+</button>
              <span style={{ color: '#64748b', fontSize: '0.75rem' }}>/ 10 lần</span>
            </div>

            <button
              onClick={handleCraft}
              disabled={crafting || !selected.canCraft}
              style={{
                width: '100%',
                padding: '0.65rem',
                background: selected.canCraft
                  ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                  : 'rgba(255,255,255,0.06)',
                border: 'none',
                borderRadius: '0.5rem',
                color: selected.canCraft ? '#fff' : '#64748b',
                fontWeight: 700,
                cursor: selected.canCraft ? 'pointer' : 'not-allowed',
                fontSize: '0.9rem',
              }}
            >
              {crafting ? '⚗️ Đang luyện...' : '⚗️ Luyện Đan'}
            </button>

            {/* Result */}
            {result && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.75rem',
                background: result.successCount > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${result.successCount > 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'}`,
                borderRadius: '0.5rem',
                fontSize: '0.82rem',
                color: result.successCount > 0 ? '#10b981' : '#ef4444',
              }}>
                {result.message}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const btnSmStyle: React.CSSProperties = {
  width: '2rem', height: '2rem',
  background: 'rgba(255,255,255,0.08)',
  border: 'none', borderRadius: '0.4rem',
  color: '#e2e8f0', cursor: 'pointer',
  fontWeight: 700, fontSize: '1rem',
};

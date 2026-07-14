import { useState, useEffect } from 'react';
import { getDiscipleStatus, acceptDisciple, releaseDisciple, requestPartner, divorcePartner } from '../services/discipleService';
import { Users, Heart, UserPlus, UserMinus } from 'lucide-react';

export function DisciplePanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [tab, setTab] = useState<'disciples' | 'partner'>('disciples');
  const [targetName, setTargetName] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetch = async () => {
    try {
      const res = await getDiscipleStatus();
      setData(res.data);
    } catch { }
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type }); setTimeout(() => setMessage(null), 4000);
  };

  const handleAcceptDisciple = async () => {
    const name = targetName.trim();
    if (!name) return;
    setActing(true);
    try {
      const res = await acceptDisciple(name);
      showMsg(res.data.message, 'success');
      setTargetName('');
      await fetch();
    } catch (e: any) {
      showMsg(e.response?.data?.message || 'Lỗi server', 'error');
    }
    setActing(false);
  };

  const handleRelease = async (userId: string) => {
    setActing(true);
    try {
      const res = await releaseDisciple(userId);
      showMsg(res.data.message, 'success');
      await fetch();
    } catch (e: any) {
      showMsg(e.response?.data?.message || 'Lỗi server', 'error');
    }
    setActing(false);
  };

  const handleRequestPartner = async () => {
    const name = targetName.trim();
    if (!name) return;
    setActing(true);
    try {
      const res = await requestPartner(name);
      showMsg(res.data.message, 'success');
      setTargetName('');
      await fetch();
    } catch (e: any) {
      showMsg(e.response?.data?.message || 'Lỗi server', 'error');
    }
    setActing(false);
  };

  const handleDivorce = async () => {
    setActing(true);
    try {
      const res = await divorcePartner();
      showMsg(res.data.message, 'success');
      await fetch();
    } catch (e: any) {
      showMsg(e.response?.data?.message || 'Lỗi server', 'error');
    }
    setActing(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-secondary/30 border-t-secondary animate-spin" />
    </div>
  );

  const GRADE_COLORS: Record<string, string> = {
    'Hoàng': '#a0a060', 'Huyền': '#60a0c0', 'Địa': '#9060c0', 'Thiên': '#f2ca50',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="font-label-caps text-secondary tracking-[0.2em] mb-2">Nhân Duyên</div>
        <h1 className="font-headline-xl text-[40px] text-secondary">👨‍🎓 Đệ Tử & Đạo Lữ</h1>
        <p className="text-on-surface-variant mt-2">Thu nhận đệ tử hoặc kết đôi Đạo Lữ để cùng song tu tăng tốc.</p>
      </div>

      {/* Toast */}
      {message && (
        <div className={`fixed top-24 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl text-sm font-medium max-w-sm
          ${message.type === 'success' ? 'bg-secondary/20 border border-secondary text-secondary' : 'bg-error/20 border border-error text-error'}`}>
          {message.text}
        </div>
      )}

      {/* Bonus summary */}
      {data && (
        <div className="glass-panel rounded-2xl p-5 mb-6 border border-secondary/20">
          <h3 className="font-semibold text-secondary mb-3">✨ Bonus Hiện Tại</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-secondary">
                {data.bonuses.discipleBonus > 0 ? `+${(data.bonuses.discipleBonus * 100).toFixed(0)}%` : '—'}
              </div>
              <div className="text-xs text-on-surface-variant">Bonus Sư Phụ</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {data.bonuses.masterBonus > 0 ? `+${(data.bonuses.masterBonus * 100).toFixed(0)}%` : '—'}
              </div>
              <div className="text-xs text-on-surface-variant">Bonus Đệ Tử</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-error">
                {data.bonuses.partnerBonus > 0 ? `+${(data.bonuses.partnerBonus * 100).toFixed(0)}%` : '—'}
              </div>
              <div className="text-xs text-on-surface-variant">Bonus Đạo Lữ</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-surface-container rounded-xl p-1">
        <button onClick={() => setTab('disciples')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2
            ${tab === 'disciples' ? 'bg-secondary text-on-primary' : 'text-on-surface-variant hover:text-on-background'}`}>
          <Users size={16} /> Đệ Tử ({data?.disciples?.length || 0}/5)
        </button>
        <button onClick={() => setTab('partner')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2
            ${tab === 'partner' ? 'bg-secondary text-on-primary' : 'text-on-surface-variant hover:text-on-background'}`}>
          <Heart size={16} /> Đạo Lữ
        </button>
      </div>

      {/* Disciples tab */}
      {tab === 'disciples' && (
        <div className="space-y-5">
          {/* Master info */}
          {data?.master && (
            <div className="glass-panel rounded-2xl p-5 border border-primary/20">
              <h3 className="text-sm font-semibold text-primary mb-3">👴 Sư Phụ của bạn</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-primary">
                  {data.master.username[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-on-background">{data.master.username}</div>
                  <div className="text-xs" style={{ color: GRADE_COLORS[data.master.spirit_root_grade] || '#ccc' }}>
                    Linh Căn: {data.master.spirit_root_grade}
                  </div>
                </div>
                <div className="ml-auto text-xs text-secondary font-semibold">+5% EXP/giờ</div>
              </div>
            </div>
          )}

          {/* Accept disciple form */}
          <div className="glass-panel rounded-2xl p-5 border border-secondary/20">
            <h3 className="font-semibold text-on-background mb-3 flex items-center gap-2">
              <UserPlus size={18} className="text-secondary" /> Nhận Đệ Tử
            </h3>
            <div className="flex gap-3">
              <input
                value={targetName}
                onChange={e => setTargetName(e.target.value)}
                placeholder="Tên tu sĩ muốn nhận làm đệ tử..."
                className="flex-1 bg-surface-container border border-on-surface-variant/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary/50 text-on-background"
                onKeyDown={e => e.key === 'Enter' && handleAcceptDisciple()}
              />
              <button onClick={handleAcceptDisciple} disabled={acting || !targetName.trim()}
                className="bg-secondary/20 border border-secondary text-secondary px-5 py-2.5 rounded-xl font-semibold hover:bg-secondary/30 transition-all disabled:opacity-50">
                {acting ? '...' : '✅ Nhận'}
              </button>
            </div>
            <p className="text-xs text-on-surface-variant/60 mt-2">
              Tối đa 5 đệ tử. Bạn phải có cảnh giới cao hơn đệ tử. Đệ tử nhận +5% EXP, bạn nhận 1% EXP của đệ tử.
            </p>
          </div>

          {/* Disciples list */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-secondary/10">
            <div className="p-4 border-b border-secondary/10">
              <h3 className="font-semibold text-secondary">Danh Sách Đệ Tử</h3>
            </div>
            <div className="divide-y divide-secondary/10">
              {(data?.disciples || []).map((d: any) => (
                <div key={d.id} className="flex items-center px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center font-bold text-secondary mr-3">
                    {d.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-on-background">{d.username}</div>
                    <div className="text-xs" style={{ color: GRADE_COLORS[d.spirit_root_grade] || '#ccc' }}>
                      Linh Căn: {d.spirit_root_grade}
                    </div>
                  </div>
                  <button onClick={() => handleRelease(d.id)} disabled={acting}
                    className="text-error/70 hover:text-error text-xs flex items-center gap-1 transition-colors">
                    <UserMinus size={14} /> Trục xuất
                  </button>
                </div>
              ))}
              {(!data?.disciples || data.disciples.length === 0) && (
                <div className="p-8 text-center text-on-surface-variant text-sm">Chưa có đệ tử nào.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Partner tab */}
      {tab === 'partner' && (
        <div className="space-y-5">
          {data?.partner ? (
            <div className="glass-panel rounded-2xl p-6 border border-error/30 text-center">
              <div className="text-4xl mb-3">💑</div>
              <h3 className="text-xl font-bold text-on-background mb-1">{data.partner.username}</h3>
              <div className="text-sm" style={{ color: GRADE_COLORS[data.partner.spirit_root_grade] || '#ccc' }}>
                Linh Căn: {data.partner.spirit_root_grade}
              </div>
              <div className="mt-4 text-secondary font-semibold text-sm">+10% EXP khi cả hai online cùng lúc</div>
              <button onClick={handleDivorce} disabled={acting}
                className="mt-5 bg-error/10 border border-error text-error px-6 py-2 rounded-xl hover:bg-error/20 transition-all disabled:opacity-50 text-sm">
                {acting ? '...' : '💔 Chia Tay Đạo Lữ'}
              </button>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-6 border border-error/20">
              <h3 className="font-semibold text-on-background mb-3 flex items-center gap-2">
                <Heart size={18} className="text-error" /> Kết Đạo Lữ
              </h3>
              <div className="flex gap-3">
                <input
                  value={targetName}
                  onChange={e => setTargetName(e.target.value)}
                  placeholder="Tên tu sĩ muốn kết Đạo Lữ..."
                  className="flex-1 bg-surface-container border border-on-surface-variant/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-error/50 text-on-background"
                  onKeyDown={e => e.key === 'Enter' && handleRequestPartner()}
                />
                <button onClick={handleRequestPartner} disabled={acting || !targetName.trim()}
                  className="bg-error/20 border border-error text-error px-5 py-2.5 rounded-xl font-semibold hover:bg-error/30 transition-all disabled:opacity-50">
                  {acting ? '...' : '💑 Kết'}
                </button>
              </div>
              <p className="text-xs text-on-surface-variant/60 mt-2">
                Chỉ có 1 Đạo Lữ tại một thời điểm. Cả hai nhận +10% EXP khi online đồng thời.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

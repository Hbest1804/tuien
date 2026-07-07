import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCultivationStatus, CultivationData } from '../services/cultivationService';
import { getPavilionItems as getItems, exchangePavilionItem as purchaseSectItem, PavilionItem as Item } from '../services/pavilionService';
import { getSectMissions, startSectMission, completeSectMission, SectMission } from '../services/sectService';
import { SECTS } from '../config/sects';
import { ShieldAlert, Book, User, ArrowLeft, Star, Users, Zap, BookOpen, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sect() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cult, setCult] = useState<CultivationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  
  const [sectItems, setSectItems] = useState<Item[]>([]);
  const [activeTab, setActiveTab] = useState<'main' | 'pavilion' | 'missions'>('main');

  const [missions, setMissions] = useState<SectMission[]>([]);
  const [nowTime, setNowTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchSectData = async () => {
      try {
        setLoading(true);
        // Lấy thông tin tu luyện hiện tại
        const resCult = await getCultivationStatus();
        setCult(resCult.data.cultivation);

        // Lấy danh sách item trong Tàng Kinh Các
        const resItems = await getItems();
        setSectItems(resItems.data.items);

        // Lấy danh sách nhiệm vụ tông môn
        const resMissions = await getSectMissions();
        setMissions(resMissions.data.missions);
        setCult(prev => prev ? { ...prev, sectContribution: resMissions.data.sectContribution, sectRank: resMissions.data.sectRank } : null);
      } catch (err: any) {
        showToast(err.response?.data?.message || 'Lỗi tải dữ liệu tông môn', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (user?.isCharacterCreated) {
      fetchSectData();
    }
  }, [user]);

  const handlePurchase = async (itemId: string) => {
    if (!window.confirm('Xác nhận tiêu hao điểm cống hiến để lĩnh ngộ công pháp này?')) return;
    setActionLoading(true);
    try {
      const res = await purchaseSectItem(itemId);
      showToast(res.data.message || 'Lĩnh ngộ thành công!');
      // Cập nhật lại điểm cống hiến
      const resCult = await getCultivationStatus();
      setCult(resCult.data.cultivation);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi mua', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartMission = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await startSectMission(id);
      setMissions(res.data.missions);
      showToast('Đã nhận nhiệm vụ!');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi nhận nhiệm vụ', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteMission = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await completeSectMission(id);
      setMissions(res.data.missions);
      setCult(prev => prev ? { ...prev, sectContribution: res.data.sectContribution, sectRank: res.data.sectRank } : null);
      showToast(res.data.message);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi trả nhiệm vụ', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center animate-pulse text-primary">Đang tải Tông Môn...</div>;
  }

  if (!cult?.isSectMember || !cult.sectName) {
    return (
      <div className="max-w-container-max mx-auto px-4 py-12 flex flex-col items-center">
        <div className="glass-panel p-10 text-center rounded-3xl max-w-lg border border-primary/20 shadow-[0_0_40px_rgba(242,202,80,0.1)]">
          <ShieldAlert size={48} className="text-on-surface-variant mx-auto mb-6 opacity-50" />
          <h2 className="font-headline-lg text-[28px] text-on-background mb-4">Tán Tu Vô Môn</h2>
          <p className="text-on-surface-variant font-body-md mb-8">Ngươi hiện tại không thuộc về bất kỳ thế lực nào. Mau đến trang Tu Luyện để bái nhập tông môn.</p>
          <button
            onClick={() => navigate('/cultivation')}
            className="bg-primary text-on-primary px-8 py-3 rounded-xl font-headline-md hover:bg-primary-fixed-dim transition-all"
          >
            Về trang Tu Luyện
          </button>
        </div>
      </div>
    );
  }

  const mySectConfig = SECTS.find(s => s.id === cult.sectName) || {
    id: cult.sectName, name: cult.sectName, master: 'Thần Bí Tông Chủ', elders: ['Ẩn Danh Trưởng Lão'], ultimateTechnique: null, description: 'Tông môn ẩn thế.', color: '#f2ca50', masterAvatar: ''
  };

  // Lọc ra ultimate technique của tông môn hiện tại
  const myUltimateItems = sectItems.filter(item => item.itemId === mySectConfig.ultimateTechnique);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-2xl backdrop-blur-sm border transition-all ${toast.type === 'error' ? 'bg-error-container/90 border-error/30 text-error' : 'bg-surface-container/90 border-primary/30 text-primary'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/cultivation')} className="w-10 h-10 flex items-center justify-center rounded-xl glass-panel-hover text-on-surface-variant hover:text-primary transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="font-label-caps tracking-[0.2em]" style={{ color: mySectConfig.color }}>Tông Môn Lãnh Địa</div>
          <h1 className="font-headline-xl text-4xl text-on-background mt-1" style={{ textShadow: `0 0 20px ${mySectConfig.color}40` }}>{mySectConfig.name}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('main')}
          className={`px-6 py-3 rounded-xl font-label-caps text-sm transition-all ${activeTab === 'main' ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-surface-container border border-transparent text-on-surface-variant hover:text-primary'}`}
        >
          Đại Điện
        </button>
        <button
          onClick={() => setActiveTab('missions')}
          className={`px-6 py-3 rounded-xl font-label-caps text-sm transition-all ${activeTab === 'missions' ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-surface-container border border-transparent text-on-surface-variant hover:text-primary'}`}
        >
          Nhiệm Vụ
        </button>
        <button
          onClick={() => setActiveTab('pavilion')}
          className={`px-6 py-3 rounded-xl font-label-caps text-sm transition-all ${activeTab === 'pavilion' ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-surface-container border border-transparent text-on-surface-variant hover:text-primary'}`}
        >
          Trấn Tông Bí Cảnh
        </button>
      </div>

      {activeTab === 'main' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cột NPC (Tông chủ & Trưởng lão) */}
          <div className="md:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent z-0 pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="w-32 h-32 rounded-full border-4 border-primary/30 overflow-hidden shadow-[0_0_30px_rgba(242,202,80,0.2)] group-hover:border-primary/60 transition-all">
                  {mySectConfig.masterAvatar ? (
                    <img src={mySectConfig.masterAvatar} alt="Tông Chủ" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
                      <User size={40} className="text-primary/50" />
                    </div>
                  )}
                </div>
                <div className="text-center md:text-left flex-1">
                  <div className="font-label-caps text-primary mb-1">Tông Chủ</div>
                  <h3 className="font-headline-lg text-2xl mb-2">{mySectConfig.master}</h3>
                  <div className="bg-surface-container-low border border-primary/10 rounded-xl p-4 italic text-on-surface-variant/80 font-body-md text-sm relative">
                    "Tu tiên nãi là nghịch thiên nhi hành. Đệ tử {cult.sectRank} {user?.username}, hãy cố gắng tu luyện, đừng làm nhục uy danh {mySectConfig.name} ta!"
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mySectConfig.elders.map((elder, idx) => (
                <div key={idx} className="glass-panel p-4 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-container-highest border border-on-surface-variant/20 flex items-center justify-center">
                    <Users size={20} className="text-on-surface-variant/50" />
                  </div>
                  <div>
                    <div className="font-headline-md text-on-background text-md">{elder}</div>
                    <div className="font-label-caps text-on-surface-variant/50 text-[10px]">Trưởng Lão</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cột Status Cá nhân */}
          <div className="glass-panel p-6 rounded-3xl h-fit border-t-4 border-t-primary/50">
            <h3 className="font-headline-md text-lg text-on-background mb-6 flex items-center gap-2">
              <Star className="text-primary" size={18} /> Lệnh Bài Tông Môn
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <span className="font-body-md text-sm text-on-surface-variant">Thân Phận</span>
                <span className="font-label-caps text-primary px-3 py-1 bg-primary/10 rounded-full">{cult.sectRank}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <span className="font-body-md text-sm text-on-surface-variant">Cống Hiến</span>
                <span className="font-headline-md text-secondary">{cult.sectContribution.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <span className="font-body-md text-sm text-on-surface-variant">Tốc Độ Tông Môn</span>
                <span className="font-headline-md text-on-background">+250%</span>
              </div>
            </div>

            <div className="mt-6">
              <button onClick={() => navigate('/pavilion')} className="w-full py-3 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 transition-colors font-label-caps flex items-center justify-center gap-2">
                <BookOpen size={16} /> Vào Tàng Kinh Các
              </button>
              <div className="text-center text-[10px] text-on-surface-variant/50 mt-2">Dùng điểm cống hiến để đổi vật phẩm</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pavilion' && (
        <div className="space-y-6">
          <div className="text-center py-8">
            <h2 className="font-headline-lg text-2xl gradient-text-gold mb-3">Công Pháp Trấn Tông</h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">Chỉ những đệ tử kiệt xuất nhất, cống hiến vô lượng cho tông môn mới có tư cách chạm tay vào những tuyệt học này.</p>
          </div>

          {myUltimateItems.length === 0 ? (
            <div className="text-center text-on-surface-variant/50 py-10 border border-dashed border-white/10 rounded-3xl">
              Tông môn này hiện không có công pháp trấn tông nào truyền lại.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myUltimateItems.map(item => (
                <div key={item.id} className="relative glass-panel rounded-3xl p-8 overflow-hidden group border-2 border-primary/20 hover:border-primary/50 transition-all">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="font-label-caps text-primary tracking-widest mb-1 text-xs">{item.rarity} CẤP</div>
                        <h3 className="font-headline-lg text-2xl text-on-background">{item.name}</h3>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center gold-glow">
                        <Zap size={24} className="text-primary" />
                      </div>
                    </div>
                    
                    <p className="font-body-md text-on-surface-variant mb-6 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-2 mb-6 bg-surface-container-low px-4 py-3 rounded-xl border border-white/5">
                      <Star size={16} className="text-secondary" />
                      <span className="font-body-md text-sm text-on-surface-variant">Hiệu quả:</span>
                      <span className="font-headline-md text-secondary ml-auto">{item.effectDesc}</span>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                      <div className="flex flex-col">
                        <span className="font-label-caps text-[10px] text-on-surface-variant/70 mb-1">Giá Truyền Thụ</span>
                        <span className="font-headline-md text-primary">{item.price?.toLocaleString()} Cống Hiến</span>
                      </div>
                      
                      <button
                        onClick={() => handlePurchase(item.itemId)}
                        disabled={actionLoading || cult.sectContribution < (item.price || 0)}
                        className="px-6 py-3 rounded-xl bg-primary text-on-primary font-headline-md text-sm disabled:opacity-40 hover:bg-primary-fixed-dim transition-colors shadow-[0_0_20px_rgba(242,202,80,0.3)]"
                      >
                        Lĩnh Ngộ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'missions' && (
        <div className="space-y-6">
          <div className="text-center py-8">
            <h2 className="font-headline-lg text-2xl gradient-text-gold mb-3">Nhiệm Vụ Tông Môn</h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">Hoàn thành nhiệm vụ để tích lũy điểm cống hiến. Bạn có thể làm nhiều nhiệm vụ cùng lúc.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {missions.map(m => {
              const isPending = m.status === 'pending';
              const isActive = m.status === 'active';
              const isCompleted = m.status === 'completed';
              
              let timeLeft = 0;
              if (isActive && m.startedAt) {
                const passed = Math.floor((nowTime - new Date(m.startedAt).getTime()) / 1000);
                timeLeft = Math.max(0, m.durationSeconds - passed);
              }

              const levelColor = 
                m.level === 'Thiên' ? 'text-[#ff9d00] border-[#ff9d00]' :
                m.level === 'Địa' ? 'text-[#c678dd] border-[#c678dd]' :
                m.level === 'Huyền' ? 'text-[#61afef] border-[#61afef]' :
                'text-white border-white';

              return (
                <div key={m.id} className={`glass-panel p-6 rounded-3xl border-l-4 ${levelColor} ${isActive ? 'bg-primary/5' : ''} ${isCompleted ? 'opacity-50 grayscale' : ''}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className={`font-label-caps text-[10px] tracking-wider mb-1 opacity-80`}>Cấp {m.level}</div>
                      <h3 className="font-headline-md text-xl text-on-background">{m.title}</h3>
                    </div>
                    <div className="text-right">
                      <div className="font-headline-md text-primary">{m.reward}</div>
                      <div className="font-label-caps text-[10px] text-on-surface-variant/70">Cống hiến</div>
                    </div>
                  </div>
                  <p className="font-body-md text-sm text-on-surface-variant mb-6">{m.description}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                      <Clock size={16} />
                      <span>{Math.floor(m.durationSeconds / 60)} phút</span>
                    </div>

                    {isPending && (
                      <button
                        onClick={() => handleStartMission(m.id)}
                        disabled={actionLoading}
                        className="px-6 py-2 rounded-xl bg-surface-container-high border border-primary/30 text-primary hover:bg-primary hover:text-on-primary transition-all disabled:opacity-30"
                      >
                        Nhận
                      </button>
                    )}
                    {isActive && timeLeft > 0 && (
                      <div className="px-6 py-2 rounded-xl bg-surface-container-low border border-on-surface-variant/20 text-on-surface-variant font-mono text-sm flex items-center gap-2">
                        Đang làm... {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                    {isActive && timeLeft === 0 && (
                      <button
                        onClick={() => handleCompleteMission(m.id)}
                        disabled={actionLoading}
                        className="px-6 py-2 rounded-xl bg-primary text-on-primary shadow-[0_0_15px_rgba(242,202,80,0.3)] hover:scale-105 transition-all flex items-center gap-2"
                      >
                        <CheckCircle size={16} /> Trả Nhiệm Vụ
                      </button>
                    )}
                    {isCompleted && (
                      <div className="px-6 py-2 font-label-caps text-xs text-on-surface-variant/50 flex items-center gap-2">
                        <CheckCircle size={16} /> Đã xong
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

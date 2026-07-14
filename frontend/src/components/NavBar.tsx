import { LogOut, Gavel, Bell, User, LogIn, Flame, Shield, ShieldCheck, ChevronDown } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEconomy } from '../context/EconomyContext';
import { useEffect, useState, useRef, ReactNode } from 'react';
import ChangePasswordModal from './ChangePasswordModal';

const navItems = [
  { key: 'home',        label: 'Tông Đỉnh',   path: '/' },
  { key: 'map',         label: 'Bản Đồ',      path: '/map' },
  { key: 'roots',       label: 'Linh Căn',    path: '/roots' },
  { key: 'cultivation', label: 'Tu Luyện',    path: '/cultivation' },
  { key: 'inventory',   label: 'Túi Đồ',      path: '/inventory' },
  { key: 'shop',        label: 'Thương Hội',  path: '/shop' },
  { key: 'auction',     label: 'Đấu Giá',     path: '/auction' },
  { key: 'leaderboard', label: 'Xếp Hạng',   path: '/leaderboard' },
  { key: 'alchemy',     label: 'Luyện Đan',   path: '/alchemy' },
  { key: 'combat',      label: 'Chiến Đấu',   path: '/combat' },
  { key: 'quests',      label: 'Nhiệm Vụ',    path: '/quests' },
  { key: 'achievements',label: 'Thành Tựu',   path: '/achievements' },
];

// Giai đoạn 2 — hiển thị trong dropdown "Giai Đoạn 2"
const phase2Items = [
  { key: 'dungeon',    label: '🏛 Bí Cảnh',    path: '/dungeon-explore' },
  { key: 'pvp',        label: '⚔️ Lôi Đài',    path: '/pvp' },
  { key: 'sect-war',   label: '🌋 Tông Chiến', path: '/sect-war' },
  { key: 'blacksmith', label: '🔨 Luyện Khí',  path: '/blacksmith' },
  { key: 'disciples',  label: '👨‍🎓 Đệ Tử',     path: '/disciples' },
  { key: 'jade-shop',  label: '💎 Tiên Ngọc',  path: '/jade-shop' },
];

export default function NavBar({ notificationBell }: { notificationBell?: ReactNode }) {
  const { user, logout } = useAuth();
  const { spiritStones, fetchBalance } = useEconomy();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPhase2, setShowPhase2] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const phase2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.isCharacterCreated) fetchBalance();
  }, [user, fetchBalance]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false);
      if (phase2Ref.current && !phase2Ref.current.contains(e.target as Node)) setShowPhase2(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isPhase2Active = phase2Items.some(i => location.pathname === i.path);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 glass-panel border-b border-primary/15">
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-3 max-w-container-max mx-auto">

          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="relative w-10 h-10 md:w-11 md:h-11">
              <div className="absolute inset-0 rounded-xl bg-primary/20 animate-pulse-slow" />
              <div className="relative w-full h-full rounded-xl border border-primary/40 bg-surface-container-lowest flex items-center justify-center gold-glow group-hover:gold-glow-strong transition-all duration-300">
                <Flame size={20} className="text-primary group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <span className="font-headline-md text-[18px] font-bold gradient-text-gold tracking-widest uppercase hidden md:block">
              Linh Thư
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1 flex-wrap">
            {navItems.map(({ key, label, path }) => {
              const isActive = location.pathname === path;
              return (
                <Link key={key} to={path}
                  className={`relative px-3 py-1.5 rounded-lg font-body-md font-medium transition-all duration-300 text-[13px] ${
                    isActive
                      ? 'text-primary bg-primary/10 nav-active-pill'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container/60'
                  }`}>
                  {label}
                </Link>
              );
            })}

            {/* Phase 2 dropdown */}
            <div className="relative" ref={phase2Ref}>
              <button
                onClick={() => setShowPhase2(!showPhase2)}
                className={`relative px-3 py-1.5 rounded-lg font-body-md font-medium transition-all duration-300 text-[13px] flex items-center gap-1
                  ${isPhase2Active ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container/60'}`}>
                ⚡ Giai Đoạn 2
                <ChevronDown size={12} className={`transition-transform duration-200 ${showPhase2 ? 'rotate-180' : ''}`} />
              </button>
              {showPhase2 && (
                <div className="absolute top-full left-0 mt-2 w-48 rounded-xl glass-panel border border-primary/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)] py-2 z-50">
                  {phase2Items.map(({ key, label, path }) => (
                    <Link key={key} to={path}
                      onClick={() => setShowPhase2(false)}
                      className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors
                        ${location.pathname === path ? 'text-primary bg-primary/10' : 'text-on-surface hover:bg-primary/10 hover:text-primary'}`}>
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {user?.isCharacterCreated && spiritStones !== null && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/8 border border-primary/20 cursor-pointer hover:bg-primary/15 transition-all duration-200"
                onClick={() => navigate('/shop')}>
                <span className="text-xs">💎</span>
                <span className="font-label-caps text-primary text-[11px]">{spiritStones.toLocaleString()}</span>
              </div>
            )}

            {/* Jade coins */}
            {user?.isCharacterCreated && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer hover:opacity-80 transition-all duration-200"
                style={{ borderColor: 'rgba(176,102,255,0.3)', background: 'rgba(176,102,255,0.08)' }}
                onClick={() => navigate('/jade-shop')}>
                <span className="text-xs">💎</span>
                <span className="font-label-caps text-[11px]" style={{ color: '#b066ff' }}>Tiên Ngọc</span>
              </div>
            )}

            {notificationBell || (
              <button className="text-on-surface-variant hover:text-primary transition-all duration-300 flex items-center justify-center w-9 h-9 rounded-lg hover:bg-surface-container/60 relative" title="Thông báo">
                <Bell size={18} />
              </button>
            )}

            {user ? (
              <>
                <div className="relative hidden md:block" ref={menuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-primary/20 hover:border-primary/40 transition-all duration-200 group">
                    <User size={14} className="text-primary" />
                    <span className="font-label-caps text-primary text-[11px] tracking-wider">{user.username}</span>
                    <ChevronDown size={12} className={`text-primary/60 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl glass-panel border border-primary/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)] py-2 animate-slide-in z-50">
                      <div className="px-4 py-2 border-b border-surface-container mb-2">
                        <div className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Chức vị</div>
                        <div className="font-medium text-primary text-sm flex items-center gap-1.5">
                          <ShieldCheck size={14} />
                          {user.role === 'admin' ? 'Thiên Đạo (Admin)' : 'Tu Sĩ'}
                        </div>
                      </div>
                      {user.role === 'admin' && (
                        <Link to="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-on-surface hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={() => setShowUserMenu(false)}>
                          <Gavel size={16} /> Bảng Quản Trị
                        </Link>
                      )}
                      <button
                        onClick={() => { setShowUserMenu(false); setShowChangePw(true); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-on-surface hover:bg-primary/10 hover:text-primary transition-colors text-left">
                        <Shield size={16} /> Đổi mật khẩu
                      </button>
                      <button
                        onClick={() => { setShowUserMenu(false); logout(); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error/10 hover:text-error transition-colors text-left">
                        <LogOut size={16} /> Xuất Quan
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link to="/login"
                className="hidden md:flex energy-pulse ornate-corners bg-primary/10 border border-primary/60 text-primary px-5 py-2 rounded-lg font-label-caps uppercase tracking-widest hover:bg-primary/20 hover:border-primary transition-all duration-300 text-[11px] items-center gap-1.5">
                <LogIn size={13} /> Đăng Nhập
              </Link>
            )}
          </div>
        </div>
      </nav>

      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
    </>
  );
}

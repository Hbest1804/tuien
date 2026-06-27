import { Bell, User, Flame, LogOut, LogIn } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems: { key: string; label: string; path: string }[] = [
  { key: 'home',        label: 'Tông Đỉnh',     path: '/' },
  { key: 'map',         label: 'Bản Đồ',        path: '/map' },
  { key: 'roots',       label: 'Linh Căn',      path: '/roots' },
  { key: 'cultivation', label: 'Tu Luyện',      path: '/cultivation' },
  { key: 'inventory',   label: 'Túi Đồ',        path: '/inventory' },
  { key: 'pavilion',    label: 'Tàng Kinh Các', path: '/pavilion' },
];

export default function NavBar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 w-full z-50 glass-panel border-b border-primary/15">
      {/* Top golden line */}
      <div className="h-[1px] w-full liquid-flow opacity-70" />

      <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-3 max-w-container-max mx-auto">

        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate('/')}
        >
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
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(({ key, label, path }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={key}
                to={path}
                className={`relative px-4 py-2 rounded-lg font-body-md font-medium transition-all duration-300 ${
                  isActive
                    ? 'text-primary bg-primary/10 nav-active-pill'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container/60'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            className="text-on-surface-variant hover:text-primary transition-all duration-300 flex items-center justify-center w-9 h-9 rounded-lg hover:bg-surface-container/60 relative"
            title="Thông báo"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          </button>

          {user ? (
            <>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-primary/20">
                <User size={14} className="text-primary" />
                <span className="font-label-caps text-primary text-[11px] tracking-wider">{user.username}</span>
              </div>
              <button
                onClick={logout}
                title="Đăng xuất"
                className="flex items-center justify-center w-9 h-9 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-all duration-300"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="hidden md:flex energy-pulse ornate-corners bg-primary/10 border border-primary/60 text-primary px-5 py-2 rounded-lg font-label-caps uppercase tracking-widest hover:bg-primary/20 hover:border-primary transition-all duration-300 text-[11px] items-center gap-1.5"
            >
              <LogIn size={13} /> Đăng Nhập
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

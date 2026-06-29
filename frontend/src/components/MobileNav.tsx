import { Mountain, Map, UserRound, Store, Flame, ShoppingBag, Gavel } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function MobileNav() {
  const location = useLocation();
  const path = location.pathname;

  const navItems = [
    { to: '/',           icon: <Mountain size={20} />, label: 'Tông' },
    { to: '/map',        icon: <Map size={20} />,      label: 'Bản Đồ' },
    { to: '/cultivation',icon: <Flame size={20} />,   label: 'Tu Luyện' },
    { to: '/shop',       icon: <ShoppingBag size={20} />, label: 'Shop' },
    { to: '/auction',    icon: <Gavel size={20} />,   label: 'Đấu Giá' },
    { to: '/pavilion',   icon: <Store size={20} />,   label: 'Tàng Các' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 w-full z-50 bg-background/90 backdrop-blur-lg border-t border-primary/20 pb-safe">
      <div className="flex justify-around items-center py-2">
        {navItems.map(({ to, icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center transition-colors relative px-1 ${path === to ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
          >
            <div className="mb-1">{icon}</div>
            <span className={`font-label-caps text-[9px] tracking-wider ${path === to ? 'font-bold' : ''}`}>{label}</span>
            {path === to && <div className="absolute -bottom-2 w-8 h-1 bg-primary rounded-t-sm" />}
          </Link>
        ))}
      </div>
    </nav>
  );
}

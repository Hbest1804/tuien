import { Map, Store, Gavel, Trophy, Sparkles, Package, Swords, BookOpen, Mountain } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function MobileNav() {
  const location = useLocation();
  const path = location.pathname;

  const navItems = [
    { label: 'Tông', to: '/', icon: <Mountain size={20} /> },
    { label: 'Bản Đồ', to: '/map', icon: <Map size={20} /> },
    { label: 'Tu Luyện', to: '/cultivation', icon: <Sparkles size={20} /> },
    { label: 'Túi Đồ', to: '/inventory', icon: <Package size={20} /> },
    { label: 'Tông Môn', to: '/sect', icon: <Swords size={20} /> },
    { label: 'Chiến Đấu', to: '/combat', icon: <Swords size={20} /> },
    { label: 'Thương Hội', to: '/shop', icon: <Store size={20} /> },
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

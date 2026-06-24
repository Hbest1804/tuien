import { Mountain, Map, UserRound, Store, Flame } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function MobileNav() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav className="md:hidden fixed bottom-0 w-full z-50 bg-background/90 backdrop-blur-lg border-t border-primary/20 pb-safe">
      <div className="flex justify-around items-center py-3">
        <Link 
          to="/"
          className={`flex flex-col items-center transition-colors relative ${path === '/' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <Mountain size={20} className="mb-1" />
          <span className={`font-label-caps text-[10px] tracking-wider ${path === '/' ? 'font-bold' : ''}`}>Tông</span>
          {path === '/' && <div className="absolute -bottom-1 w-8 h-1 bg-primary rounded-t-sm"></div>}
        </Link>

        <Link 
          to="/map"
          className={`flex flex-col items-center transition-colors relative ${path === '/map' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <Map size={20} className="mb-1" />
          <span className={`font-label-caps text-[10px] tracking-wider ${path === '/map' ? 'font-bold' : ''}`}>Bản Đồ</span>
          {path === '/map' && <div className="absolute -bottom-1 w-8 h-1 bg-primary rounded-t-sm"></div>}
        </Link>

        <Link 
          to="/cultivation"
          className={`flex flex-col items-center transition-colors relative ${path === '/cultivation' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <Flame size={20} className="mb-1" />
          <span className={`font-label-caps text-[10px] tracking-wider ${path === '/cultivation' ? 'font-bold' : ''}`}>Tu Luyện</span>
          {path === '/cultivation' && <div className="absolute -bottom-1 w-8 h-1 bg-primary rounded-t-sm"></div>}
        </Link>

        <Link 
          to="/roots"
          className={`flex flex-col items-center transition-colors relative ${path === '/roots' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <UserRound size={20} className="mb-1" />
          <span className={`font-label-caps text-[10px] tracking-wider ${path === '/roots' ? 'font-bold' : ''}`}>Linh Căn</span>
          {path === '/roots' && <div className="absolute -bottom-1 w-8 h-1 bg-primary rounded-t-sm"></div>}
        </Link>

        <Link 
          to="/pavilion"
          className={`flex flex-col items-center transition-colors relative ${path === '/pavilion' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <Store size={20} className="mb-1" />
          <span className={`font-label-caps text-[10px] tracking-wider ${path === '/pavilion' ? 'font-bold' : ''}`}>Tàng Các</span>
          {path === '/pavilion' && <div className="absolute -bottom-1 w-8 h-1 bg-primary rounded-t-sm"></div>}
        </Link>
      </div>
    </nav>
  );
}

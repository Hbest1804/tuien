import { Mountain, Map, UserRound, Store } from 'lucide-react';
import { TabType } from '../types';

interface MobileNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function MobileNav({ activeTab, setActiveTab }: MobileNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 w-full z-50 bg-background/90 backdrop-blur-lg border-t border-primary/20 pb-safe">
      <div className="flex justify-around items-center py-3">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center transition-colors relative ${activeTab === 'home' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <Mountain size={20} className="mb-1" />
          <span className={`font-label-caps text-[10px] tracking-wider ${activeTab === 'home' ? 'font-bold' : ''}`}>Tông</span>
          {activeTab === 'home' && <div className="absolute -bottom-1 w-8 h-1 bg-primary rounded-t-sm"></div>}
        </button>

        <button 
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center transition-colors relative ${activeTab === 'map' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <Map size={20} className="mb-1" />
          <span className={`font-label-caps text-[10px] tracking-wider ${activeTab === 'map' ? 'font-bold' : ''}`}>Bản Đồ</span>
          {activeTab === 'map' && <div className="absolute -bottom-1 w-8 h-1 bg-primary rounded-t-sm"></div>}
        </button>

        <button 
          onClick={() => setActiveTab('roots')}
          className={`flex flex-col items-center transition-colors relative ${activeTab === 'roots' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <UserRound size={20} className="mb-1" />
          <span className={`font-label-caps text-[10px] tracking-wider ${activeTab === 'roots' ? 'font-bold' : ''}`}>Linh Căn</span>
          {activeTab === 'roots' && <div className="absolute -bottom-1 w-8 h-1 bg-primary rounded-t-sm"></div>}
        </button>

        <button 
          onClick={() => setActiveTab('pavilion')}
          className={`flex flex-col items-center transition-colors relative ${activeTab === 'pavilion' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <Store size={20} className="mb-1" />
          <span className={`font-label-caps text-[10px] tracking-wider ${activeTab === 'pavilion' ? 'font-bold' : ''}`}>Tàng Các</span>
          {activeTab === 'pavilion' && <div className="absolute -bottom-1 w-8 h-1 bg-primary rounded-t-sm"></div>}
        </button>
      </div>
    </nav>
  );
}

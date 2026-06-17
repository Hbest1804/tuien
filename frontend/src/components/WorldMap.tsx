import { AlertTriangle, Diamond, Landmark, Plus, Minus, Compass, MapPin } from 'lucide-react';
import { useState } from 'react';

const locations = [
  {
    id: 'sect',
    name: 'Thiên Kiếm Tông',
    desc: 'Tông môn hàng đầu thiên hạ, linh khí dồi dào.',
    top: '30%', left: '40%',
    type: 'sect',
    color: 'primary',
    icon: <Landmark size={22} />,
    danger: 0,
  },
  {
    id: 'forbidden',
    name: 'Huyết Trì Cấm Địa',
    desc: 'Vùng đất nguy hiểm, chứa đựng oán khí ngàn năm.',
    top: '60%', left: '70%',
    type: 'forbidden',
    color: 'error',
    icon: <AlertTriangle size={18} />,
    danger: 95,
  },
  {
    id: 'vein1',
    name: 'Ngọc Tủy Khoáng Mạch',
    desc: 'Mạch linh thạch quý hiếm, tranh giành quyết liệt.',
    top: '20%', left: '75%',
    type: 'vein',
    color: 'secondary',
    icon: <Diamond size={14} />,
    danger: 30,
  },
  {
    id: 'vein2',
    name: 'Linh Tuyền Trì',
    desc: 'Suối linh khí thiên nhiên, thích hợp đột phá cảnh giới.',
    top: '70%', left: '25%',
    type: 'vein',
    color: 'secondary',
    icon: <Diamond size={14} />,
    danger: 10,
  },
];

export default function WorldMap() {
  const [selected, setSelected] = useState(locations[0]);

  return (
    <div className="flex-grow relative mx-margin-mobile md:mx-margin-desktop mt-6 mb-8 rounded-2xl border border-primary/15 shadow-2xl overflow-hidden z-10 min-h-[75vh]">

      {/* ── Map Background (SVG-based fantasy grid) ── */}
      <div className="absolute inset-0 bg-[#07090f] z-0">
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#f2ca50" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Terrain blobs */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute w-[40%] h-[50%] top-[10%] left-[15%] rounded-full bg-[#0d1a0f] blur-3xl" />
          <div className="absolute w-[30%] h-[40%] top-[40%] right-[10%] rounded-full bg-[#1a100d] blur-3xl" />
          <div className="absolute w-[25%] h-[35%] top-[5%] right-[25%] rounded-full bg-[#0a1520] blur-2xl" />
        </div>

        {/* Radial glow center */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_40%_35%,rgba(126,217,158,0.06)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_60%,rgba(242,202,80,0.04)_0%,transparent_50%)]" />
      </div>

      {/* ── Map Markers ── */}
      <div className="absolute inset-0 z-10">
        {locations.map(loc => {
          const colorMap: Record<string, string> = {
            primary: '#f2ca50', error: '#ffb4ab', secondary: '#7ed99e',
          };
          const c = colorMap[loc.color];
          const size = loc.type === 'sect' ? 'w-12 h-12' : loc.type === 'forbidden' ? 'w-10 h-10' : 'w-8 h-8';
          const isSelected = selected.id === loc.id;

          return (
            <div
              key={loc.id}
              className="absolute flex flex-col items-center map-marker group cursor-pointer"
              style={{ top: loc.top, left: loc.left, transform: 'translate(-50%, -50%)' }}
              onClick={() => setSelected(loc)}
            >
              <div
                className="rounded-full border-2 flex items-center justify-center relative transition-all duration-300"
                style={{
                  width: loc.type === 'sect' ? 48 : loc.type === 'forbidden' ? 40 : 32,
                  height: loc.type === 'sect' ? 48 : loc.type === 'forbidden' ? 40 : 32,
                  borderColor: c,
                  background: `rgba(${loc.color === 'primary' ? '15,12,3' : loc.color === 'error' ? '15,3,3' : '3,15,8'}, 0.85)`,
                  boxShadow: isSelected ? `0 0 20px ${c}80, 0 0 40px ${c}30` : `0 0 8px ${c}40`,
                }}
              >
                {/* Ping ring */}
                {(isSelected || loc.type === 'sect') && (
                  <div
                    className="animate-ping-slow absolute inset-0 rounded-full border"
                    style={{ borderColor: `${c}60` }}
                  />
                )}
                <span style={{ color: c }}>{loc.icon}</span>
              </div>

              {/* Label (always visible for selected, hover for others) */}
              <span
                className="mt-1.5 font-label-caps text-[9px] px-2 py-0.5 rounded border transition-all duration-300 whitespace-nowrap"
                style={{
                  color: c,
                  background: 'rgba(7,9,15,0.85)',
                  borderColor: `${c}30`,
                  opacity: isSelected ? 1 : 0,
                }}
              >
                {loc.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Info Panel (top-left) ── */}
      <div className="absolute top-5 left-5 glass-panel p-5 rounded-xl z-20 w-72 transition-all duration-500">
        <div className="flex items-center gap-2 mb-1">
          <MapPin size={14} className="text-primary" />
          <h2 className="font-headline-md text-primary text-[20px]">{selected.name}</h2>
        </div>
        <p className="text-xs text-on-surface-variant mb-4">{selected.desc}</p>

        <div className="flex items-center gap-2 mb-1.5">
          <Diamond className="text-secondary" size={13} />
          <span className="font-label-caps text-secondary text-[10px]">Linh Khí Mật Độ: 85%</span>
        </div>
        <div className="w-full bg-surface-container-highest rounded-full h-1.5 mb-4 overflow-hidden">
          <div className="bg-secondary h-full rounded-full pulse-animation" style={{ width: '85%', boxShadow: '0 0 8px rgba(126,217,158,0.6)' }} />
        </div>

        {selected.danger > 0 && (
          <>
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="text-error" size={13} />
              <span className="font-label-caps text-error text-[10px]">Nguy Hiểm: {selected.danger}%</span>
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-1.5 mb-4 overflow-hidden">
              <div className="bg-error h-full rounded-full" style={{ width: `${selected.danger}%`, boxShadow: '0 0 8px rgba(255,180,171,0.5)' }} />
            </div>
          </>
        )}

        <div className="flex gap-2 flex-wrap">
          <span className="px-2 py-0.5 bg-primary/15 text-primary border border-primary/25 rounded-full text-[10px] font-label-caps">
            {selected.danger === 0 ? 'An Toàn' : selected.danger < 50 ? 'Thận Trọng' : 'Cực Kỳ Nguy Hiểm'}
          </span>
          <span className="px-2 py-0.5 bg-surface-variant text-on-surface-variant rounded-full text-[10px] font-label-caps">Thu Thập</span>
        </div>
      </div>

      {/* ── Legend (bottom-left) ── */}
      <div className="absolute bottom-5 left-5 glass-panel p-3 rounded-xl z-20">
        <div className="font-label-caps text-on-surface-variant text-[9px] mb-2">Chú Giải</div>
        {[
          { color: '#f2ca50', label: 'Tông Môn' },
          { color: '#ffb4ab', label: 'Cấm Địa' },
          { color: '#7ed99e', label: 'Linh Mạch' },
        ].map((l, i) => (
          <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
            <div className="w-2 h-2 rounded-full" style={{ background: l.color, boxShadow: `0 0 4px ${l.color}` }} />
            <span className="font-label-caps text-on-surface-variant text-[9px]">{l.label}</span>
          </div>
        ))}
      </div>

      {/* ── Controls (bottom-right) ── */}
      <div className="absolute bottom-5 right-5 glass-panel p-1.5 rounded-xl z-20 flex flex-col gap-1">
        {[Plus, Minus, Compass].map((Icon, i) => (
          <button
            key={i}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200 text-on-surface-variant"
          >
            <Icon size={16} />
          </button>
        ))}
      </div>

      {/* Edge vignette */}
      <div className="absolute inset-0 z-[5] pointer-events-none rounded-2xl"
        style={{ boxShadow: 'inset 0 0 80px rgba(7,9,15,0.8)' }} />
    </div>
  );
}

import { Sword, BookOpen, Leaf, Gem, Sparkles, ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import { Item } from '../types';
import { useState } from 'react';

const items: Item[] = [
  {
    id: '1',
    name: 'Tru Tiên Kiếm',
    description: 'Thần binh từ thời thượng cổ, chém đứt nhân quả, đoạn tuyệt luân hồi.',
    price: 50000,
    quality: 'heaven',
    type: 'artifact',
    icon: 'sword',
  },
  {
    id: '2',
    name: 'Thái Cực Đồ Lục',
    description: 'Bí kíp ghi chép sự vận hành của âm dương, hiểu được thấu triệt sinh tử.',
    price: 15000,
    quality: 'mystic',
    type: 'book',
    icon: 'book',
  },
  {
    id: '3',
    name: 'Cửu Chuyển Hoàn Hồn Thảo',
    description: 'Linh thảo ngàn năm mới nở một lần, có khả năng phục sinh người đã khuất.',
    price: 80000,
    quality: 'heaven',
    type: 'herb',
    icon: 'leaf',
  },
  {
    id: '4',
    name: 'Cực Phẩm Linh Thạch',
    description: 'Tinh hoa linh khí đất trời ngưng tụ, tăng tốc độ tu luyện gấp trăm lần.',
    price: 5000,
    quality: 'mystic',
    type: 'gem',
    icon: 'gem',
  },
];

const categories = [
  { icon: <Gem size={16} />,      label: 'Tất Cả',   key: 'all'      },
  { icon: <Sparkles size={16} />, label: 'Linh Thạch', key: 'gem'    },
  { icon: <Leaf size={16} />,     label: 'Linh Thảo', key: 'herb'    },
  { icon: <BookOpen size={16} />, label: 'Công Pháp', key: 'book'    },
  { icon: <Sword size={16} />,    label: 'Pháp Khí',  key: 'artifact' },
];

export default function Pavilion() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <div className="pt-8 pb-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full flex flex-col md:flex-row gap-6 ethereal-bg flex-grow z-10">

      {/* ── Sidebar ── */}
      <aside className="w-full md:w-60 flex-shrink-0">
        <div className="glass-panel rounded-2xl p-5 sticky top-28">
          {/* Search */}
          <div className="relative mb-5">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full bg-surface-container/60 border border-outline-variant/30 rounded-lg pl-8 pr-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline-md text-[16px] text-primary">Phân Loại</h2>
            <SlidersHorizontal size={14} className="text-on-surface-variant" />
          </div>

          <ul className="space-y-1">
            {categories.map(cat => (
              <li key={cat.key}>
                <button
                  onClick={() => setActiveCategory(cat.key)}
                  className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-250 ${
                    activeCategory === cat.key
                      ? 'bg-primary/10 text-primary border border-primary/20 font-semibold'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container/60'
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-5 pt-5 border-t border-primary/10">
            <h3 className="font-label-caps text-on-surface-variant mb-3 text-[10px]">Phẩm Chất</h3>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Thiên Giới (Vàng)',    color: 'border-primary/50  text-primary' },
                { label: 'Huyền Giai (Tím)',    color: 'border-[#b066ff]/50 text-[#b066ff]' },
                { label: 'Phàm Nhân (Lục)',     color: 'border-secondary/50 text-secondary' },
              ].map((q, i) => (
                <label key={i} className={`flex items-center gap-2.5 cursor-pointer text-sm transition-colors hover:opacity-80 ${q.color}`}>
                  <div className={`w-3.5 h-3.5 rounded border-2 ${q.color.split(' ')[0]} bg-surface-container flex-shrink-0`} />
                  {q.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Grid ── */}
      <section className="flex-1 min-w-0">
        <header className="mb-8">
          <div className="font-label-caps text-secondary tracking-[0.2em] mb-2 text-[10px]">Tông Môn Cống Hiến</div>
          <h1 className="font-headline-xl text-[36px] md:text-[48px] gradient-text-gold mb-3">Tàng Kinh Các</h1>
          <p className="font-body-lg text-on-surface-variant max-w-2xl text-sm">
            Trao đổi cống hiến tông môn để nhận lấy những kỳ trân dị bảo, công pháp thượng thừa.
          </p>
          <div className="mystical-divider mt-6" />
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, idx) => {
            const isGold   = item.quality === 'heaven';
            const primary  = isGold ? '#f2ca50' : '#b066ff';
            const isHover  = hoveredItem === item.id;

            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`relative bg-surface-container-low/80 rounded-2xl p-6 border flex flex-col items-center text-center cursor-pointer transition-all duration-500 beam-sweep overflow-hidden ${
                  isGold
                    ? 'border-primary/20 hover:border-primary/50 hover:shadow-[0_0_40px_rgba(242,202,80,0.2)] glowing-border-gold'
                    : 'border-[#b066ff]/20 hover:border-[#b066ff]/50 hover:shadow-[0_0_40px_rgba(176,102,255,0.2)] glowing-border-purple'
                }`}
                style={{
                  transform: isHover ? 'translateY(-6px) scale(1.01)' : 'translateY(0) scale(1)',
                  animationDelay: `${idx * 0.1}s`,
                }}
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-0 w-full h-[2px] transition-all duration-500"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${primary}, transparent)`,
                    opacity: isHover ? 1 : 0,
                  }}
                />

                {/* Icon */}
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 border transition-all duration-500 relative"
                  style={{
                    background: `rgba(${isGold ? '242,202,80' : '176,102,255'}, 0.08)`,
                    borderColor: `rgba(${isGold ? '242,202,80' : '176,102,255'}, 0.3)`,
                    boxShadow: isHover ? `0 0 30px rgba(${isGold ? '242,202,80' : '176,102,255'}, 0.35)` : 'none',
                    transform: isHover ? 'scale(1.1) rotate(3deg)' : 'scale(1)',
                  }}
                >
                  {isHover && (
                    <div
                      className="absolute inset-0 rounded-2xl animate-ping-slow"
                      style={{ borderColor: primary, border: `1px solid ${primary}` }}
                    />
                  )}
                  {item.icon === 'sword'  && <Sword    size={32} style={{ color: primary }} />}
                  {item.icon === 'book'   && <BookOpen  size={32} style={{ color: primary }} />}
                  {item.icon === 'leaf'   && <Leaf      size={32} style={{ color: primary }} />}
                  {item.icon === 'gem'    && <Gem       size={32} style={{ color: primary }} />}
                </div>

                {/* Badge */}
                <span
                  className="font-label-caps text-[10px] px-3 py-1 rounded-full mb-3 shimmer-badge border"
                  style={{
                    color: primary,
                    background: `rgba(${isGold ? '242,202,80' : '176,102,255'}, 0.08)`,
                    borderColor: `rgba(${isGold ? '242,202,80' : '176,102,255'}, 0.25)`,
                  }}
                >
                  {item.quality === 'heaven' ? '✦ Thiên Giới' : '◈ Huyền Giai'}
                </span>

                <h3 className="font-headline-md text-[17px] font-bold text-on-surface mb-2" style={{ color: isHover ? primary : undefined, transition: 'color 0.3s' }}>
                  {item.name}
                </h3>
                <p className="font-body-md text-xs text-on-surface-variant mb-5 leading-relaxed flex-grow">
                  {item.description}
                </p>

                <div
                  className="mt-auto flex items-center justify-between w-full pt-4 border-t"
                  style={{ borderColor: `rgba(${isGold ? '242,202,80' : '176,102,255'}, 0.12)` }}
                >
                  <span className="font-bold flex items-center gap-1 text-sm" style={{ color: primary }}>
                    <Sparkles size={13} />
                    {item.price.toLocaleString()}
                  </span>
                  <button
                    className="font-label-caps text-[10px] px-3 py-1.5 rounded-lg border transition-all duration-300 hover:scale-105"
                    style={{
                      color: primary,
                      borderColor: `rgba(${isGold ? '242,202,80' : '176,102,255'}, 0.4)`,
                      background: `rgba(${isGold ? '242,202,80' : '176,102,255'}, 0.06)`,
                    }}
                  >
                    Đổi Ngay
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="mt-10 flex justify-center gap-2">
          {[ChevronLeft, null, null, null, ChevronRight].map((Icon, i) => (
            Icon
              ? (
                <button key={i} className="w-9 h-9 flex items-center justify-center rounded-lg border border-primary/20 text-on-surface-variant hover:border-primary hover:text-primary transition-all duration-300 hover:bg-primary/5">
                  <Icon size={16} />
                </button>
              )
              : (
                <button
                  key={i}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg border text-sm font-medium transition-all duration-300 ${
                    i === 1
                      ? 'bg-primary/15 border-primary text-primary font-bold shadow-[0_0_15px_rgba(242,202,80,0.2)]'
                      : 'border-primary/20 text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {i}
                </button>
              )
          ))}
        </div>
      </section>
    </div>
  );
}

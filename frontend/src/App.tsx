import { useState, useEffect, useRef, ReactNode } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import MobileNav from './components/MobileNav';
import Pavilion from './components/Pavilion';
import SpiritRoots from './components/SpiritRoots';
import WorldMap from './components/WorldMap';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CharacterSetupModal from './components/CharacterSetupModal';
import { useAuth } from './context/AuthContext';
import { TabType } from './types';
import { Sword, CloudLightning, Mountain, ChevronDown, Star, Zap } from 'lucide-react';
import './index.css';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/*" element={
        <GlobalCharacterGuard>
          <MainLayout />
        </GlobalCharacterGuard>
      } />
    </Routes>
  );
}

// ── Global Route Guard ────────────────────────────────────────────────────────
// Kiểm tra isCharacterCreated mọi nơi trong app, kể cả khi refresh trình duyệt.
// AuthContext.getMe() khôi phục session → nếu chưa tạo nhân vật → modal hiện ra.
function GlobalCharacterGuard({ children }: { children: ReactNode }) {
  const { user, isLoading, updateUser } = useAuth();

  const needsSetup = !isLoading && user !== null && !user.isCharacterCreated;

  return (
    <>
      {children}
      {/* Modal hiện khi user đã đăng nhập nhưng chưa tạo nhân vật */}
      {needsSetup && <CharacterSetupModal onComplete={(updatedUser) => updateUser(updatedUser)} />}
    </>
  );
}

function MainLayout() {
  const [activeTab, setActiveTab] = useState<TabType>('home');


  return (
    <div className="bg-background text-on-background min-h-screen relative overflow-x-hidden flex flex-col text-body-md font-body-md">
      <div className="fixed inset-0 ink-wash-overlay z-0 pointer-events-none"></div>
      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="relative z-10 pt-24 min-h-screen flex flex-col flex-grow">
        {activeTab === 'map' && <WorldMap />}
        {activeTab === 'roots' && <SpiritRoots />}
        {activeTab === 'pavilion' && <Pavilion />}
        {activeTab === 'home' && <Home setActiveTab={setActiveTab} />}
      </main>
      <Footer />
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

/* ── Floating particle component ── */
function Particle({ delay, x, size, color }: { key?: string | number; delay: number; x: number; size: number; color: string }) {
  return (
    <div
      className="particle"
      style={{
        left: `${x}%`,
        width: size,
        height: size,
        background: color,
        animationDuration: `${6 + Math.random() * 8}s`,
        animationDelay: `${delay}s`,
        boxShadow: `0 0 ${size * 2}px ${color}`,
      }}
    />
  );
}

/* ── Counter hook ── */
function useCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

/* ── Stats section ── */
function StatCard({ value, label, suffix = '', delay }: { value: number; label: string; suffix?: string; delay: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const count = useCounter(value, 1800, visible);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="glass-panel-hover rounded-2xl p-6 text-center beam-sweep"
      style={{ animationDelay: delay }}
    >
      <div className="gradient-text-gold font-headline-xl text-[48px] md:text-[56px] mb-1">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="font-label-caps text-on-surface-variant">{label}</div>
    </div>
  );
}

function Home({ setActiveTab }: { setActiveTab: (t: TabType) => void }) {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: i * 0.5,
    x: (i * 5.3) % 100,
    size: 2 + (i % 4),
    color: i % 3 === 0 ? 'rgba(242,202,80,0.8)' : i % 3 === 1 ? 'rgba(126,217,158,0.7)' : 'rgba(176,102,255,0.6)',
  }));

  const features = [
    {
      icon: <Sword size={32} />,
      title: 'Thần Binh Pháp Bảo',
      desc: 'Rèn đúc pháp bảo thượng cổ, ngự kiếm phi hành. Mỗi món pháp bảo đều ẩn chứa khí tức hủy thiên diệt địa.',
      color: 'primary',
      glow: 'hover:shadow-[0_0_40px_rgba(242,202,80,0.25)]',
      iconBg: 'bg-primary/10 border-primary/30',
      iconColor: 'text-primary',
    },
    {
      icon: <Mountain size={32} />,
      title: 'Tông Môn Chiến',
      desc: 'Tranh đoạt linh mạch, bang chiến ngàn người. Dẫn dắt tông môn trở thành đệ nhất thiên hạ.',
      color: 'error',
      glow: 'hover:shadow-[0_0_40px_rgba(255,180,171,0.2)]',
      iconBg: 'bg-error/10 border-error/30',
      iconColor: 'text-error',
    },
    {
      icon: <CloudLightning size={32} />,
      title: 'Con Đường Phi Thăng',
      desc: 'Độ kiếp phi thăng, vượt qua thiên lôi. Đột phá cảnh giới từ Luyện Khí đến Đại Thừa.',
      color: 'secondary',
      glow: 'hover:shadow-[0_0_40px_rgba(126,217,158,0.2)]',
      iconBg: 'bg-secondary/10 border-secondary/30',
      iconColor: 'text-secondary',
    },
  ];

  const ranks = [
    { name: 'Luyện Khí', color: '#7ed99e', active: false },
    { name: 'Trúc Cơ', color: '#f2ca50', active: true },
    { name: 'Kim Đan', color: '#f2ca50', active: false },
    { name: 'Nguyên Anh', color: '#b066ff', active: false },
    { name: 'Hóa Thần', color: '#b066ff', active: false },
    { name: 'Đại Thừa', color: '#ff6b6b', active: false },
  ];

  return (
    <div className="w-full relative">

      {/* ── HERO SECTION ── */}
      <section className="min-h-[100vh] flex items-center justify-center relative overflow-hidden px-margin-mobile md:px-margin-desktop">

        {/* Gradient background layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#07080a] via-background to-background z-0" />
        <div className="absolute inset-0 z-0">
          <div className="orb-gold w-[700px] h-[700px] top-[-200px] left-[-200px]" />
          <div className="orb-jade w-[500px] h-[500px] top-[10%] right-[-100px]" style={{ animationDelay: '-5s' }} />
          <div className="orb-epic w-[600px] h-[600px] bottom-[-100px] left-[30%]" style={{ animationDelay: '-10s' }} />
        </div>

        {/* Star field */}
        <div className="star-field z-0" />

        {/* Particles */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {particles.map(({ id, delay, x, size, color }) => (
            <Particle key={id} delay={delay} x={x} size={size} color={color} />
          ))}
        </div>

        {/* Rotating rings */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] z-0 hidden md:block pointer-events-none opacity-10">
          <div className="animate-spin-slow absolute inset-0 rounded-full border border-primary/40" style={{ borderStyle: 'dashed' }} />
          <div className="animate-spin-slow-r absolute inset-8 rounded-full border border-secondary/30" />
          <div className="animate-spin-slow absolute inset-16 rounded-full border border-primary/20" style={{ borderStyle: 'dotted' }} />
        </div>

        {/* CONTENT */}
        <div className="relative z-10 text-center max-w-5xl mx-auto flex flex-col items-center gap-8">

          {/* Badge */}
          <div className="fade-in-up inline-flex items-center gap-3 bg-surface-container/60 border border-primary/30 px-5 py-2 rounded-full shimmer-badge">
            <Star size={12} className="text-primary fill-primary animate-pulse" />
            <span className="font-label-caps text-primary tracking-[0.2em]">Khai Mở Tiên Giới</span>
            <Star size={12} className="text-primary fill-primary animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>

          {/* Title */}
          <h1 className="fade-in-up-delay-1 font-headline-xl md:text-[80px] text-[48px] leading-[1.05] gradient-text-gold drop-shadow-[0_0_40px_rgba(212,175,55,0.3)]">
            Đạo Tâm Bất Diệt
          </h1>

          {/* Subtitle */}
          <p className="fade-in-up-delay-2 font-body-lg text-on-surface-variant max-w-2xl px-4 leading-relaxed">
            Hấp thu linh khí, rèn luyện thể phách, phi thăng tiên giới.{' '}
            <span className="text-primary/80">Cuộc hành trình ngàn năm bắt đầu từ một bước chân.</span>
          </p>

          {/* CTA Buttons */}
          <div className="fade-in-up-delay-3 flex flex-col sm:flex-row items-center gap-4 mt-4">
            <button
              onClick={() => setActiveTab('roots')}
              className="energy-pulse ornate-corners relative bg-primary/10 border border-primary text-primary px-10 py-4 rounded-lg font-headline-md text-[20px] hover:bg-primary/20 hover:gold-glow-strong transition-all duration-300 group"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Zap size={20} className="group-hover:animate-bounce" />
                Tu Luyện Ngay
              </span>
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className="border border-on-surface-variant/30 text-on-surface-variant px-8 py-4 rounded-lg font-body-lg hover:border-primary/50 hover:text-primary transition-all duration-300"
            >
              Khám Phá Thế Giới →
            </button>
          </div>

          {/* Cultivation Rank Bar */}
          <div className="fade-in-up-delay-4 mt-8 flex items-center gap-1 md:gap-2 flex-wrap justify-center">
            {ranks.map((r, i) => (
              <div key={i} className="flex items-center gap-1 md:gap-2">
                <div className={`flex flex-col items-center gap-1 group cursor-default`}>
                  <div
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${r.active ? 'scale-150 animate-pulse' : 'opacity-50'}`}
                    style={{ background: r.color, boxShadow: r.active ? `0 0 8px ${r.color}` : 'none' }}
                  />
                  <span
                    className="font-label-caps text-[9px] md:text-[10px] transition-colors"
                    style={{ color: r.active ? r.color : 'rgba(160,150,130,0.6)' }}
                  >
                    {r.name}
                  </span>
                </div>
                {i < ranks.length - 1 && (
                  <div className="w-4 md:w-8 h-px mb-4" style={{ background: i < 1 ? '#7ed99e' : 'rgba(100,90,70,0.4)' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="fade-in-up-delay-5 absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
          <span className="font-label-caps text-on-surface-variant text-[10px]">Cuộn xuống</span>
          <ChevronDown size={16} className="text-primary animate-bounce" />
        </div>
      </section>

      {/* ── STATS SECTION ── */}
      <section className="py-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <StatCard value={12847} label="Tu Sĩ Đang Luyện" suffix="+" delay="0s" />
          <StatCard value={99} label="Cảnh Giới Tối Cao" suffix="" delay="0.1s" />
          <StatCard value={500} label="Pháp Bảo Độc Nhất" suffix="+" delay="0.2s" />
          <StatCard value={7} label="Đại Lục Khám Phá" suffix="" delay="0.3s" />
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="mystical-divider" />
      </div>

      {/* ── FEATURES SECTION ── */}
      <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-24 relative z-10">
        <div className="text-center mb-16">
          <div className="font-label-caps text-secondary tracking-[0.2em] mb-3">Hệ Thống</div>
          <h2 className="font-headline-lg text-on-background text-[36px] md:text-[52px]">
            Con Đường <span className="gradient-text-gold">Tu Tiên</span>
          </h2>
          <p className="font-body-lg text-on-surface-variant mt-4 max-w-xl mx-auto">
            Ba trụ cột của đường tu tiên — từ pháp bảo đến tông phái, từ trúc cơ đến phi thăng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className={`group relative bg-surface-container/60 border border-primary/10 rounded-2xl p-8 transition-all duration-500 beam-sweep cursor-pointer overflow-hidden ${f.glow}`}
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {/* Top beam */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 float-icon ${f.iconBg} ${f.iconColor}`}>
                {f.icon}
              </div>

              {/* Number */}
              <div className="font-label-caps text-on-surface-variant/40 text-[10px] mb-2">0{i + 1}</div>

              <h3 className="font-headline-md text-[22px] text-on-background mb-3 group-hover:text-primary transition-colors duration-300">
                {f.title}
              </h3>
              <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">
                {f.desc}
              </p>

              {/* Bottom line */}
              <div className={`absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-700 rounded-b-2xl`}
                style={{ background: `linear-gradient(90deg, transparent, var(--color-${f.color}), transparent)` }} />
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="relative overflow-hidden py-24 px-margin-mobile md:px-margin-desktop">
        <div className="absolute inset-0 ethereal-bg" />
        <div className="absolute inset-0">
          <div className="orb-gold w-[400px] h-[400px] top-[-100px] right-0 opacity-60" />
          <div className="orb-jade w-[300px] h-[300px] bottom-0 left-0 opacity-50" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="glass-panel rounded-3xl p-12 md:p-16">
            <div className="font-label-caps text-primary tracking-[0.25em] mb-4">Bắt Đầu Hành Trình</div>
            <h2 className="font-headline-xl text-[36px] md:text-[52px] gradient-text-gold mb-6 leading-tight">
              Vạn Dặm Trường Sinh<br />Bắt Đầu Từ Đây
            </h2>
            <p className="font-body-lg text-on-surface-variant mb-10 max-w-xl mx-auto">
              Gia nhập hàng ngàn tu sĩ đang trên con đường tìm kiếm bất tử. Linh căn của ngươi đang chờ đợi.
            </p>
            <button
              onClick={() => setActiveTab('roots')}
              className="energy-pulse ornate-corners bg-primary text-on-primary px-12 py-5 rounded-xl font-headline-md text-[20px] hover:bg-primary-fixed-dim transition-all duration-300 hover:shadow-[0_0_50px_rgba(242,202,80,0.4)] inline-flex items-center gap-3"
            >
              <Zap size={22} />
              Khai Mở Linh Căn
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}

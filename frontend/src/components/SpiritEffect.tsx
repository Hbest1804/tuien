import { motion } from 'motion/react';
import { useEffect, useState, useMemo } from 'react';

interface SpiritEffectProps {
  type: string;
  color: string;
}

export default function SpiritEffect({ type, color }: SpiritEffectProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  switch (type) {
    case 'Hỏa': return <FireEffect color={color} />;
    case 'Thủy': return <WaterEffect color={color} />;
    case 'Mộc': return <WoodEffect color={color} />;
    case 'Kim': return <MetalEffect color={color} />;
    case 'Thổ': return <EarthEffect color={color} />;
    case 'Lôi': return <LightningEffect color={color} />;
    case 'Băng': return <IceEffect color={color} />;
    case 'Phong': return <WindEffect color={color} />;
    case 'Âm Dương': return <YinYangEffect color={color} />;
    default: return <DefaultEffect color={color} />;
  }
}

// ─── Fire Effect (Rising Embers) ───
function FireEffect({ color }: { color: string }) {
  const [particles] = useState(() => Array.from({ length: 25 }).map(() => ({
    size: Math.random() * 10 + 4,
    left: `${Math.random() * 100}%`,
    yTarget: -Math.random() * 250 - 100,
    xTarget: Math.random() * 60 - 30,
    duration: Math.random() * 2 + 1.5,
    delay: Math.random() * 2,
  })));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 mix-blend-screen">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            background: `radial-gradient(circle, #fff 0%, ${color} 40%, transparent 100%)`,
            width: p.size,
            height: p.size,
            left: p.left,
            bottom: '-10%',
          }}
          animate={{
            y: [0, p.yTarget],
            x: p.xTarget,
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.5, 0.5],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── Water Effect (Bubbles / Drops) ───
function WaterEffect({ color }: { color: string }) {
  const [particles] = useState(() => Array.from({ length: 20 }).map((_, i) => ({
    size: Math.random() * 15 + 5,
    left: `${Math.random() * 100}%`,
    yTarget: -Math.random() * 300 - 100,
    xAmp: 30,
    duration: Math.random() * 3 + 3,
    delay: Math.random() * 3,
  })));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            border: `1px solid ${color}`,
            background: `radial-gradient(circle at 30% 30%, #fff 5%, ${color}40 60%, transparent 100%)`,
            width: p.size,
            height: p.size,
            left: p.left,
            bottom: '-10%',
            boxShadow: `inset -2px -2px 5px ${color}80, 0 0 5px ${color}40`,
          }}
          animate={{
            y: [0, p.yTarget],
            x: Math.sin(i) * p.xAmp,
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── Wood Effect (Falling Leaves / Spores) ───
function WoodEffect({ color }: { color: string }) {
  const [particles] = useState(() => Array.from({ length: 25 }).map(() => ({
    size: Math.random() * 6 + 3,
    left: `${Math.random() * 100}%`,
    yTarget: Math.random() * 300 + 150,
    xTarget1: Math.random() * 100 - 50,
    xTarget2: Math.random() * 100 - 50,
    duration: Math.random() * 4 + 4,
    delay: Math.random() * 4,
  })));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            background: color,
            width: p.size,
            height: p.size,
            left: p.left,
            top: '-10%',
            boxShadow: `0 0 10px ${color}`,
            borderRadius: '50% 0 50% 50%',
          }}
          animate={{
            y: [0, p.yTarget],
            x: [0, p.xTarget1, p.xTarget2],
            rotate: [0, 180, 360],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── Metal Effect (Sparks) ───
function MetalEffect({ color }: { color: string }) {
  const [particles] = useState(() => Array.from({ length: 20 }).map(() => ({
    width: Math.random() * 2 + 1,
    height: Math.random() * 30 + 10,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    rotate: `${Math.random() * 360}deg`,
    duration: Math.random() * 0.5 + 0.5,
    delay: Math.random() * 2,
  })));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 mix-blend-screen">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}, #fff, ${color}, transparent)`,
            width: p.width,
            height: p.height,
            left: p.left,
            top: p.top,
            boxShadow: `0 0 10px ${color}`,
            transformOrigin: 'center',
            rotate: p.rotate,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── Earth Effect (Floating Dust / Pebbles) ───
function EarthEffect({ color }: { color: string }) {
  const [particles] = useState(() => Array.from({ length: 25 }).map(() => ({
    size: Math.random() * 6 + 3,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    isSquare: Math.random() > 0.5,
    yTarget: Math.random() * 50 - 25,
    xTarget: Math.random() * 50 - 25,
    duration: Math.random() * 5 + 4,
    delay: Math.random() * 3,
  })));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            background: color,
            width: p.size,
            height: p.size,
            left: p.left,
            top: p.top,
            borderRadius: p.isSquare ? '2px' : '30%',
            opacity: 0,
            boxShadow: `inset -1px -1px 3px rgba(0,0,0,0.5)`,
          }}
          animate={{
            y: [0, p.yTarget],
            x: [0, p.xTarget],
            rotate: [0, 90, 180],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── Wind Effect (Horizontal Streaks) ───
function WindEffect({ color }: { color: string }) {
  const [particles] = useState(() => Array.from({ length: 20 }).map(() => ({
    width: Math.random() * 80 + 30,
    height: Math.random() * 2 + 1,
    top: `${Math.random() * 100}%`,
    duration: Math.random() * 2 + 1,
    delay: Math.random() * 2,
  })));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            width: p.width,
            height: p.height,
            left: '-20%',
            top: p.top,
            opacity: 0,
          }}
          animate={{
            x: ['0vw', '150vw'],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

// ─── Lightning Effect (Flashes) ───
function LightningEffect({ color }: { color: string }) {
  const [particles] = useState(() => Array.from({ length: 8 }).map(() => ({
    width: Math.random() * 4 + 2,
    height: Math.random() * 60 + 30,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    rotate: Math.random() * 60 - 30,
    duration: Math.random() * 0.5 + 0.2,
    delay: Math.random() * 3,
  })));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 mix-blend-screen">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            background: '#fff',
            width: p.width,
            height: p.height,
            left: p.left,
            top: p.top,
            boxShadow: `0 0 20px ${color}, 0 0 40px ${color}`,
            transform: `rotate(${p.rotate}deg)`,
            clipPath: 'polygon(50% 0%, 100% 40%, 60% 40%, 100% 100%, 0% 60%, 40% 60%)',
          }}
          animate={{
            opacity: [0, 1, 0, 1, 0],
            scale: [0.8, 1.2, 0.9, 1.1, 0.8],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

// ─── Ice Effect (Snowflakes) ───
function IceEffect({ color }: { color: string }) {
  const [particles] = useState(() => Array.from({ length: 30 }).map((_, i) => ({
    size: Math.random() * 5 + 2,
    left: `${Math.random() * 100}%`,
    yTarget: Math.random() * 250 + 100,
    xAmp: 30,
    duration: Math.random() * 4 + 3,
    delay: Math.random() * 2,
  })));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            background: `radial-gradient(circle, #fff 0%, ${color} 80%)`,
            width: p.size,
            height: p.size,
            left: p.left,
            top: '-10%',
            boxShadow: `0 0 8px ${color}`,
          }}
          animate={{
            y: [0, p.yTarget],
            x: [0, Math.sin(i) * p.xAmp, -Math.sin(i) * p.xAmp],
            opacity: [0, 0.8, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

// ─── Default Effect (Floating Motes) ───
function DefaultEffect({ color }: { color: string }) {
  const [particles] = useState(() => Array.from({ length: 20 }).map(() => ({
    size: Math.random() * 8 + 2,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    yTarget: Math.random() * 80 - 40,
    xTarget: Math.random() * 80 - 40,
    duration: Math.random() * 4 + 2,
    delay: Math.random() * 2,
  })));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 mix-blend-screen">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            background: color,
            width: p.size,
            height: p.size,
            left: p.left,
            top: p.top,
            boxShadow: `0 0 15px ${color}`,
          }}
          animate={{
            y: [0, p.yTarget],
            x: [0, p.xTarget],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            repeatType: "reverse",
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── Yin Yang Effect (Tai Chi) ───
function YinYangEffect({ color }: { color: string }) {
  const [particles] = useState(() => Array.from({ length: 8 }).map((_, i) => ({
    size: Math.random() * 6 + 3,
    color: i % 2 === 0 ? '#f8f9fa' : '#121212',
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    yTarget: Math.random() * 100 - 50,
    xTarget: Math.random() * 100 - 50,
    duration: Math.random() * 4 + 4,
    delay: Math.random() * 2,
  })));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center opacity-40">
      {/* Background radial glow */}
      <div 
        className="absolute inset-0" 
        style={{ background: `radial-gradient(circle, ${color}20 0%, transparent 60%)` }} 
      />
      
      {/* Spinning Tai Chi */}
      <motion.div
        className="relative rounded-full"
        style={{
          width: '320px',
          height: '320px',
          background: 'linear-gradient(to right, #f8f9fa 50%, #121212 50%)',
          boxShadow: `0 0 80px ${color}80, inset 0 0 20px rgba(0,0,0,0.5)`,
          border: '2px solid rgba(255,255,255,0.1)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      >
        <div 
          className="absolute rounded-full"
          style={{ width: '160px', height: '160px', background: '#f8f9fa', top: 0, left: '80px' }}
        >
          <div className="absolute w-10 h-10 bg-[#121212] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-inner" />
        </div>
        
        <div 
          className="absolute rounded-full"
          style={{ width: '160px', height: '160px', background: '#121212', bottom: 0, left: '80px' }}
        >
          <div className="absolute w-10 h-10 bg-[#f8f9fa] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-inner" />
        </div>
      </motion.div>

      {/* Small orbiting particles */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 10px ${color}`,
            left: p.left,
            top: p.top,
          }}
          animate={{
            y: [0, p.yTarget],
            x: [0, p.xTarget],
            rotate: 360,
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

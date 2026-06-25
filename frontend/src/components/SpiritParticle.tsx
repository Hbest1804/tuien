export default function SpiritParticle({ active, color }: { active: boolean; color: string }) {
  const count = 14;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${10 + (i * 6.5) % 80}%`,
            width: active ? `${2 + (i % 3)}px` : '0px',
            height: active ? `${2 + (i % 3)}px` : '0px',
            background: color,
            borderRadius: '50%',
            opacity: active ? 0.8 : 0,
            boxShadow: `0 0 6px ${color}`,
            animation: active
              ? `float-particle ${4 + (i % 5)}s ${(i * 0.4)}s linear infinite`
              : 'none',
            transition: 'width 0.6s ease, height 0.6s ease',
          }}
        />
      ))}
    </div>
  );
}

import { useState } from 'react';
import { Sparkles, Zap, Star } from 'lucide-react';
import { setupCharacter } from '../services/authService';
import { useAuth } from '../context/AuthContext';

interface Props {
  onComplete: () => void;
}

// ── Màu sắc & hiệu ứng cho từng loại linh căn ──────────────────────────────
const SPIRIT_ROOT_COLORS: Record<string, { color: string; glow: string; emoji: string }> = {
  // Ngũ hành
  'Kim':        { color: '#d4af37', glow: '0 0 30px rgba(212,175,55,0.6)',   emoji: '⚔️'  },
  'Mộc':        { color: '#7ed99e', glow: '0 0 30px rgba(126,217,158,0.6)',  emoji: '🌿'  },
  'Thủy':       { color: '#60c8f5', glow: '0 0 30px rgba(96,200,245,0.6)',   emoji: '💧'  },
  'Hỏa':        { color: '#ff6b6b', glow: '0 0 30px rgba(255,107,107,0.6)',  emoji: '🔥'  },
  'Thổ':        { color: '#c8a46e', glow: '0 0 30px rgba(200,164,110,0.6)',  emoji: '⛰️'  },
  // Thiên nhiên
  'Lôi':        { color: '#b066ff', glow: '0 0 30px rgba(176,102,255,0.6)',  emoji: '⚡'  },
  'Băng':       { color: '#a8d8ea', glow: '0 0 30px rgba(168,216,234,0.6)',  emoji: '❄️'  },
  'Phong':      { color: '#88e8d8', glow: '0 0 30px rgba(136,232,216,0.6)',  emoji: '🌪️'  },
  // Đặc thù
  'Quang':      { color: '#fff7a0', glow: '0 0 40px rgba(255,247,160,0.7)',  emoji: '✨'  },
  'Ám':         { color: '#7c3aed', glow: '0 0 40px rgba(124,58,237,0.7)',   emoji: '🌑'  },
  'Huyết':      { color: '#dc143c', glow: '0 0 35px rgba(220,20,60,0.7)',    emoji: '🩸'  },
  'Độc':        { color: '#39ff14', glow: '0 0 35px rgba(57,255,20,0.7)',    emoji: '☠️'  },
  'Tinh Thần':  { color: '#67e8f9', glow: '0 0 35px rgba(103,232,249,0.7)', emoji: '🔮'  },
  // Huyền thoại
  'Âm Dương':   { color: '#e879f9', glow: '0 0 60px rgba(232,121,249,0.8)', emoji: '☯️'  },
  'Không Gian': { color: '#818cf8', glow: '0 0 60px rgba(129,140,248,0.8)', emoji: '🌌'  },
  'Hỗn Nguyên': { color: '#ff9f43', glow: '0 0 80px rgba(255,159,67,0.9)',  emoji: '🌠'  },
};

const GRADE_COLORS: Record<string, string> = {
  'Thiên': '#ff6b6b',
  'Địa':   '#b066ff',
  'Huyền': '#f2ca50',
  'Hoàng': '#7ed99e',
};

const GENDER_DATA = {
  male:   { label: 'Nam Tu Sĩ', desc: 'Thể phách cường tráng, công kích mạnh mẽ', emoji: '⚔️', icon: '♂' },
  female: { label: 'Nữ Tu Sĩ',  desc: 'Linh hồn thuần khiết, phòng thủ vượt trội', emoji: '🌸', icon: '♀' },
};

// Module-level constant — chỉ khởi tạo một lần, tránh re-allocation mỗi lần render
const SPIRIT_ROOT_DESCRIPTIONS: Record<string, string> = {
  // Huyền thoại
  'Hỗn Nguyên':  '🌠 Hỗn Nguyên Linh Căn — Vạn Cổ Độc Nhất! Ngươi mang trong mình khí tức hỗn độn từ thuở khai thiên lập địa. Cả thiên hạ tu sĩ sẽ thèm muốn linh căn của ngươi!',
  'Âm Dương':    '☯️ Âm Dương Linh Căn — Nhị Nguyên Chi Căn! Âm dương giao hội trong thể nội, ngươi có thể tu luyện cả công và thủ pháp thuật đồng thời.',
  'Không Gian':  '🌌 Không Gian Linh Căn — Pháp Tắc Vô Biên! Khống chế không gian, khiến địch nhân không thể chạy thoát. Thần thông phi thường!',
  // Ngũ hành
  'Kim':         '⚔️ Kim Linh Căn — Sắc bén như kiếm, cứng rắn như thép. Công kích vô song, phá giáp bất nghịch!',
  'Mộc':         '🌿 Mộc Linh Căn — Sinh mệnh lực mạnh mẽ, hồi phục thần tốc. Thông thiên đạt địa, vạn vật sinh trưởng!',
  'Thủy':        '💧 Thủy Linh Căn — Nhu hòa như nước, vô hình vô tướng. Pháp thuật biến hóa vô cùng, tương khắc với Hỏa!',
  'Hỏa':         '🔥 Hỏa Linh Căn — Bách chiến bách thắng, nhiệt huyết không tắt! Thiêu đốt thiên địa, hủy diệt tất cả!',
  'Thổ':         '⛰️ Thổ Linh Căn — Vĩnh hằng như đất, kiên cố như núi. Phòng thủ như thành trì, không gì lay chuyển được!',
  // Thiên nhiên đặc biệt
  'Lôi':         '⚡ Lôi Linh Căn — Thiên lôi trong tay ngươi! Tốc độ công kích nhanh nhất, địch nhân không kịp phản ứng!',
  'Băng':        '❄️ Băng Linh Căn — Lạnh giá vạn vật, đóng băng địch nhân! Khống chế tuyệt vời, không ai thoát khỏi lưới băng!',
  'Phong':       '🌪️ Phong Linh Căn — Nhanh như gió, không ai có thể bắt kịp! Tốc độ di chuyển vượt xa người thường!',
  // Đặc thù
  'Quang':       '✨ Quang Linh Căn — Ánh sáng thanh tẩy, hào quang vô biên! Công kích ánh sáng phá giải ám pháp, thiêng liêng vô thượng!',
  'Ám':          '🌑 Ám Linh Căn — Bóng tối che phủ, ẩn thân vô hình! Ám pháp bí ẩn, địch nhân không biết đâu mà đỡ!',
  'Huyết':       '🩸 Huyết Linh Căn — Huyết mạch cuộn chảy, sức mạnh huyết khí! Chiến đấu càng lâu càng mạnh, bất tử chi thể!',
  'Độc':         '☠️ Độc Linh Căn — Bá đạo vô song! Vạn độc không xâm, có thể hạ gục địch nhân mà không cần giao chiến!',
  'Tinh Thần':  '🔮 Tinh Thần Linh Căn — Hồn pháp vô song! Thần thức mạnh mẽ, có thể tấn công trực tiếp vào thần hồn địch nhân!',
};

type Step = 'gender' | 'rolling' | 'reveal';

export default function CharacterSetupModal({ onComplete }: Props) {
  const { updateUser } = useAuth();
  const [step, setStep] = useState<Step>('gender');
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);
  const [rolledRoot, setRolledRoot] = useState<string | null>(null);
  const [rolledGrade, setRolledGrade] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenderConfirm = async () => {
    if (!selectedGender) return;
    setLoading(true);
    setError('');
    setStep('rolling');

    try {
      await new Promise(res => setTimeout(res, 2200));
      const res = await setupCharacter(selectedGender);
      setRolledRoot(res.data.user.spiritRoot);
      setRolledGrade(res.data.user.spiritRootGrade);
      updateUser(res.data.user);
      setStep('reveal');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra');
      setStep('gender');
    } finally {
      setLoading(false);
    }
  };

  const rootInfo = rolledRoot ? (SPIRIT_ROOT_COLORS[rolledRoot] || null) : null;
  const gradeColor = rolledGrade ? GRADE_COLORS[rolledGrade] : '#f2ca50';
  const isLegendary = ['Hỗn Nguyên', 'Âm Dương', 'Không Gian'].includes(rolledRoot ?? '');
  const isRare = rolledGrade === 'Thiên' || rolledGrade === 'Địa';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-lg"
        style={{ animation: 'fadeInUp 0.4s ease-out' }}
      >
        {/* ── STEP: GENDER SELECTION ── */}
        {step === 'gender' && (
          <div className="glass-panel rounded-3xl p-8 md:p-10 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star size={14} className="text-primary fill-primary animate-pulse" />
              <span className="font-label-caps text-primary tracking-[0.2em] text-xs">Khai Mở Nhân Vật</span>
              <Star size={14} className="text-primary fill-primary animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
            <h2 className="font-headline-xl text-[28px] md:text-[34px] gradient-text-gold mb-2">
              Chọn Giới Tính Tu Sĩ
            </h2>
            <p className="font-body-md text-on-surface-variant text-sm mb-8">
              Giới tính sẽ ảnh hưởng đến đặc tính tu luyện của bạn
            </p>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-lg bg-red-900/30 border border-red-500/30 text-red-300 text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* Gender Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {(['male', 'female'] as const).map((g) => {
                const gd = GENDER_DATA[g];
                const isSelected = selectedGender === g;
                return (
                  <button
                    key={g}
                    onClick={() => setSelectedGender(g)}
                    className="relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer group"
                    style={{
                      borderColor: isSelected ? 'rgba(242,202,80,0.8)' : 'rgba(242,202,80,0.15)',
                      background: isSelected ? 'rgba(242,202,80,0.1)' : 'rgba(255,255,255,0.03)',
                      boxShadow: isSelected ? '0 0 30px rgba(242,202,80,0.2)' : 'none',
                    }}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-black text-xs font-bold">✓</div>
                    )}
                    <div
                      className="text-5xl transition-transform duration-300 group-hover:scale-110"
                      style={{ filter: isSelected ? 'drop-shadow(0 0 10px rgba(242,202,80,0.6))' : 'none' }}
                    >
                      {gd.emoji}
                    </div>
                    <div className="font-headline-md text-[16px] text-on-background">{gd.label}</div>
                    <div className="font-body-md text-on-surface-variant text-xs leading-relaxed">{gd.desc}</div>
                    <div
                      className="font-headline-xl text-[36px] transition-all duration-300"
                      style={{ color: isSelected ? '#f2ca50' : 'rgba(160,150,130,0.4)' }}
                    >
                      {gd.icon}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Spirit Root Preview */}
            <div className="mb-6 p-3 rounded-xl border border-primary/10 bg-primary/5">
              <p className="font-label-caps text-on-surface-variant text-[10px] tracking-[0.15em] mb-2">Có thể khai mở</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {['Kim','Mộc','Thủy','Hỏa','Thổ','Lôi','Băng','Phong','Quang','Ám','Huyết','Độc','Tinh Thần','Âm Dương','Không Gian','Hỗn Nguyên'].map((root) => {
                  const info = SPIRIT_ROOT_COLORS[root];
                  return (
                    <span
                      key={root}
                      className="text-xs px-2 py-0.5 rounded-full border"
                      style={{ borderColor: `${info.color}40`, color: info.color, background: `${info.color}10` }}
                    >
                      {info.emoji} {root}
                    </span>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleGenderConfirm}
              disabled={!selectedGender || loading}
              className="energy-pulse ornate-corners w-full bg-primary/10 border border-primary text-primary py-4 rounded-xl font-headline-md text-[18px] hover:bg-primary/20 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles size={20} />
              Khai Mở Linh Căn
            </button>
          </div>
        )}

        {/* ── STEP: ROLLING ANIMATION ── */}
        {step === 'rolling' && (
          <div className="glass-panel rounded-3xl p-10 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Star size={14} className="text-primary fill-primary animate-pulse" />
              <span className="font-label-caps text-primary tracking-[0.2em] text-xs">Thiên Đạo Phán Xét</span>
              <Star size={14} className="text-primary fill-primary animate-pulse" />
            </div>
            <h2 className="font-headline-xl text-[28px] gradient-text-gold mb-8">
              Đang Khai Mở Linh Căn...
            </h2>
            {/* Rolling orb */}
            <div className="relative flex items-center justify-center mb-8" style={{ height: 160 }}>
              <div
                className="w-32 h-32 rounded-full border-4 border-primary/40 flex items-center justify-center"
                style={{
                  background: 'radial-gradient(circle, rgba(242,202,80,0.2), rgba(176,102,255,0.1))',
                  boxShadow: '0 0 60px rgba(242,202,80,0.4), inset 0 0 30px rgba(176,102,255,0.2)',
                  animation: 'spin 1s linear infinite',
                }}
              >
                <div
                  className="w-20 h-20 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(242,202,80,0.6), rgba(176,102,255,0.4))',
                    animation: 'pulse 0.5s ease-in-out infinite',
                  }}
                />
              </div>
              {/* Orbiting particles — two-div pattern: outer giữ góc, inner chạy orbit */}
              {['⚡','🔥','💧','🌿','⚔️','❄️','🌪️','✨','🌑','🩸','☠️','🔮'].map((e, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) rotate(${i * 30}deg)`,
                  }}
                >
                  <div
                    className="text-base"
                    style={{
                      animation: `orbit${i % 2 === 0 ? '' : '-r'} ${2.5 + i * 0.2}s linear infinite`,
                    }}
                  >
                    {e}
                  </div>
                </div>
              ))}
            </div>
            <p className="font-body-md text-on-surface-variant animate-pulse">
              Thiên Đạo đang xem xét linh căn của ngươi...
            </p>
          </div>
        )}

        {/* ── STEP: REVEAL ── */}
        {step === 'reveal' && rootInfo && (
          <div
            className="glass-panel rounded-3xl p-8 md:p-10 text-center"
            style={{
              boxShadow: isLegendary
                ? `0 0 100px ${rootInfo.glow}, 0 0 150px rgba(255,159,67,0.25)`
                : isRare
                ? `0 0 60px ${rootInfo.glow}`
                : `0 0 40px ${rootInfo.glow}`,
            }}
          >
            {isLegendary && (
              <div className="font-label-caps text-[11px] tracking-[0.3em] text-yellow-400 mb-3 animate-pulse">
                ✦ THƯỢNG PHẨM HUYỀN THOẠI LINH CĂN ✦
              </div>
            )}
            {!isLegendary && isRare && (
              <div className="font-label-caps text-[10px] tracking-[0.2em] mb-3" style={{ color: gradeColor }}>
                ✦ PHẨM CẤP CAO ✦
              </div>
            )}

            <div className="flex items-center justify-center gap-2 mb-2">
              <Star size={14} style={{ color: gradeColor, fill: gradeColor }} className="animate-pulse" />
              <span className="font-label-caps tracking-[0.2em] text-xs" style={{ color: gradeColor }}>
                Linh Căn Khai Mở
              </span>
              <Star size={14} style={{ color: gradeColor, fill: gradeColor }} className="animate-pulse" />
            </div>

            <h2 className="font-headline-xl text-[26px] md:text-[32px] mb-6" style={{ color: gradeColor }}>
              Thiên Đạo Đã Phán Xét!
            </h2>

            {/* Root Display */}
            <div className="relative flex flex-col items-center justify-center mb-6">
              <div
                className="absolute w-52 h-52 rounded-full opacity-25"
                style={{ background: `radial-gradient(circle, ${rootInfo.color}, transparent)`, filter: 'blur(24px)' }}
              />
              <div
                className="relative w-36 h-36 rounded-full flex flex-col items-center justify-center border-2 mb-2"
                style={{
                  borderColor: rootInfo.color,
                  background: `radial-gradient(circle, ${rootInfo.color}22, ${rootInfo.color}08)`,
                  boxShadow: rootInfo.glow,
                  animation: 'float 3s ease-in-out infinite',
                }}
              >
                <div className="text-5xl mb-1">{rootInfo.emoji}</div>
                <div className="font-label-caps text-[9px] tracking-[0.15em]" style={{ color: rootInfo.color }}>
                  LINH CĂN
                </div>
              </div>
            </div>

            {/* Spirit Root Name */}
            <div
              className="font-headline-xl text-[40px] md:text-[52px] leading-none mb-2"
              style={{ color: rootInfo.color, textShadow: rootInfo.glow }}
            >
              {rolledRoot}
            </div>

            {/* Grade Badge */}
            <div
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full border mb-6"
              style={{ borderColor: `${gradeColor}60`, background: `${gradeColor}15` }}
            >
              <span className="font-label-caps text-sm" style={{ color: gradeColor }}>
                {rolledGrade} Phẩm Linh Căn
              </span>
            </div>

            {/* Gender info */}
            <div className="glass-panel rounded-xl p-4 mb-5 flex items-center justify-center gap-3">
              <span className="text-2xl">{selectedGender === 'male' ? '⚔️' : '🌸'}</span>
              <div className="text-left">
                <div className="font-label-caps text-on-surface-variant text-xs">Giới Tính</div>
                <div className="font-headline-md text-[16px] text-on-background">
                  {GENDER_DATA[selectedGender!].label}
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="font-body-md text-on-surface-variant text-sm mb-8 leading-relaxed">
              {getRootDescription(rolledRoot!, rolledGrade!)}
            </p>

            <button
              onClick={onComplete}
              className="energy-pulse ornate-corners w-full py-4 rounded-xl font-headline-md text-[18px] transition-all duration-300 flex items-center justify-center gap-2"
              style={{
                background: `${rootInfo.color}20`,
                border: `1px solid ${rootInfo.color}`,
                color: rootInfo.color,
              }}
            >
              <Zap size={20} />
              Bắt Đầu Tu Luyện!
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes orbit {
          from { transform: translateX(72px) rotate(0deg); }
          to   { transform: translateX(72px) rotate(360deg); }
        }
        @keyframes orbit-r {
          from { transform: translateX(72px) rotate(0deg); }
          to   { transform: translateX(72px) rotate(-360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function getRootDescription(root: string, grade: string): string {
  const gradeDesc =
    grade === 'Thiên' ? '【Thiên Phẩm】' :
    grade === 'Địa'   ? '【Địa Phẩm】'   :
    grade === 'Huyền' ? '【Huyền Phẩm】' : '【Hoàng Phẩm】';
  return `${gradeDesc} ${SPIRIT_ROOT_DESCRIPTIONS[root] ?? 'Linh căn kỳ bí, tiền đồ vô hạn!'}`;
}

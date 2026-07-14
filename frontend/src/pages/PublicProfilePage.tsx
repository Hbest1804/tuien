import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Flame, Sparkles, Mountain, Star, Calendar, Sword, Shield } from 'lucide-react';
import { getPublicProfile, PublicProfile } from '../services/userService';

const GRADE_COLORS: Record<string, { text: string; glow: string; badge: string }> = {
  Thiên: { text: '#f2ca50', glow: 'rgba(242,202,80,0.4)', badge: 'bg-[#f2ca50]/15 border-[#f2ca50]/30 text-[#f2ca50]' },
  Địa:   { text: '#b066ff', glow: 'rgba(176,102,255,0.4)', badge: 'bg-[#b066ff]/15 border-[#b066ff]/30 text-[#b066ff]' },
  Huyền: { text: '#7ed99e', glow: 'rgba(126,217,158,0.4)', badge: 'bg-[#7ed99e]/15 border-[#7ed99e]/30 text-[#7ed99e]' },
  Hoàng: { text: '#f97316', glow: 'rgba(249,115,22,0.3)', badge: 'bg-[#f97316]/15 border-[#f97316]/30 text-[#f97316]' },
};

const REALM_COLORS: Record<string, string> = {
  'Luyện Khí': '#7ed99e',
  'Trúc Cơ': '#f2ca50',
  'Kim Đan': '#f2ca50',
  'Nguyên Anh': '#b066ff',
  'Hóa Thần': '#b066ff',
  'Luyện Hư': '#ff6b6b',
  'Hợp Thể': '#ff6b6b',
  'Đại Thừa': '#ff3333',
  'Độ Kiếp': '#ffffff',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!username) return;
    setIsLoading(true);
    setError('');
    getPublicProfile(username)
      .then((res) => setProfile(res.data.profile))
      .catch((err) => {
        setError(err?.response?.data?.message || 'Không tìm thấy người chơi');
      })
      .finally(() => setIsLoading(false));
  }, [username]);

  const gradeStyle = profile?.spiritRootGrade ? GRADE_COLORS[profile.spiritRootGrade] : null;
  const realmColor = profile?.realm ? (REALM_COLORS[profile.realm] || '#7ed99e') : '#7ed99e';

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start px-4 py-8 md:py-16 relative">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="orb-gold w-[400px] h-[400px] top-[-100px] right-[-100px] opacity-30" />
        <div className="orb-epic w-[300px] h-[300px] bottom-[20%] left-[-80px] opacity-25" style={{ animationDelay: '-6s' }} />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors mb-6 text-sm"
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-[#f2ca50]/20 border-t-[#f2ca50] animate-spin" />
            <span className="text-white/40 text-sm">Đang tải hồ sơ...</span>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🌑</div>
            <h2 className="text-white text-xl font-semibold mb-2">Tu sĩ chưa xuất hiện</h2>
            <p className="text-white/40 text-sm">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-6 px-6 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all text-sm"
            >
              Quay lại
            </button>
          </div>
        )}

        {/* Profile Card */}
        {!isLoading && profile && (
          <div
            className="rounded-2xl overflow-hidden border border-white/10"
            style={{
              background: 'linear-gradient(135deg, rgba(17,19,24,0.95) 0%, rgba(22,24,30,0.95) 100%)',
              boxShadow: gradeStyle
                ? `0 0 60px ${gradeStyle.glow}, 0 20px 60px rgba(0,0,0,0.5)`
                : '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Top gradient bar */}
            <div
              className="h-[3px] w-full"
              style={{
                background: gradeStyle
                  ? `linear-gradient(90deg, transparent, ${gradeStyle.text}, transparent)`
                  : 'linear-gradient(90deg, transparent, #7ed99e, transparent)',
              }}
            />

            {/* Header */}
            <div className="px-6 py-8 text-center relative">
              {/* Avatar */}
              <div className="relative inline-block mb-4">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-4xl border-2 mx-auto"
                  style={{
                    borderColor: gradeStyle?.text || '#7ed99e',
                    background: `radial-gradient(circle at center, ${gradeStyle?.glow || 'rgba(126,217,158,0.15)'}, transparent)`,
                    boxShadow: gradeStyle ? `0 0 30px ${gradeStyle.glow}` : undefined,
                  }}
                >
                  {profile.gender === 'female' ? '🌸' : '⚔️'}
                </div>
                {/* Online indicator (decorative) */}
                <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-[#111318]" />
              </div>

              {/* Name */}
              <h1 className="font-bold text-white text-2xl mb-1 tracking-wide">{profile.username}</h1>

              {/* Spirit root grade badge */}
              {profile.spiritRoot && profile.spiritRootGrade && gradeStyle && (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold mt-1 ${gradeStyle.badge}`}>
                  <Sparkles size={11} />
                  {profile.spiritRootGrade} Phẩm · Linh Căn {profile.spiritRoot}
                </div>
              )}

              {/* Join date */}
              <p className="text-white/30 text-xs mt-3 flex items-center justify-center gap-1.5">
                <Calendar size={11} />
                Nhập môn {formatDate(profile.createdAt)}
              </p>
            </div>

            {/* Stats grid */}
            <div className="px-6 pb-6 grid grid-cols-2 gap-3">
              {/* Realm */}
              <div className="col-span-2 bg-white/3 border border-white/6 rounded-xl p-4 flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `rgba(${realmColor === '#7ed99e' ? '126,217,158' : '242,202,80'},0.1)`, border: `1px solid ${realmColor}40` }}
                >
                  <Flame size={18} style={{ color: realmColor }} />
                </div>
                <div>
                  <div className="text-[11px] text-white/30 uppercase tracking-wider mb-0.5">Cảnh Giới</div>
                  {profile.realm ? (
                    <div className="font-semibold text-base" style={{ color: realmColor }}>
                      {profile.realm}
                      {profile.realmLevel ? ` · Tầng ${profile.realmLevel}` : ''}
                    </div>
                  ) : (
                    <div className="text-white/30 text-sm italic">Chưa tu luyện</div>
                  )}
                </div>
              </div>

              {/* Spirit root */}
              <div className="bg-white/3 border border-white/6 rounded-xl p-4">
                <div className="text-[11px] text-white/30 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Star size={11} /> Linh Căn
                </div>
                {profile.spiritRoot ? (
                  <>
                    <div className="font-bold text-lg" style={{ color: gradeStyle?.text || '#fff' }}>
                      {profile.spiritRoot}
                    </div>
                    <div className="text-[11px] text-white/40 mt-0.5">{profile.spiritRootGrade} Phẩm</div>
                  </>
                ) : (
                  <div className="text-white/30 text-sm italic">Chưa khai linh</div>
                )}
              </div>

              {/* Sect */}
              <div className="bg-white/3 border border-white/6 rounded-xl p-4">
                <div className="text-[11px] text-white/30 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Mountain size={11} /> Tông Môn
                </div>
                {profile.sectName ? (
                  <>
                    <div className="font-bold text-base text-white/90 truncate">{profile.sectName}</div>
                    {profile.sectLevel && (
                      <div className="text-[11px] text-white/40 mt-0.5">Cấp {profile.sectLevel}</div>
                    )}
                  </>
                ) : (
                  <div className="text-white/30 text-sm italic">Tán tu</div>
                )}
              </div>

              {/* Gender */}
              <div className="bg-white/3 border border-white/6 rounded-xl p-4">
                <div className="text-[11px] text-white/30 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User size={11} /> Giới Tính
                </div>
                <div className="font-semibold text-white/80">
                  {profile.gender === 'male' ? '♂ Nam' : profile.gender === 'female' ? '♀ Nữ' : '—'}
                </div>
              </div>

              {/* EXP */}
              <div className="bg-white/3 border border-white/6 rounded-xl p-4">
                <div className="text-[11px] text-white/30 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sword size={11} /> Kinh Nghiệm
                </div>
                <div className="font-semibold text-[#f2ca50]">
                  {profile.totalExp > 0 ? profile.totalExp.toLocaleString() : '—'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

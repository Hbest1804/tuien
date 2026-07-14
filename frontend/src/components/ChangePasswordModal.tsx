import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { changePassword } from '../services/authService';
import { useAuth } from '../context/AuthContext';

interface Props {
  onClose: () => void;
}

export default function ChangePasswordModal({ onClose }: Props) {
  const { logout } = useAuth();
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      return setError('Vui lòng điền đầy đủ thông tin');
    }
    if (form.newPassword.length < 6) {
      return setError('Mật khẩu mới phải có ít nhất 6 ký tự');
    }
    if (form.newPassword !== form.confirmPassword) {
      return setError('Mật khẩu xác nhận không khớp');
    }
    if (form.oldPassword === form.newPassword) {
      return setError('Mật khẩu mới phải khác mật khẩu cũ');
    }

    setIsLoading(true);
    try {
      await changePassword(form.oldPassword, form.newPassword);
      setSuccess(true);
      // Tự động logout sau 2s để buộc đăng nhập lại
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const strengthScore = () => {
    const p = form.newPassword;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strengthColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#22c55e'];
  const strengthLabels = ['', 'Rất yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];
  const score = strengthScore();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-[fadeInUp_0.25s_ease-out]">
        <div
          className="relative rounded-2xl overflow-hidden border border-white/10"
          style={{
            background: 'linear-gradient(135deg, rgba(17,19,24,0.98) 0%, rgba(26,27,34,0.98) 100%)',
            boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(242,202,80,0.08)',
          }}
        >
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f2ca50]/60 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#f2ca50]/10 border border-[#f2ca50]/20 flex items-center justify-center">
                <ShieldCheck size={18} className="text-[#f2ca50]" />
              </div>
              <div>
                <h2 className="font-semibold text-white text-[16px]">Đổi Mật Khẩu</h2>
                <p className="text-[11px] text-white/40 mt-0.5">Bảo mật tài khoản tu luyện</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {success ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-400" />
                </div>
                <h3 className="text-white font-semibold text-[18px] mb-2">Đổi Mật Khẩu Thành Công!</h3>
                <p className="text-white/50 text-sm">Đang đăng xuất để áp dụng thay đổi...</p>
                <div className="mt-4 flex justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-green-500/30 border-t-green-400 animate-spin" />
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Old password */}
                <div>
                  <label className="block text-[12px] font-medium text-white/60 mb-1.5 uppercase tracking-wider">
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type={show.old ? 'text' : 'password'}
                      value={form.oldPassword}
                      onChange={(e) => handleChange('oldPassword', e.target.value)}
                      placeholder="Nhập mật khẩu cũ"
                      className="w-full bg-white/5 border border-white/8 rounded-xl pl-10 pr-10 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#f2ca50]/40 focus:bg-white/8 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => ({ ...s, old: !s.old }))}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {show.old ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="block text-[12px] font-medium text-white/60 mb-1.5 uppercase tracking-wider">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type={show.new ? 'text' : 'password'}
                      value={form.newPassword}
                      onChange={(e) => handleChange('newPassword', e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full bg-white/5 border border-white/8 rounded-xl pl-10 pr-10 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#f2ca50]/40 focus:bg-white/8 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => ({ ...s, new: !s.new }))}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {show.new ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {form.newPassword && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{
                              background: i <= score ? strengthColors[score] : 'rgba(255,255,255,0.08)',
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-[11px]" style={{ color: strengthColors[score] || '#fff' }}>
                        {strengthLabels[score]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-[12px] font-medium text-white/60 mb-1.5 uppercase tracking-wider">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type={show.confirm ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className={`w-full bg-white/5 border rounded-xl pl-10 pr-10 py-3 text-white text-sm placeholder-white/20 focus:outline-none transition-all ${
                        form.confirmPassword && form.confirmPassword !== form.newPassword
                          ? 'border-red-500/50 focus:border-red-500/70'
                          : form.confirmPassword && form.confirmPassword === form.newPassword
                          ? 'border-green-500/40 focus:border-green-500/60'
                          : 'border-white/8 focus:border-[#f2ca50]/40 focus:bg-white/8'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {show.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <AlertCircle size={15} className="text-red-400 shrink-0" />
                    <span className="text-red-300 text-sm">{error}</span>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all text-sm font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-xl bg-[#f2ca50]/10 border border-[#f2ca50]/30 text-[#f2ca50] hover:bg-[#f2ca50]/20 hover:border-[#f2ca50]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-[#f2ca50]/30 border-t-[#f2ca50] animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={15} />
                        Xác Nhận
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

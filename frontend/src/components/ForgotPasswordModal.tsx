import React, { useState, useRef } from 'react';
import { X, Mail, KeyRound, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';
import { forgotPassword, verifyOtp, resetPassword } from '../services/authService';

interface Props {
  onClose: () => void;
  onSuccess?: () => void; // callback sau khi reset thành công (ví dụ: chuyển sang login)
}

type Step = 'email' | 'otp' | 'new-password' | 'done';

export default function ForgotPasswordModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Bước 1: Gửi OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setError('Vui lòng nhập email hợp lệ');
    }
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setStep('otp');
      startResendCountdown();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Lỗi gửi OTP, thử lại sau');
    } finally {
      setIsLoading(false);
    }
  };

  const startResendCountdown = () => {
    setResendCountdown(60);
    const timer = setInterval(() => {
      setResendCountdown((c) => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    setError('');
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      startResendCountdown();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể gửi lại OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // ── OTP Input handlers ──────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    paste.split('').forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    otpRefs.current[Math.min(paste.length, 5)]?.focus();
  };

  // ── Bước 2: Verify OTP ─────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const otpStr = otp.join('');
    if (otpStr.length < 6) {
      return setError('Vui lòng nhập đủ 6 chữ số OTP');
    }
    setIsLoading(true);
    try {
      const res = await verifyOtp(email, otpStr);
      setResetToken(res.data.resetToken);
      setStep('new-password');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'OTP không đúng');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Bước 3: Đặt lại mật khẩu ──────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) return setError('Mật khẩu phải có ít nhất 6 ký tự');
    if (newPassword !== confirmPassword) return setError('Mật khẩu xác nhận không khớp');
    setIsLoading(true);
    try {
      await resetPassword(resetToken, newPassword);
      setStep('done');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Đặt lại mật khẩu thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const STEPS: Step[] = ['email', 'otp', 'new-password'];
  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md animate-[fadeInUp_0.25s_ease-out]">
        <div
          className="relative rounded-2xl overflow-hidden border border-white/10"
          style={{
            background: 'linear-gradient(135deg, rgba(17,19,24,0.98), rgba(26,27,34,0.98))',
            boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(126,217,158,0.08)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#7ed99e]/60 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#7ed99e]/10 border border-[#7ed99e]/20 flex items-center justify-center">
                <KeyRound size={18} className="text-[#7ed99e]" />
              </div>
              <div>
                <h2 className="font-semibold text-white text-[16px]">Quên Mật Khẩu</h2>
                <p className="text-[11px] text-white/40 mt-0.5">Khôi phục quyền truy cập tài khoản</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 transition-all">
              <X size={16} />
            </button>
          </div>

          {/* Step indicator (only when not done) */}
          {step !== 'done' && (
            <div className="px-6 pt-5">
              <div className="flex items-center gap-2">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex items-center gap-2 flex-1">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 shrink-0"
                      style={{
                        background: i < stepIndex ? '#7ed99e' : i === stepIndex ? 'rgba(126,217,158,0.15)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${i <= stepIndex ? '#7ed99e' : 'rgba(255,255,255,0.08)'}`,
                        color: i < stepIndex ? '#0a0b0d' : i === stepIndex ? '#7ed99e' : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {i < stepIndex ? '✓' : i + 1}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className="h-[1px] flex-1 transition-all duration-500"
                        style={{ background: i < stepIndex ? '#7ed99e' : 'rgba(255,255,255,0.06)' }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-1.5">
                {['Nhập email', 'Xác thực OTP', 'Mật khẩu mới'].map((label, i) => (
                  <span key={i} className="text-[10px] transition-colors" style={{ color: i === stepIndex ? '#7ed99e' : 'rgba(255,255,255,0.3)' }}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Body */}
          <div className="p-6 pt-5">

            {/* ── STEP 1: Email ── */}
            {step === 'email' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <p className="text-white/50 text-sm leading-relaxed">
                  Nhập email đã đăng ký. Chúng tôi sẽ gửi mã OTP 6 số để xác thực.
                </p>
                <div>
                  <label className="block text-[12px] font-medium text-white/60 mb-1.5 uppercase tracking-wider">Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      placeholder="your@email.com"
                      autoFocus
                      className="w-full bg-white/5 border border-white/8 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#7ed99e]/40 focus:bg-white/8 transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <AlertCircle size={14} className="text-red-400 shrink-0" />
                    <span className="text-red-300 text-sm">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-[#7ed99e]/10 border border-[#7ed99e]/30 text-[#7ed99e] hover:bg-[#7ed99e]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-semibold flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-[#7ed99e]/30 border-t-[#7ed99e] animate-spin" />Đang gửi...</>
                  ) : (
                    <>Gửi Mã OTP <ArrowRight size={15} /></>
                  )}
                </button>
              </form>
            )}

            {/* ── STEP 2: OTP ── */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <p className="text-white/50 text-sm">
                  Mã OTP đã gửi đến <span className="text-[#7ed99e] font-medium">{email}</span>. Có hiệu lực trong 10 phút.
                </p>

                {/* OTP inputs */}
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      autoFocus={i === 0}
                      className="w-11 h-13 text-center text-[20px] font-bold bg-white/5 border rounded-xl text-white focus:outline-none transition-all"
                      style={{
                        borderColor: digit ? 'rgba(126,217,158,0.5)' : 'rgba(255,255,255,0.08)',
                        background: digit ? 'rgba(126,217,158,0.05)' : 'rgba(255,255,255,0.03)',
                        boxShadow: digit ? '0 0 12px rgba(126,217,158,0.1)' : 'none',
                        height: '52px',
                      }}
                    />
                  ))}
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <AlertCircle size={14} className="text-red-400 shrink-0" />
                    <span className="text-red-300 text-sm">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || otp.join('').length < 6}
                  className="w-full py-3 rounded-xl bg-[#7ed99e]/10 border border-[#7ed99e]/30 text-[#7ed99e] hover:bg-[#7ed99e]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-semibold flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-[#7ed99e]/30 border-t-[#7ed99e] animate-spin" />Đang xác thực...</>
                  ) : (
                    <>Xác Thực OTP <ArrowRight size={15} /></>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCountdown > 0 || isLoading}
                  className="w-full text-sm text-white/40 hover:text-white/70 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={13} />
                  {resendCountdown > 0 ? `Gửi lại sau ${resendCountdown}s` : 'Gửi lại OTP'}
                </button>
              </form>
            )}

            {/* ── STEP 3: New Password ── */}
            {step === 'new-password' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-white/50 text-sm">Nhập mật khẩu mới cho tài khoản của bạn.</p>

                <div>
                  <label className="block text-[12px] font-medium text-white/60 mb-1.5 uppercase tracking-wider">Mật khẩu mới</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                      placeholder="Tối thiểu 6 ký tự"
                      autoFocus
                      className="w-full bg-white/5 border border-white/8 rounded-xl pl-10 pr-10 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#7ed99e]/40 transition-all"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-white/60 mb-1.5 uppercase tracking-wider">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      placeholder="Nhập lại mật khẩu mới"
                      className={`w-full bg-white/5 border rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none transition-all ${
                        confirmPassword && confirmPassword !== newPassword ? 'border-red-500/40' : 'border-white/8 focus:border-[#7ed99e]/40'
                      }`}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <AlertCircle size={14} className="text-red-400 shrink-0" />
                    <span className="text-red-300 text-sm">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-[#7ed99e]/10 border border-[#7ed99e]/30 text-[#7ed99e] hover:bg-[#7ed99e]/20 disabled:opacity-50 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-[#7ed99e]/30 border-t-[#7ed99e] animate-spin" />Đang lưu...</>
                  ) : (
                    <>Đặt Lại Mật Khẩu <ArrowRight size={15} /></>
                  )}
                </button>
              </form>
            )}

            {/* ── DONE ── */}
            {step === 'done' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-400" />
                </div>
                <h3 className="text-white font-semibold text-[18px] mb-2">Thành Công!</h3>
                <p className="text-white/50 text-sm mb-6">Mật khẩu đã được đặt lại. Hãy đăng nhập với mật khẩu mới.</p>
                <button
                  onClick={() => { onSuccess?.(); onClose(); }}
                  className="w-full py-3 rounded-xl bg-[#7ed99e]/10 border border-[#7ed99e]/30 text-[#7ed99e] hover:bg-[#7ed99e]/20 transition-all text-sm font-semibold"
                >
                  Đăng Nhập Ngay
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

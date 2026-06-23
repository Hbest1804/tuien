import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, Star, Mail, Lock } from 'lucide-react';
import { login as apiLogin } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiLogin(form);
      authLogin(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="orb-gold w-[500px] h-[500px] top-[-100px] right-[-150px]" />
        <div className="orb-jade w-[350px] h-[350px] bottom-[-80px] left-[-80px]" style={{ animationDelay: '-8s' }} />
        <div className="orb-epic w-[400px] h-[400px] top-[20%] left-[20%]" style={{ animationDelay: '-4s' }} />
        <div className="star-field absolute inset-0" />
        <div className="ink-wash-overlay absolute inset-0" />
      </div>

      <div className="relative z-10 w-full max-w-md fade-in-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Star size={14} className="text-primary fill-primary animate-pulse" />
            <span className="font-label-caps text-primary tracking-[0.2em]">Tiên Giới</span>
            <Star size={14} className="text-primary fill-primary animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
          <h1 className="font-headline-xl text-[40px] gradient-text-gold leading-tight">Hồi Quy Tiên Giới</h1>
          <p className="font-body-md text-on-surface-variant mt-2">Tiếp tục hành trình tu tiên của bạn</p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-8">

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-error-container/30 border border-error/30 text-on-error-container font-body-md text-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-on-surface-variant text-[11px]">Tiên Thư (Email)</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-surface-container border border-outline-variant rounded-xl pl-10 pr-4 py-3.5 font-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60 focus:shadow-[0_0_0_2px_rgba(242,202,80,0.12)] transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-on-surface-variant text-[11px]">Linh Khế (Mật Khẩu)</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full bg-surface-container border border-outline-variant rounded-xl pl-10 pr-12 py-3.5 font-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60 focus:shadow-[0_0_0_2px_rgba(242,202,80,0.12)] transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-primary transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="energy-pulse ornate-corners mt-2 w-full bg-primary/10 border border-primary text-primary py-4 rounded-xl font-headline-md text-[18px] hover:bg-primary/20 hover:gold-glow-strong transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Zap size={18} /> Thăng Thiên Nhập Giới</>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mystical-divider my-6" />

          {/* Link */}
          <p className="text-center font-body-md text-on-surface-variant text-sm">
            Chưa có linh căn?{' '}
            <Link to="/register" className="text-primary hover:text-primary-fixed-dim font-label-caps tracking-wider transition-colors">
              Nhập Môn →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

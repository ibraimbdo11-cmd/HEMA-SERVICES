import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Logo } from './Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, register, loginWithGoogle, resetPassword } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Password strength calculation (Weak, Medium, Strong)
  const getPasswordStrength = (pass: string): 1 | 2 | 3 | 0 => {
    if (!pass) return 0;
    if (pass.length < 6) return 1;
    const hasNum = /\d/.test(pass);
    const hasLetter = /[a-zA-Z]/.test(pass);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pass);

    if (pass.length >= 8 && hasNum && hasLetter && hasSpecial) {
      return 3;
    }
    if (pass.length >= 6 && (hasNum || hasSpecial)) {
      return 2;
    }
    return 1;
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!email.trim() || !password) {
          throw new Error('يرجى ملء جميع الحقول المطلوبة.');
        }
        await login(email.trim(), password);
        onClose();
      } else if (mode === 'register') {
        if (!name.trim() || !email.trim() || !password) {
          throw new Error('يرجى ملء جميع الحقول المطلوبة.');
        }
        if (password !== confirmPassword) {
          throw new Error('كلمتا المرور غير متطابقتين.');
        }
        if (password.length < 6) {
          throw new Error('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.');
        }
        await register(name.trim(), email.trim(), password);
        onClose();
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          throw new Error('يرجى إدخال البريد الإلكتروني.');
        }
        await resetPassword(email.trim());
        setSuccessMsg('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.');
      }
    } catch (err: any) {
      console.error(err);
      const code = err?.code || '';
      const rawMsg = err?.message || '';
      let msg = 'حدث خطأ أثناء تنفيذ العملية.';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        rawMsg.includes('invalid-credential') ||
        rawMsg.includes('wrong-password')
      ) {
        msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      } else if (code === 'auth/email-already-in-use' || rawMsg.includes('email-already-in-use')) {
        msg = 'البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.';
      } else if (code === 'auth/user-not-found' || rawMsg.includes('user-not-found')) {
        msg = 'لم يتم العثور على حساب مرتبط بهذا البريد.';
      } else if (code === 'auth/weak-password' || rawMsg.includes('weak-password')) {
        msg = 'كلمة المرور ضعيفة جداً. يجب أن تحتوي على 6 خانات على الأقل.';
      } else if (code === 'auth/network-request-failed' || rawMsg.includes('network-request-failed')) {
        msg = 'تعذر الاتصال بالشبكة، يرجى التأكد من اتصالك بالإنترنت.';
      } else if (code === 'auth/too-many-requests' || rawMsg.includes('too-many-requests')) {
        msg = 'تم إيقاف المحاولات مؤقتاً لكثرة الطلبات، يرجى الانتظار دقيقة والمحاولة مجدداً.';
      } else if (err.message && !err.message.includes('auth/')) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.error(err);
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user')
      ) {
        return;
      }
      if (err?.code === 'auth/popup-blocked') {
        setError('تم حظر النافذة المنبثقة من قِبل المتصفح. يرجى السماح بالنوافذ المنبثقة.');
        return;
      }
      setError('تعذر تسجيل الدخول بواسطة Google. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150 text-right font-cairo"
    >
      <div className="w-full max-w-md bg-[#0d121f] border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          id="close-auth-modal-btn"
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Titles */}
        <div className="text-center mb-6 space-y-2">
          <div className="flex justify-center mb-3">
            <Logo size="sm" layout="stacked" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 font-cairo tracking-tight">
            {mode === 'login' && 'تسجيل الدخول'}
            {mode === 'register' && 'إنشاء حساب جديد'}
            {mode === 'forgot' && 'استعادة كلمة المرور'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium font-cairo">
            {mode === 'login' && 'سجّل الدخول بحسابك للوصول لخدماتك وطلباتك'}
            {mode === 'register' && 'انضم إلى HEMA SERVICES لطلب وإدارة خدماتك البرمجية'}
            {mode === 'forgot' && 'أدخل بريدك الإلكتروني لإرسال رابط استعادة كلمة المرور.'}
          </p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200 font-cairo">
                الاسم بالكامل
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسمك الكامل"
                  className="w-full h-11 sm:h-12 bg-[#121824] border border-white/[0.08] focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 rounded-xl pr-10 pl-3.5 text-sm font-medium font-cairo text-slate-100 placeholder:text-slate-500 outline-none transition-all disabled:opacity-60"
                />
                <User className="w-4 h-4 text-slate-500 absolute top-3.5 sm:top-4 right-3.5" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-200 font-cairo">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-11 sm:h-12 bg-[#121824] border border-white/[0.08] focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 rounded-xl pr-10 pl-3.5 text-sm font-medium font-cairo text-slate-100 placeholder:text-slate-500 outline-none transition-all disabled:opacity-60"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute top-3.5 sm:top-4 right-3.5" />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 font-cairo">
                  كلمة المرور
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setError(null);
                      setMode('forgot');
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-bold font-cairo hover:underline cursor-pointer disabled:opacity-50"
                  >
                    نسيت كلمة المرور؟
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 sm:h-12 bg-[#121824] border border-white/[0.08] focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 rounded-xl pr-10 pl-10 text-sm font-medium font-cairo text-slate-100 placeholder:text-slate-500 outline-none transition-all disabled:opacity-60"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute top-3.5 sm:top-4 right-3.5" />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-3.5 sm:top-4 left-3 text-slate-400 hover:text-slate-200 transition-colors p-0.5 cursor-pointer disabled:opacity-50"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {mode === 'register' && password && (
                <div className="pt-1.5 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium font-cairo">
                    <span>قوة كلمة المرور:</span>
                    <span className="font-bold text-slate-200">
                      {strength === 1 && 'ضعيفة'}
                      {strength === 2 && 'متوسطة'}
                      {strength === 3 && 'قوية وآمنة'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 h-1.5">
                    <div
                      className={`h-full rounded-full transition-colors ${
                        strength >= 1
                          ? strength === 1
                            ? 'bg-rose-500'
                            : strength === 2
                            ? 'bg-amber-400'
                            : 'bg-emerald-500'
                          : 'bg-slate-800'
                      }`}
                    />
                    <div
                      className={`h-full rounded-full transition-colors ${
                        strength >= 2
                          ? strength === 2
                            ? 'bg-amber-400'
                            : 'bg-emerald-500'
                          : 'bg-slate-800'
                      }`}
                    />
                    <div
                      className={`h-full rounded-full transition-colors ${
                        strength === 3 ? 'bg-emerald-500' : 'bg-slate-800'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200 font-cairo">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 sm:h-12 bg-[#121824] border border-white/[0.08] focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 rounded-xl pr-10 pl-10 text-sm font-medium font-cairo text-slate-100 placeholder:text-slate-500 outline-none transition-all disabled:opacity-60"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute top-3.5 sm:top-4 right-3.5" />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute top-3.5 sm:top-4 left-3 text-slate-400 hover:text-slate-200 transition-colors p-0.5 cursor-pointer disabled:opacity-50"
                  title={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  aria-label={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={loading}
            id="auth-primary-submit-btn"
            className="w-full h-11 sm:h-12 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-extrabold text-sm sm:text-base font-cairo transition-all duration-200 shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/35 disabled:opacity-50 mt-3 cursor-pointer whitespace-nowrap"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>
              {mode === 'login' && 'تسجيل الدخول'}
              {mode === 'register' && 'إنشاء حساب جديد'}
              {mode === 'forgot' && 'إرسال رابط الاستعادة'}
            </span>
          </button>
        </form>

        {/* Google Sign-in */}
        {mode !== 'forgot' && (
          <div className="space-y-4">
            <div className="relative my-4 flex items-center justify-center">
              <div className="w-full border-t border-white/[0.08]"></div>
              <span className="absolute px-3 bg-[#0d121f] text-xs text-slate-400 font-bold font-cairo">
                أو
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              id="auth-google-btn"
              className="w-full h-11 sm:h-12 flex items-center justify-center gap-2.5 rounded-2xl bg-[#121824] hover:bg-[#172030] border border-white/[0.08] hover:border-white/[0.16] text-slate-100 text-xs sm:text-sm font-extrabold font-cairo transition-all duration-200 active:scale-[0.98] cursor-pointer whitespace-nowrap"
            >
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>المتابعة باستخدام Google</span>
            </button>
          </div>
        )}

        {/* Footer Navigation Links */}
        <div className="mt-6 text-center text-xs sm:text-sm text-slate-400 font-medium font-cairo pt-4 border-t border-slate-800/80">
          {mode === 'login' && (
            <p>
              ليس لديك حساب؟{' '}
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setError(null);
                  setMode('register');
                }}
                className="text-emerald-400 hover:text-emerald-300 hover:underline font-bold mr-1 cursor-pointer disabled:opacity-50"
              >
                إنشاء حساب جديد
              </button>
            </p>
          )}

          {mode === 'register' && (
            <p>
              لديك حساب بالفعل؟{' '}
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setError(null);
                  setMode('login');
                }}
                className="text-emerald-400 hover:text-emerald-300 hover:underline font-bold mr-1 cursor-pointer disabled:opacity-50"
              >
                تسجيل الدخول
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <p>
              تذكرت كلمة المرور؟{' '}
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setError(null);
                  setMode('login');
                }}
                className="text-emerald-400 hover:text-emerald-300 hover:underline font-bold cursor-pointer disabled:opacity-50"
              >
                العودة لتسجيل الدخول
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

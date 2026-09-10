import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import {
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  ArrowRight,
  Terminal,
  Layers,
  Cpu,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';

export const AuthGatePage: React.FC = () => {
  const { login, register, loginWithGoogle, resetPassword } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
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

  // 3-bar password strength calculation (0 to 3)
  const calculateStrength = (pass: string): number => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 8 && /[A-Z0-9]/.test(pass)) score++;
    if (pass.length >= 10 && /[^A-Za-z0-9]/.test(pass)) score++;
    return Math.min(score, 3);
  };

  const strength = calculateStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    try {
      setLoading(true);
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('كلمة المرور وتأكيد كلمة المرور غير متطابقين.');
          return;
        }
        if (password.length < 6) {
          setError('يجب أن تتكون كلمة المرور من 6 خانات على الأقل.');
          return;
        }
      }

      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        await register(name, email, password);
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMsg('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح.');
      }
    } catch (err: any) {
      console.error(err);
      const code = err?.code || '';
      const message = err?.message || '';
      let msg = 'حدث خطأ أثناء تنفيذ طلبك، يرجى إعادة المحاولة.';
      if (
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential' ||
        message.includes('invalid-credential') ||
        message.includes('wrong-password')
      ) {
        msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      } else if (code === 'auth/email-already-in-use' || message.includes('email-already-in-use')) {
        msg = 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.';
      } else if (code === 'auth/weak-password' || message.includes('weak-password')) {
        msg = 'كلمة المرور ضعيفة جداً. يجب أن تحتوي على 6 خانات على الأقل.';
      } else if (code === 'auth/invalid-email' || message.includes('invalid-email')) {
        msg = 'صيغة البريد الإلكتروني غير صالحة.';
      } else if (code === 'auth/network-request-failed' || message.includes('network-request-failed')) {
        msg = 'تعذر الاتصال بالشبكة، يرجى التأكد من اتصال الإنترنت.';
      } else if (code === 'auth/too-many-requests' || message.includes('too-many-requests')) {
        msg = 'تم إيقاف المحاولات مؤقتاً بسبب تكرار الطلب، يرجى الانتظار دقيقة والمحاولة مجدداً.';
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
    setSuccessMsg(null);
    try {
      setLoading(true);
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user')
      ) {
        // User closed or dismissed the popup window voluntarily - do not display an error
        return;
      }
      if (err?.code === 'auth/popup-blocked') {
        setError('تم حظر النافذة المنبثقة من قِبل المتصفح. يرجى السماح بالنوافذ المنبثقة والمحاولة مجدداً.');
        return;
      }
      setError('تعذر تسجيل الدخول بواسطة Google. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-4 sm:p-6 lg:p-10 text-right font-cairo selection:bg-emerald-500/20 selection:text-emerald-200">
      {/* Background Subtle Architectural Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.035]" style={{
        backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
        backgroundSize: '48px 48px'
      }} />

      {/* Main Container */}
      <div className="w-full max-w-5xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Brand Showcase Side (Visible on Desktop) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between h-full p-8 rounded-3xl bg-[#0c1019] border border-white/[0.07] relative overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>DIGITAL AGENCY & SOFTWARE PLATFORM</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl xl:text-4xl font-black text-slate-100 font-cairo tracking-tight leading-snug">
                تطوير الحلول الرقمية والبرمجية بأعلى معايير الجودة
              </h1>
              <p className="text-sm text-slate-300 font-medium font-cairo leading-relaxed max-w-md">
                منصة متكاملة لإدارة وطلب خدمات البرمجة وتطوير الويب والتطبيقات مع متابعة حية لمراحل تنفيذ طلبك وخدمة عملاء مباشرة.
              </p>
            </div>
          </div>

          {/* Center Digital Representation Matrix */}
          <div className="relative z-10 my-8 p-5 rounded-2xl bg-[#080b12] border border-white/[0.06] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-xs">
              <span className="text-slate-400 font-mono">SYSTEM SPECIFICATIONS</span>
              <span className="text-emerald-400 font-mono font-semibold">ONLINE • 99.9%</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/[0.04] space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-bold font-cairo">
                  <Terminal className="w-4 h-4" />
                  <span>تطوير مخصص</span>
                </div>
                <p className="text-xs text-slate-400 font-medium font-cairo">بناء وتطوير واجهات وتطبيقات متكاملة</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/[0.04] space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-bold font-cairo">
                  <Layers className="w-4 h-4" />
                  <span>متابعة حية</span>
                </div>
                <p className="text-xs text-slate-400 font-medium font-cairo">شات ومسار زمني شفاف لكل مرحلة</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/[0.04] space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-bold font-cairo">
                  <Cpu className="w-4 h-4" />
                  <span>أمان وموثوقية</span>
                </div>
                <p className="text-xs text-slate-400 font-medium font-cairo">تأكيد الإيصالات وحماية المدفوعات</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/[0.04] space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-bold font-cairo">
                  <Sparkles className="w-4 h-4" />
                  <span>دعم مباشر</span>
                </div>
                <p className="text-xs text-slate-400 font-medium font-cairo">خدمة عملاء صوتية ومكتوبة 24/7</p>
              </div>
            </div>
          </div>

          {/* Bottom Quality Footnote */}
          <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-white/[0.05]">
            <span className="font-mono">HEMA SERVICES © 2026</span>
            <div className="flex items-center gap-1.5 text-slate-400 font-medium font-cairo">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>نظام موثوق ومحمي</span>
            </div>
          </div>
        </div>

        {/* Auth Form Side (Responsive on all devices) */}
        <div className="lg:col-span-6 flex justify-center w-full">
          <div className="w-full max-w-[420px] bg-[#0c1019] border border-white/[0.07] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 space-y-6">
            
            {/* Brand Logo & Heading */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Logo iconPosition="right" />
                {mode !== 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessMsg(null);
                      setMode('login');
                    }}
                    className="text-xs text-slate-300 hover:text-emerald-400 transition-colors flex items-center gap-1 font-bold font-cairo"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>تسجيل الدخول</span>
                  </button>
                )}
              </div>

              <div>
                <h2 className="text-2xl sm:text-[28px] font-black text-slate-100 tracking-tight font-cairo leading-snug">
                  {mode === 'login' && 'تسجيل الدخول'}
                  {mode === 'register' && 'إنشاء حساب جديد'}
                  {mode === 'forgot' && 'استعادة كلمة المرور'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1.5 font-medium font-cairo leading-relaxed">
                  {mode === 'login' && 'سجل الدخول إلى حسابك لمتابعة طلباتك وخدماتك.'}
                  {mode === 'register' && 'أنشئ حسابك للوصول إلى كافة الخدمات البرمجية.'}
                  {mode === 'forgot' && 'أدخل بريدك الإلكتروني لإرسال رابط إعادة تعيين كلمة المرور.'}
                </p>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-center gap-2.5 font-medium font-cairo">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Success Notification */}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5 font-medium font-cairo">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="leading-relaxed">{successMsg}</span>
              </div>
            )}

            {/* Form */}
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
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="أدخل اسمك الكامل"
                      className="w-full h-12 bg-[#121824] border border-white/[0.08] focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 rounded-xl pr-10 pl-3.5 text-sm font-medium font-cairo text-slate-100 placeholder:text-slate-500 outline-none transition-all"
                    />
                    <User className="w-4 h-4 text-slate-500 absolute top-4 right-3.5" />
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full h-12 bg-[#121824] border border-white/[0.08] focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 rounded-xl pr-10 pl-3.5 text-sm font-medium font-cairo text-slate-100 placeholder:text-slate-500 outline-none transition-all"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute top-4 right-3.5" />
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
                        onClick={() => {
                          setError(null);
                          setSuccessMsg(null);
                          setMode('forgot');
                        }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-bold font-cairo cursor-pointer"
                      >
                        نسيت كلمة المرور؟
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-12 bg-[#121824] border border-white/[0.08] focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 rounded-xl pr-10 pl-10 text-sm font-medium font-cairo text-slate-100 placeholder:text-slate-500 outline-none transition-all"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute top-4 right-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-3.5 left-3 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
                      title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* 3-bar password strength meter for register mode */}
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
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-12 bg-[#121824] border border-white/[0.08] focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 rounded-xl pr-10 pl-10 text-sm font-medium font-cairo text-slate-100 placeholder:text-slate-500 outline-none transition-all"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute top-4 right-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute top-3.5 left-3 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
                      title={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      aria-label={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Primary Button */}
              <button
                type="submit"
                disabled={loading}
                id="auth-gate-submit-btn"
                className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:translate-y-px text-slate-950 font-bold text-sm sm:text-base font-cairo transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 mt-4 cursor-pointer"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {mode === 'login' && 'تسجيل الدخول'}
                  {mode === 'register' && 'إنشاء حساب جديد'}
                  {mode === 'forgot' && 'إرسال رابط الاستعادة'}
                </span>
              </button>
            </form>

            {/* Google Authentication & Divider */}
            {mode !== 'forgot' && (
              <div className="space-y-4">
                <div className="relative flex items-center justify-center">
                  <div className="w-full border-t border-white/[0.08]"></div>
                  <span className="absolute px-3 bg-[#0c1019] text-xs text-slate-400 font-bold font-cairo">
                    أو
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  id="auth-gate-google-btn"
                  className="w-full h-12 flex items-center justify-center gap-2.5 rounded-xl bg-[#121824] hover:bg-[#172030] border border-white/[0.08] hover:border-white/[0.16] text-slate-100 text-xs sm:text-sm font-bold font-cairo transition-all active:translate-y-px cursor-pointer"
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

            {/* Switch Mode Prompt */}
            <div className="pt-2 text-center text-xs sm:text-sm text-slate-400 font-medium font-cairo">
              {mode === 'login' && (
                <p>
                  ليس لديك حساب؟{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessMsg(null);
                      setMode('register');
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-4 mr-1 cursor-pointer"
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
                    onClick={() => {
                      setError(null);
                      setSuccessMsg(null);
                      setMode('login');
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-4 mr-1 cursor-pointer"
                  >
                    تسجيل الدخول
                  </button>
                </p>
              )}

              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMsg(null);
                    setMode('login');
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-4 cursor-pointer"
                >
                  العودة لتسجيل الدخول
                </button>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ServiceItem } from '../types';
import { ServiceCard } from '../components/ServiceCard';
import { ServiceCardSkeleton } from '../components/ui/Skeleton';
import { useScrollReveal } from '../lib/useScrollReveal';
import { Search, ArrowLeft, Layers, ShieldCheck, Zap } from 'lucide-react';

interface HomePageProps {
  services: ServiceItem[];
  loading: boolean;
  onRequestService: (service: ServiceItem) => void;
  onViewService?: (id: string) => void;
  onNavigate: (view: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  services,
  loading,
  onRequestService,
  onViewService,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  useScrollReveal();

  const filteredServices = services.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      s.title.toLowerCase().includes(q) ||
      s.shortDescription.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full text-right overflow-x-hidden">
      {/* Hero Section */}
      <section
        id="hero-section"
        className="relative pt-20 pb-24 sm:pt-32 sm:pb-36 overflow-hidden border-b border-white/[0.08] bg-[#07090e]"
      >
        {/* Background Network Layer Container */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
          {/* Ambient Emerald Radial Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[1000px] h-[400px] sm:h-[600px] bg-emerald-500/[0.14] blur-[130px] rounded-full" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_20%,rgba(16,185,129,0.18),transparent_75%)]" />

          {/* SVG Vector Green Grid with Luminous Intersections & Faded Edges */}
          <svg
            className="absolute inset-0 w-full h-full text-emerald-500/[0.18]"
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
          >
            <defs>
              {/* Grid pattern */}
              <pattern
                id="hero-grid-pattern"
                width="48"
                height="48"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 48 0 L 0 0 0 48"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
                {/* Intersection Glowing Point */}
                <circle cx="48" cy="0" r="1.5" fill="#34d399" opacity="0.85" />
                <circle cx="0" cy="48" r="1.5" fill="#34d399" opacity="0.85" />
              </pattern>

              {/* Multi-stop Seamless Radial & Linear Mask: Grid fades out whisper-softly at all borders and bottom */}
              <radialGradient id="hero-grid-radial" cx="50%" cy="32%" r="62%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                <stop offset="35%" stopColor="#ffffff" stopOpacity="0.6" />
                <stop offset="65%" stopColor="#ffffff" stopOpacity="0.25" />
                <stop offset="85%" stopColor="#ffffff" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>

              <linearGradient id="hero-grid-bottom-fade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="70%" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>

              <mask id="hero-grid-mask">
                <rect width="100%" height="100%" fill="url(#hero-grid-radial)" />
                <rect width="100%" height="100%" fill="url(#hero-grid-bottom-fade)" />
              </mask>
            </defs>

            {/* Render Grid filled with mask */}
            <rect
              width="100%"
              height="100%"
              fill="url(#hero-grid-pattern)"
              mask="url(#hero-grid-mask)"
            />
          </svg>

          {/* Gentle ambient gradient fades around outer edges */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#07090e]/40 via-transparent to-[#07090e] pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#07090e] via-[#07090e]/70 to-transparent pointer-events-none" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8"
          >
            {/* Main Heading: Strictly in 1 single unified line */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-[3.6rem] font-black text-slate-50 font-cairo tracking-tight leading-[1.2] drop-shadow-sm flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              <span className="whitespace-nowrap">خدمات برمجة متخصصة</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 whitespace-nowrap">
                لتنفيذ أفكارك الرقمية
              </span>
            </h1>

            {/* Supporting Subtext */}
            <p className="text-sm sm:text-base md:text-lg text-slate-300 font-medium font-cairo leading-relaxed max-w-2xl sm:max-w-3xl mx-auto px-2">
              لتحويل أفكارك الرقمية إلى حلول برمجية متكاملة مع متابعة مستمرة وتنفيذ دقيق.
            </p>

            {/* Hero Actions */}
            <div className="pt-2 sm:pt-4 flex flex-row items-center justify-center gap-3 sm:gap-5 w-full max-w-lg mx-auto">
              <button
                id="hero-explore-services-btn"
                onClick={() => {
                  const el = document.getElementById('services-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group h-12 sm:h-14 flex-1 sm:flex-initial px-5 sm:px-9 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-extrabold text-sm sm:text-lg font-cairo transition-all duration-200 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center justify-center gap-2 sm:gap-2.5 cursor-pointer whitespace-nowrap"
              >
                <span>استعرض الخدمات</span>
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:-translate-x-1" />
              </button>

              <button
                id="hero-about-platform-btn"
                onClick={() => onNavigate('about')}
                className="h-12 sm:h-14 flex-1 sm:flex-initial px-5 sm:px-9 rounded-2xl bg-[#121826]/90 hover:bg-[#1a2336] border border-white/[0.12] hover:border-emerald-500/40 text-slate-100 hover:text-white font-extrabold text-sm sm:text-lg font-cairo transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center justify-center backdrop-blur-sm shadow-md active:scale-[0.98]"
              >
                عن المنصة
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Search Section with subtle viewport fade */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        id="search-section"
        className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-2xl mx-auto space-y-2.5">
          <label htmlFor="service-search-input" className="block text-sm sm:text-base font-bold text-slate-200 font-cairo">
            ابحث عن خدمة
          </label>
          <div className="relative">
            <input
              type="text"
              id="service-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="اكتب اسم الخدمة أو متطلباتك البرمجية..."
              className="w-full h-12 bg-[#0d121c] border border-white/[0.08] focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 rounded-xl pr-11 pl-12 text-sm sm:text-base font-medium font-cairo text-slate-100 placeholder-slate-500 outline-none transition-all shadow-sm"
            />
            <Search className="w-5 h-5 text-slate-500 absolute top-3.5 right-3.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3.5 top-3 text-xs font-bold font-cairo text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 cursor-pointer"
              >
                مسح
              </button>
            )}
          </div>
        </div>
      </motion.section>

      {/* Services Section with subtle viewport fade */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        id="services-section"
        className="py-6 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24"
      >
        {/* Section Header */}
        <div className="mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-100 font-cairo tracking-tight">
            الخدمات المتاحة
          </h2>
          <p className="text-sm sm:text-base text-slate-300 font-medium font-cairo">
            اختر الخدمة المناسبة لطلبها والبدء في تنفيذ فكرتك فور تأكيد الطلب.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <ServiceCardSkeleton key={n} />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[#0d121c] border border-white/[0.07] rounded-2xl">
            <p className="text-sm font-semibold text-slate-300 mb-2">
              لم يتم العثور على خدمات مطابقة لبحثك.
            </p>
            <p className="text-xs text-slate-500">
              جرب البحث بكلمات أخرى أو تصفح جميع الخدمات المتاحة.
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 rounded-xl bg-[#121824] border border-white/[0.08] text-emerald-400 text-xs font-semibold hover:bg-[#172030] transition-colors"
              >
                عرض كافة الخدمات
              </button>
            )}
          </div>
        ) : (
          /* Mobile: Exactly 1 card per row. Tablet: 2 cards per row. Desktop: 4 cards per row. */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onRequest={onRequestService}
              />
            ))}
          </div>
        )}

        {/* Value features strip with subtle reveal */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 pt-12 border-t border-white/[0.06] grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          <div className="p-6 rounded-2xl bg-[#0d121c] border border-white/[0.07] flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-100">أعلى معايير الجودة والأداء</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                تنفيذ برمجي دقيق بالاعتماد على أفضل الممارسات الهندسية وضمان سرعة وأمان النظام.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0d121c] border border-white/[0.07] flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-100">حماية وأمان كامل</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                مراجعة تفصيلية لكل طلب وتحقق دقيق من المعاملات قبل البدء والتسليم الفعلي.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0d121c] border border-white/[0.07] flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-100">متابعة تفصيلية ودعم فني</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                محادثة مخصصة لكل طلب لمتابعة مراحل التنفيذ وإرسال الملفات والتسجيلات الصوتية.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.section>
    </div>
  );
};

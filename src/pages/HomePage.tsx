import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ServiceItem } from '../types';
import { ServiceCard } from '../components/ServiceCard';
import { ServiceCardSkeleton } from '../components/ui/Skeleton';
import { FadeInCard } from '../components/FadeInCard';
import { HeroCodeNetwork } from '../components/HeroCodeNetwork';
import { Search, X, ArrowLeft, ChevronDown, Layers, ShieldCheck, Zap } from 'lucide-react';

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
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  const filteredServices = services.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      s.title.toLowerCase().includes(q) ||
      s.shortDescription.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  });

  const scrollToServices = () => {
    const el = document.getElementById('services-section');
    if (el) {
      const header = document.getElementById('global-header');
      const headerHeight = header ? header.offsetHeight : 64;
      const targetOffset = 20;
      const elementPosition = el.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - headerHeight - targetOffset;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }
  };

  return (
    <div className="w-full text-right overflow-x-hidden">
      {/* Hero Section — Fills initial viewport cleanly on both mobile and desktop */}
      <section
        id="hero-section"
        className="relative min-h-[calc(100vh-4rem)] min-h-[calc(100dvh-4rem)] flex flex-col justify-between items-center overflow-hidden border-b border-white/[0.08] bg-[#07090e]"
      >
        {/* Animated Code Network Background Layer */}
        <HeroCodeNetwork />

        {/* Top spacer to balance layout vertically */}
        <div className="w-full h-4 sm:h-8 shrink-0" aria-hidden="true" />

        {/* Main Hero Content (Headline, Description, CTAs) */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full text-center py-6 sm:py-8 my-auto">
          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: 'easeOut' }}
            className="text-2xl sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-[3.6rem] font-black text-slate-50 font-cairo tracking-tight leading-[1.25] drop-shadow-sm flex items-center justify-center gap-2 sm:gap-3 flex-wrap"
          >
            <span className="whitespace-nowrap">خدمات برمجة متخصصة</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 whitespace-nowrap">
              لتنفيذ أفكارك الرقمية
            </span>
          </motion.h1>

          {/* Supporting Subtext */}
          <motion.p
            initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.4,
              delay: prefersReducedMotion ? 0 : 0.12,
              ease: 'easeOut',
            }}
            className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-slate-300 font-medium font-cairo leading-relaxed max-w-2xl sm:max-w-3xl mx-auto px-2"
          >
            لتحويل أفكارك الرقمية إلى حلول برمجية متكاملة مع متابعة مستمرة وتنفيذ دقيق.
          </motion.p>

          {/* Hero Actions */}
          <motion.div
            initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.4,
              delay: prefersReducedMotion ? 0 : 0.24,
              ease: 'easeOut',
            }}
            className="mt-6 sm:mt-8 flex flex-row items-center justify-center gap-3 sm:gap-5 w-full max-w-lg mx-auto"
          >
            <button
              id="hero-explore-services-btn"
              type="button"
              onClick={scrollToServices}
              className="group h-12 sm:h-14 flex-1 sm:flex-initial px-5 sm:px-9 rounded-[15px] bg-gradient-to-b from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 active:scale-[0.985] text-slate-950 font-extrabold text-sm sm:text-base md:text-lg font-cairo transition-all duration-300 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.45),inset_0_1px_0_rgba(255,255,255,0.24)] hover:shadow-[0_14px_36px_-10px_rgba(16,185,129,0.55),inset_0_1px_0_rgba(255,255,255,0.28)] flex items-center justify-center gap-2 sm:gap-2.5 cursor-pointer whitespace-nowrap relative overflow-hidden before:absolute before:inset-y-0 before:-left-1/2 before:w-1/3 before:skew-x-[-18deg] before:bg-white/20 before:blur-sm before:transition-transform before:duration-700 before:translate-x-0 group-hover:before:translate-x-[420%]"
            >
              <span>استعرض الخدمات</span>
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:-translate-x-1" />
            </button>

            <button
              id="hero-about-platform-btn"
              type="button"
              onClick={() => onNavigate('about')}
              className="h-12 sm:h-14 flex-1 sm:flex-initial px-5 sm:px-9 rounded-[15px] bg-[#0e141f]/80 hover:bg-[#151d2b] border border-white/[0.11] hover:border-emerald-400/35 text-slate-100 hover:text-white font-extrabold text-sm sm:text-base md:text-lg font-cairo transition-all duration-300 cursor-pointer whitespace-nowrap flex items-center justify-center backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] active:scale-[0.985]"
            >
              <span>عن المنصة</span>
            </button>
          </motion.div>
        </div>

        {/* Scroll Indicator at the bottom of Hero Viewport */}
        <div className="relative z-10 pb-4 sm:pb-6 pt-2 shrink-0">
          <button
            type="button"
            onClick={scrollToServices}
            className="inline-flex flex-col items-center gap-1 text-slate-400 hover:text-emerald-400 text-xs font-cairo font-medium transition-colors cursor-pointer select-none group p-2 rounded-xl hover:bg-white/[0.03]"
            aria-label="الانتقال إلى الخدمات المتاحة"
          >
            <span className="text-[11px] sm:text-xs text-slate-400 group-hover:text-emerald-300 transition-colors">
              استكشف الخدمات
            </span>
            <ChevronDown className="w-4 h-4 text-emerald-400/80 group-hover:text-emerald-300 transition-transform group-hover:translate-y-0.5" />
          </button>
        </div>
      </section>

      {/* Services Section with integrated search and clear hierarchy */}
      <section
        id="services-section"
        className="scroll-mt-24 pt-6 sm:pt-8 pb-20 sm:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {/* Section Header */}
        <div className="mb-6 sm:mb-8 text-center sm:text-right space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-100 font-cairo tracking-tight">
            الخدمات المتاحة
          </h2>
          <p className="text-sm sm:text-base text-slate-300 font-medium font-cairo">
            اختر الخدمة المناسبة لطلبها والبدء في تنفيذ فكرتك فور تأكيد الطلب.
          </p>
        </div>

        {/* Integrated Service Search Box */}
        <div className="mb-8 sm:mb-10 max-w-2xl ml-auto">
          <div className="relative">
            <input
              type="text"
              id="service-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchQuery('');
              }}
              placeholder="ابحث باسم الخدمة أو متطلباتك البرمجية..."
              className="w-full h-12 bg-[#0d121c] border border-white/[0.08] focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl pr-11 pl-12 text-sm sm:text-base font-medium font-cairo text-slate-100 placeholder-slate-500 outline-none transition-all shadow-sm"
              aria-label="البحث عن خدمة"
            />
            <Search className="w-5 h-5 text-slate-500 absolute top-3.5 right-3.5 pointer-events-none" />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2.5 text-xs font-bold font-cairo text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                title="مسح البحث (Esc)"
                aria-label="مسح البحث"
              >
                <span>مسح</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Result Feedback */}
          {searchQuery.trim() && (
            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 font-cairo px-1">
              <span>
                {filteredServices.length > 0
                  ? `تم العثور على ${filteredServices.length} من أصل ${services.length} خدمة`
                  : 'لا توجد خدمات مطابقة لبحثك'}
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-emerald-400 hover:underline cursor-pointer"
              >
                إعادة ضبط
              </button>
            </div>
          )}
        </div>

        {/* Loading / Empty / Grid States */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <ServiceCardSkeleton key={n} />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-14 sm:py-16 px-4 bg-[#0d121c] border border-white/[0.08] rounded-2xl max-w-xl mx-auto space-y-3 shadow-lg">
            <p className="text-base font-bold text-slate-200 font-cairo">
              لم يتم العثور على خدمات مطابقة لبحثك
            </p>
            <p className="text-xs sm:text-sm text-slate-400 font-medium font-cairo">
              تأكد من كتابة الكلمات بشكل صحيح أو تصفح كافة الخدمات المتاحة.
            </p>
            {searchQuery && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-bold font-cairo hover:bg-emerald-500/25 transition-colors cursor-pointer"
                >
                  عرض كافة الخدمات
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Mobile: Exactly 1 card per row. Tablet: 2 cards per row. Desktop: 4 cards per row. */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {filteredServices.map((service) => (
              <FadeInCard key={service.id} id={`fade-card-${service.id}`}>
                <ServiceCard
                  service={service}
                  onRequest={onRequestService}
                  onView={onViewService}
                />
              </FadeInCard>
            ))}
          </div>
        )}

        {/* Value / Trust information at the bottom of the section */}
        <div className="mt-16 pt-12 border-t border-white/[0.06] grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-[#0d121c] border border-white/[0.07] flex items-start gap-4 shadow-sm">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-100 font-cairo">
                أعلى معايير الجودة والأداء
              </h4>
              <p className="text-xs text-slate-300 font-medium font-cairo leading-relaxed">
                تنفيذ برمجي دقيق بالاعتماد على أفضل الممارسات الهندسية وضمان سرعة وأمان النظام.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0d121c] border border-white/[0.07] flex items-start gap-4 shadow-sm">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-100 font-cairo">
                حماية وأمان كامل
              </h4>
              <p className="text-xs text-slate-300 font-medium font-cairo leading-relaxed">
                مراجعة تفصيلية لكل طلب وتحقق دقيق من المعاملات قبل البدء والتسليم الفعلي.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0d121c] border border-white/[0.07] flex items-start gap-4 shadow-sm">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-100 font-cairo">
                متابعة تفصيلية ودعم فني
              </h4>
              <p className="text-xs text-slate-300 font-medium font-cairo leading-relaxed">
                محادثة مخصصة لكل طلب لمتابعة مراحل التنفيذ وإرسال الملفات والتسجيلات الصوتية.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};


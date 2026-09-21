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
        className="relative min-h-[calc(100vh-4rem)] min-h-[calc(100dvh-4rem)] flex flex-col justify-between items-center overflow-hidden border-b border-white/[0.07] bg-[#05080A]"
      >
        {/* Digital Core Hero Background with neon green dots & tech elements */}
        <HeroCodeNetwork />

        {/* Top spacer to balance layout vertically */}
        <div className="w-full h-4 sm:h-8 shrink-0" aria-hidden="true" />

        {/* Main Hero Content (Headline, Description, CTAs) */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full text-center py-6 sm:py-8 my-auto pointer-events-auto">
          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.35rem] xl:text-[3.75rem] font-black text-slate-50 font-cairo tracking-tight leading-[1.22] drop-shadow-sm flex items-center justify-center gap-2.5 sm:gap-3.5 flex-wrap"
          >
            <span className="whitespace-nowrap text-slate-100">خدمات برمجية متخصصة</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 via-emerald-300 to-teal-300 whitespace-nowrap drop-shadow-[0_0_24px_rgba(52,211,153,0.18)]">
              تنفيذ أفكارك الرقمية
            </span>
          </motion.h1>

          {/* Supporting Subtext */}
          <motion.p
            initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.45,
              delay: prefersReducedMotion ? 0 : 0.12,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mt-5 sm:mt-7 text-sm sm:text-base md:text-lg text-slate-300/90 font-normal font-cairo leading-relaxed max-w-2xl sm:max-w-3xl mx-auto px-2"
          >
            لتحويل أفكارك الرقمية إلى حلول برمجية متكاملة مع متابعة مستمرة وتنفيذ دقيق.
          </motion.p>

          {/* Hero Actions */}
          <motion.div
            initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.45,
              delay: prefersReducedMotion ? 0 : 0.22,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mt-7 sm:mt-9 flex flex-row items-center justify-center gap-3.5 sm:gap-5 w-full max-w-lg mx-auto"
          >
            {/* Primary CTA */}
            <button
              id="hero-explore-services-btn"
              type="button"
              onClick={scrollToServices}
              className="group relative h-[52px] sm:h-[56px] flex-1 sm:flex-initial px-6 sm:px-10 rounded-[16px] bg-gradient-to-l from-emerald-500 via-emerald-400 to-emerald-500 hover:brightness-105 active:scale-[0.98] text-slate-950 font-black text-sm sm:text-base md:text-lg font-cairo transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap ring-1 ring-white/25 ring-inset overflow-hidden"
            >
              {/* Subtle light sweep */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              <span className="relative z-10">استعرض الخدمات</span>
              <ArrowLeft className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-250 group-hover:-translate-x-1.5" />
            </button>

            {/* Secondary CTA */}
            <button
              id="hero-about-platform-btn"
              type="button"
              onClick={() => onNavigate('about')}
              className="h-[52px] sm:h-[56px] flex-1 sm:flex-initial px-6 sm:px-9 rounded-[16px] bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.12] hover:border-emerald-500/40 text-slate-200 hover:text-white font-bold text-sm sm:text-base md:text-lg font-cairo transition-all duration-250 cursor-pointer whitespace-nowrap flex items-center justify-center backdrop-blur-md shadow-sm active:scale-[0.98]"
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
            className="inline-flex flex-col items-center gap-1.5 text-slate-400 hover:text-emerald-300 text-xs font-cairo font-medium transition-colors cursor-pointer select-none group p-2 rounded-xl hover:bg-white/[0.03]"
            aria-label="الانتقال إلى الخدمات المتاحة"
          >
            <span className="text-[11px] sm:text-xs text-slate-400/90 group-hover:text-emerald-300 transition-colors">
              استكشف الخدمات
            </span>
            <ChevronDown className="w-4 h-4 text-emerald-400/80 group-hover:text-emerald-300 transition-transform duration-300 group-hover:translate-y-1 animate-pulse" />
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
              className="w-full h-12 bg-[#0b0f18] border border-white/[0.08] focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10 rounded-[16px] pr-11 pl-12 text-sm sm:text-base font-medium font-cairo text-slate-100 placeholder-slate-500 outline-none transition-all shadow-sm"
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
          <div className="text-center py-14 sm:py-16 px-4 bg-[#0b0f18] border border-white/[0.08] rounded-[20px] max-w-xl mx-auto space-y-3 shadow-lg">
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
          <div className="p-6 rounded-[20px] bg-[#0b0f18] hover:bg-[#0e1420] transition-colors border border-white/[0.07] flex items-start gap-4 shadow-sm group">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 group-hover:border-emerald-500/40 transition-colors">
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-100 font-cairo">
                أعلى معايير الجودة والأداء
              </h4>
              <p className="text-xs text-slate-300/90 font-normal font-cairo leading-relaxed">
                تنفيذ برمجي دقيق بالاعتماد على أفضل الممارسات الهندسية وضمان سرعة وأمان النظام.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-[20px] bg-[#0b0f18] hover:bg-[#0e1420] transition-colors border border-white/[0.07] flex items-start gap-4 shadow-sm group">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 group-hover:border-emerald-500/40 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-100 font-cairo">
                حماية وأمان كامل
              </h4>
              <p className="text-xs text-slate-300/90 font-normal font-cairo leading-relaxed">
                مراجعة تفصيلية لكل طلب وتحقق دقيق من المعاملات قبل البدء والتسليم الفعلي.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-[20px] bg-[#0b0f18] hover:bg-[#0e1420] transition-colors border border-white/[0.07] flex items-start gap-4 shadow-sm group">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 group-hover:border-emerald-500/40 transition-colors">
              <Layers className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-100 font-cairo">
                متابعة تفصيلية ودعم فني
              </h4>
              <p className="text-xs text-slate-300/90 font-normal font-cairo leading-relaxed">
                محادثة مخصصة لكل طلب لمتابعة مراحل التنفيذ وإرسال الملفات والتسجيلات الصوتية.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};


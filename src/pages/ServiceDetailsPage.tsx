import React, { useState } from 'react';
import { ServiceItem } from '../types';
import {
  ArrowRight,
  ArrowLeft,
  Play,
  CheckCircle2,
  Smartphone,
  Layout,
  Layers,
  Sparkles,
  FileText,
  Lock,
  Database,
  Code2,
  Briefcase,
  Globe,
  Compass,
  MessageSquare,
  Shield,
  HelpCircle,
  ChevronDown,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { WebDesignPromoVideo } from '../components/WebDesignPromoVideo';

interface ServiceDetailsPageProps {
  service: ServiceItem;
  onBack: () => void;
  onRequestService: (service: ServiceItem) => void;
  onOpenSupport?: () => void;
}

export const ServiceDetailsPage: React.FC<ServiceDetailsPageProps> = ({
  service,
  onBack,
  onRequestService,
  onOpenSupport,
}) => {
  const isBudgetPricing = service.pricingType === 'budget' || service.basePrice === 0;
  const currentPrice = service.isDiscounted ? service.discountedPrice : service.basePrice;

  // Track expanded FAQ index (null = none, default first open)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  // 4. What the Service Includes (grounded capabilities)
  const serviceCapabilities = [
    {
      icon: Smartphone,
      title: 'تصميم متجاوب بالكامل (Responsive)',
      description:
        'موقع يعمل بكفاءة وسلاسة عالية على شاشات الهواتف الذكية والأجهزة اللوحية وأجهزة الكمبيوتر.',
    },
    {
      icon: Layout,
      title: 'واجهة مستخدم عصرية (Modern UI)',
      description:
        'تجربة تصفح بديهية وتنسيق بصري يراعي هوية مشروعك وسهولة وصول الزائر للمعلومات.',
    },
    {
      icon: Layers,
      title: 'هيكلة صفحات متعددة (Multiple Pages)',
      description:
        'تنظيم صفحات الموقع حسب الحاجة (الرئيسية، من نحن، الخدمات، تفاصيل المنتجات، اتصل بنا).',
    },
    {
      icon: Sparkles,
      title: 'حركات وتفاعلات سلسة (Animations)',
      description:
        'تأثيرات بصرية خفيفة تضيف طابعاً احترافياً للموقع دون التأثير سلباً على سرعة التحميل والأداء.',
    },
    {
      icon: FileText,
      title: 'نماذج واستمارات تواصل (Forms)',
      description:
        'استقبال طلبات العملاء واستفساراتهم عبر استمارات تفاعلية مع التحقق من صحة المدخلات.',
    },
    {
      icon: Lock,
      title: 'تسجيل دخول وتوثيق (Authentication)',
      description:
        'إمكانية إضافة حسابات للمستخدمين ولوحة دخول آمنة عند حاجة فكرة المشروع.',
    },
    {
      icon: Database,
      title: 'خوادم وقواعد بيانات (Backend / DB)',
      description:
        'ربط الموقع بقواعد بيانات سحابية وتجهيز واجهات برمجية آمنة لمعالجة وتخزين البيانات.',
    },
    {
      icon: Code2,
      title: 'كود نظيف وقابل للتطوير (Clean Code)',
      description:
        'بناء الموقع وفق أفضل المعايير الهندسية لضمان استقراره وسهولة إضافة أي مزايا مستقبلية.',
    },
  ];

  // 5. Website Types
  const websiteTypes = [
    {
      icon: Briefcase,
      title: 'مواقع الشركات والأعمال',
      tag: 'Business Websites',
      description:
        'واجهة رقمية احترافية تقدم هوية شركتك، رسالتها، خدماتها، وأعمالها للعملاء والشركاء.',
    },
    {
      icon: Globe,
      title: 'مواقع الخدمات وحجز المواعيد',
      tag: 'Service Websites',
      description:
        'عرض تفصيلي للخدمات المقدمة مع تمكين الزوار من طلب الخدمة أو حجز المواعيد والاستفسار.',
    },
    {
      icon: Compass,
      title: 'صفحات الهبوط التعريفية',
      tag: 'Landing Pages',
      description:
        'صفحة مركزة موجهة لحملة تسويقية أو خدمة محددة تهدف إلى تحويل الزوار إلى عملاء فعليين.',
    },
    {
      icon: Layout,
      title: 'معارض الأعمال الشخصية',
      tag: 'Portfolio Websites',
      description:
        'موقع شخصي أنيق للمستقلين والمصممين والمطورين لاستعراض سابقة الأعمال والمهارات.',
    },
  ];

  // 6. How it works (5 visual steps)
  const processSteps = [
    {
      number: '01',
      title: 'إرسال المتطلبات',
      description: 'تحديد فكرة الموقع، الصفحات المطلوبة، وأي أمثلة أو تفضيلات خاصة بك.',
    },
    {
      number: '02',
      title: 'مناقشة المشروع',
      description: 'مراجعة المتطلبات الفنية والجدول الزمني والاتفاق على التفاصيل قبل البدء.',
    },
    {
      number: '03',
      title: 'التصميم والتطوير',
      description: 'بناء الواجهات وتطوير الأكواد البرمجية وفق أعلى معايير السرعة والاستقرار.',
    },
    {
      number: '04',
      title: 'المعاينة والمراجعة',
      description: 'استعراض نسخة تجريبية حية من الموقع وتطبيق التعديلات والملاحظات المتفق عليها.',
    },
    {
      number: '05',
      title: 'التسليم والتشغيل',
      description: 'تسليم الموقع كاملاً وربطه بالنطاق والاستضافة والتأكد من عمله بكفاءة تامة.',
    },
  ];

  // 9. FAQ Data (honest, grounded answers)
  const faqs = [
    {
      q: 'كم يستغرق تنفيذ موقع الويب عادةً؟',
      a: 'تعتمد المدة على حجم المشروع وعدد الصفحات المطلوبة. عادةً ما تستغرق المواقع وصفحات الهبوط ما بين 5 إلى 10 أيام عمل بعد اعتماد كافة المتطلبات.',
    },
    {
      q: 'هل سيعمل الموقع على الهواتف الذكية بكفاءة؟',
      a: 'نعم بكل تأكيد. نعتمد نهج التصميم المتجاوب (Responsive Design) ليعمل الموقع بالشكل الأمثل على مختلف الشاشات من الهواتف إلى الشاشات الكبيرة.',
    },
    {
      q: 'هل يشمل السعر النطاق (Domain) والاستضافة (Hosting)؟',
      a: 'سعر الخدمة مخصص للتصميم والبرمجة والتجهيز الفني للموقع. النطاق والاستضافة يتم حجزها باسم العميل على منصات الاستضافة المناسبة، ونقوم بمساعدتك في ربطها وتشغيلها مجاناً.',
    },
    {
      q: 'هل يمكنني طلب تعديلات على الموقع أثناء التنفيذ؟',
      a: 'بالطبع، خطة العمل تتضمن مرحلة مراجعة ومعاينة تجريبية لاختبار الموقع وإبداء الملاحظات والتعديلات المناسبة قبل التسليم النهائي.',
    },
    {
      q: 'كيف يتم تحديد السعر النهائي للمشروع؟',
      a: 'السعر المعروض هو السعر الأساسي للخدمة. إذا كان مشروعك يتطلب خصائص إضافية مخصصة (مثل لوحات تحكم متقدمة، بوابات دفع محددة، أو صفحات إضافية) يتم تحديد التكلفة بدقة وبشفافية كاملة قبل بدء العمل.',
    },
  ];

  return (
    <div className="w-full text-right pb-20 sm:pb-28">
      {/* Top Breadcrumb & Navigation */}
      <div className="border-b border-white/[0.06] bg-[#070A10]/60 backdrop-blur-md sticky top-16 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 font-cairo">
            <button
              onClick={onBack}
              id="service-details-breadcrumb-back"
              className="hover:text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>الرئيسية / الخدمات</span>
            </button>
            <span className="text-slate-600">/</span>
            <span className="text-slate-200 font-bold">تصميم مواقع</span>
          </nav>

          <Button
            variant="secondary"
            size="sm"
            onClick={onBack}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            iconPosition="start"
          >
            العودة للخدمات
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-12 sm:space-y-16">
        {/* 1. Promotional Video for Web Design Service */}
        <section id="promo-video-section" className="w-full">
          <WebDesignPromoVideo
            onStartProject={() => onRequestService(service)}
            onOpenSupport={onOpenSupport}
          />
        </section>

        {/* 2. Service Name & 3. Short Value Description */}
        <section className="space-y-4 text-center sm:text-right border-b border-white/[0.06] pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-cairo">
            <Sparkles className="w-3.5 h-3.5" />
            <span>خدمة برمجية متخصصة</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-100 font-cairo tracking-tight">
            تصميم مواقع
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-normal font-cairo leading-relaxed max-w-3xl">
            نصمم ونطور مواقع ويب احترافية مخصصة بالكامل وفق متطلبات وأهداف مشروعك، مبنية بعناية لتعمل
            بسلاسة وسرعة فائقة عبر كافة شاشات أجهزة الجوال والحاسوب مع واجهات مستخدم مريحة وكود برمجي
            نظيف وقابل للتوسع.
          </p>
        </section>

        {/* 4. What the Service Includes */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 font-cairo tracking-tight flex items-center gap-2.5">
              <span className="w-2 h-6 rounded-full bg-emerald-400" />
              <span>ماذا تشمل الخدمة؟</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-cairo">
              مجموعة الإمكانيات والمواصفات الفنية التي يتم تسليمها ضمن مشروع موقعك:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {serviceCapabilities.map((cap, idx) => {
              const Icon = cap.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-[#0A0E17] hover:bg-[#0E1422] border border-white/[0.08] hover:border-emerald-500/35 transition-all duration-200 flex flex-col justify-between space-y-3 shadow-md group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform duration-200">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors font-cairo">
                      {cap.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-cairo leading-relaxed">
                      {cap.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. Website Types */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 font-cairo tracking-tight flex items-center gap-2.5">
              <span className="w-2 h-6 rounded-full bg-emerald-400" />
              <span>أنماط المواقع التي ننفذها</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-cairo">
              نماذج واقعية لحلول الويب المصممة لتلائم طبيعة نشاطك ومتطلبات مستخدميك:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {websiteTypes.map((type, idx) => {
              const Icon = type.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-[#0A0E17] border border-white/[0.08] hover:border-emerald-500/30 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-emerald-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.03] text-slate-400 border border-white/[0.06]">
                      {type.tag}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-slate-100 font-cairo">{type.title}</h3>
                    <p className="text-xs text-slate-400 font-cairo leading-relaxed">
                      {type.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. How It Works (Process) */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 font-cairo tracking-tight flex items-center gap-2.5">
              <span className="w-2 h-6 rounded-full bg-emerald-400" />
              <span>كيف تسير مراحل العمل؟</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-cairo">
              خطوات واضحة ومنظمة من استلام الفكرة حتى إطلاق الموقع وتشغيله:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {processSteps.map((step, idx) => (
              <div
                key={idx}
                className="relative p-5 rounded-2xl bg-[#0A0E17] border border-white/[0.08] hover:border-emerald-500/30 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-emerald-400/90 font-mono tracking-wider">
                    {step.number}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-emerald-400/60" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-100 font-cairo">{step.title}</h3>
                  <p className="text-xs text-slate-400 font-cairo leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Pricing & 8. Purchase / Start Project CTA */}
        <section
          id="pricing-cta-section"
          className="p-6 sm:p-8 lg:p-10 rounded-3xl bg-gradient-to-b from-[#0E1524] to-[#0A0E17] border border-white/[0.1] shadow-2xl relative overflow-hidden"
        >
          {/* Atmospheric background glow */}
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Pricing details and conditions */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-cairo">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>تسعير واضح وشفاف</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-100 font-cairo tracking-tight">
                تكلفة خدمة تصميم المواقع
              </h2>

              <p className="text-xs sm:text-sm text-slate-300/90 font-cairo leading-relaxed">
                يبدأ تنفيذ المواقع الأساسية وصفحات الهبوط من السعر الموضح أدناه، ويتم تحديد السعر
                النهائي بدقة حسب متطلباتك وعدد الصفحات والخصائص البرمجية المطلوبة لمشروعك.
              </p>

              {/* Price display */}
              <div className="pt-2 flex items-baseline gap-3">
                <span className="text-xs text-slate-400 font-cairo font-bold">السعر يبدأ من:</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-black text-[#00FF9D] tracking-tight font-sans">
                    {currentPrice.toLocaleString()}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-emerald-400 font-cairo">
                    ج.م
                  </span>
                </div>
                {service.isDiscounted && !isBudgetPricing && (
                  <span className="text-sm text-slate-500 line-through font-mono">
                    {service.basePrice.toLocaleString()} ج.م
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-slate-300 font-cairo">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>طرق الدفع: المحافظ الإلكترونية المعتمدة</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>مراجعة الطلب والموافقة المسبقة قبل البدء</span>
                </div>
              </div>
            </div>

            {/* CTA action box */}
            <div className="lg:col-span-5 bg-[#070A10]/80 p-6 rounded-2xl border border-white/[0.08] space-y-4">
              <div className="space-y-1 text-center">
                <h3 className="text-base font-bold text-slate-100 font-cairo">
                  جاهز للبدء في موقعك؟
                </h3>
                <p className="text-xs text-slate-400 font-cairo">
                  اضغط على الزر التالي لإدخال تفاصيل ومتطلبات مشروعك وسنتواصل معك فوراً.
                </p>
              </div>

              {/* 8. Purchase / Start Project CTA reusing existing Button component */}
              <Button
                id="service-details-request-btn"
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => onRequestService(service)}
                icon={<ArrowLeft className="w-5 h-5" />}
                iconPosition="end"
              >
                طلب الخدمة الآن
              </Button>

              <p className="text-[11px] text-center text-slate-400 font-cairo">
                لا يتم خصم أي مبالغ حتى مراجعة تفاصيل طلبك والاتفاق معك.
              </p>
            </div>
          </div>
        </section>

        {/* 9. FAQ Section */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 font-cairo tracking-tight flex items-center gap-2.5">
              <HelpCircle className="w-6 h-6 text-emerald-400" />
              <span>الأسئلة الشائعة حول الخدمة</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-cairo">
              إجابات مباشرة وشفافة على أبرز استفسارات العملاء حول تصميم وبرمجة المواقع:
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-[#0A0E17] border border-white/[0.08] overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-right gap-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-sm sm:text-base font-bold text-slate-100 font-cairo">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-emerald-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-white/[0.04]">
                      <p className="text-xs sm:text-sm text-slate-300/90 font-cairo leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 10. Secondary CTA / Support or Contact */}
        <section className="p-6 sm:p-8 rounded-2xl bg-[#0A0E17] border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-right shadow-lg">
          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-slate-100 font-cairo flex items-center justify-center sm:justify-start gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              <span>هل لديك استفسار أو متطلبات خاصة قبل الطلب؟</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 font-cairo max-w-xl">
              إذا لم تكن متأكداً من النطاق المناسب لموقعك أو أردت استشارة فنية سريعة، فريق الدعم
              جاهز للإجابة على استفساراتك فوراً.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {onOpenSupport && (
              <Button
                variant="secondary"
                size="md"
                onClick={onOpenSupport}
                icon={<MessageSquare className="w-4 h-4 text-emerald-400" />}
                iconPosition="start"
              >
                تواصل مع الدعم
              </Button>
            )}

            <Button
              variant="outline"
              size="md"
              onClick={onBack}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="start"
            >
              كافة الخدمات
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

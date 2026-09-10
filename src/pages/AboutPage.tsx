import React from 'react';
import { ArrowLeft, CheckCircle2, Shield, Code2, Sparkles, Smartphone, Globe } from 'lucide-react';

interface AboutPageProps {
  onExploreServices: () => void;
  onOpenSupport: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onExploreServices, onOpenSupport }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-right space-y-10">
      {/* Title */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-100 font-cairo tracking-tight">
          عن المنصة
        </h1>
        <p className="text-base sm:text-lg text-slate-300 font-medium font-cairo leading-relaxed">
          منصة برمجية متخصصة في تقديم وتطوير الحلول الرقمية، تصميم المواقع وتطبيقات الهواتف الذكية باحترافية تامة.
        </p>
      </div>

      {/* Overview Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0d121c] border border-white/[0.08] space-y-4 shadow-lg">
        <h2 className="text-lg sm:text-xl font-bold text-slate-100 font-cairo flex items-center gap-3">
          <span className="w-2 h-5 rounded-full bg-emerald-400"></span>
          <span>ما هي منصة HEMA SERVICES؟</span>
        </h2>
        <p className="text-sm sm:text-base text-slate-300 font-medium font-cairo leading-relaxed">
          HEMA SERVICES هي منصة رقمية متخصصة تهدف إلى توفير خدمات برمجية احترافية للأفراد، رواد الأعمال، والشركات. نركز على تحويل المتطلبات التقنية والأفكار إلى منتجات رقمية متكاملة وقابلة للتوسع، تشمل تطوير مواقع الويب، تطبيقات الجوال، الأنظمة السحابية، وفحص الأمان والتحسين التقني مع الالتزام بأعلى معايير الدقة والسرعة.
        </p>
      </div>

      {/* Services Provided */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0d121c] border border-white/[0.08] space-y-6 shadow-lg">
        <h2 className="text-lg sm:text-xl font-bold text-slate-100 font-cairo flex items-center gap-3">
          <span className="w-2 h-5 rounded-full bg-emerald-400"></span>
          <span>نوعية الخدمات المقدمة</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#121824] border border-white/[0.06] flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-100 font-cairo">تصميم وتطوير المواقع</h3>
              <p className="text-xs sm:text-sm text-slate-300 font-medium font-cairo leading-relaxed">
                مواقع تفاعلية، صفحات هبوط عصرية، ومتاجر إلكترونية مهيأة لسرعة فائقة وتجربة مستخدم مريحة.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#121824] border border-white/[0.06] flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-100 font-cairo">تطبيقات الهواتف الذكية</h3>
              <p className="text-xs sm:text-sm text-slate-300 font-medium font-cairo leading-relaxed">
                بناء تطبيقات لنظامي iOS و Android تدعم التحديثات الفورية والإشعارات والربط مع الخوادم.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#121824] border border-white/[0.06] flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Code2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-100 font-cairo">الأنظمة السحابية والواجهات الخلفية</h3>
              <p className="text-xs sm:text-sm text-slate-300 font-medium font-cairo leading-relaxed">
                برمجة قواعد بيانات متينة، خوادم آمنة، وواجهات برمجة تطبيقات (APIs) عالية الاعتمادية.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#121824] border border-white/[0.06] flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-100 font-cairo">فحص الأمان وتحسين الأداء</h3>
              <p className="text-xs sm:text-sm text-slate-300 font-medium font-cairo leading-relaxed">
                تدقيق برمجي لسد الثغرات، وتسريع استجابة الخوادم لتحقيق أعلى درجات السرعة والحماية.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How to Request */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0d121c] border border-white/[0.08] space-y-5 shadow-lg">
        <h2 className="text-lg sm:text-xl font-bold text-slate-100 font-cairo flex items-center gap-3">
          <span className="w-2 h-5 rounded-full bg-emerald-400"></span>
          <span>كيفية طلب الخدمة ومراحل التنفيذ</span>
        </h2>
        <div className="space-y-3.5 text-sm font-medium font-cairo text-slate-200">
          <div className="flex items-start gap-3.5">
            <span className="w-6 h-6 rounded-xl bg-emerald-500/15 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-500/30">
              1
            </span>
            <span className="pt-0.5">تصفح قائمة الخدمات واختر الخدمة البرمجية المطابقة لمتطلبات مشروعك.</span>
          </div>
          <div className="flex items-start gap-3.5">
            <span className="w-6 h-6 rounded-xl bg-emerald-500/15 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-500/30">
              2
            </span>
            <span className="pt-0.5">اكتب نبذة عن متطلباتك الأساسية وقم بتحويل التكلفة عبر رقم المحفظة المعتمد.</span>
          </div>
          <div className="flex items-start gap-3.5">
            <span className="w-6 h-6 rounded-xl bg-emerald-500/15 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-500/30">
              3
            </span>
            <span className="pt-0.5">أرفق إشعار التحويل لتأكيد طلبك وبدء مرحلة المراجعة الرسمية.</span>
          </div>
          <div className="flex items-start gap-3.5">
            <span className="w-6 h-6 rounded-xl bg-emerald-500/15 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-500/30">
              4
            </span>
            <span className="pt-0.5">تواصل مباشرة مع الإدارة عبر محادثة الطلب لمتابعة مراحل العمل والتسليم الفعلي.</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
        <button
          onClick={onExploreServices}
          id="about-explore-services-btn"
          className="h-12 sm:h-13 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-extrabold text-sm sm:text-base font-cairo transition-all duration-200 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/35 cursor-pointer whitespace-nowrap"
        >
          استعراض الخدمات المتاحة
        </button>
        <button
          onClick={onOpenSupport}
          id="about-open-support-btn"
          className="h-12 sm:h-13 px-8 rounded-2xl bg-[#121824] hover:bg-[#172030] border border-white/[0.1] hover:border-emerald-500/30 text-slate-200 hover:text-white font-extrabold text-sm sm:text-base font-cairo transition-all duration-200 active:scale-[0.98] cursor-pointer whitespace-nowrap"
        >
          تواصل مع خدمة العملاء
        </button>
      </div>
    </div>
  );
};

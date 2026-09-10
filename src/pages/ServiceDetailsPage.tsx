import React from 'react';
import { ServiceItem } from '../types';
import { ArrowRight, CheckCircle2, Info, ArrowLeft, Shield } from 'lucide-react';

interface ServiceDetailsPageProps {
  service: ServiceItem;
  onBack: () => void;
  onRequestService: (service: ServiceItem) => void;
}

export const ServiceDetailsPage: React.FC<ServiceDetailsPageProps> = ({
  service,
  onBack,
  onRequestService,
}) => {
  const currentPrice = service.isDiscounted ? service.discountedPrice : service.basePrice;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-right">
      {/* Top: Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-8">
        <button
          onClick={onBack}
          id="service-details-back-btn"
          className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>الخدمات</span>
        </button>
        <span className="text-slate-600">/</span>
        <span className="text-slate-200 font-medium truncate">{service.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Service Area */}
        <div className="lg:col-span-8 space-y-8">
          {/* Service Image */}
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-[#121824] border border-white/[0.07] shadow-xl">
            <img
              src={service.image}
              alt={service.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {service.isDiscounted && (
              <div className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-xs shadow-sm">
                عرض خاص لفترة محدودة
              </div>
            )}
          </div>

          {/* Service Title & Short Description */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-100 tracking-tight leading-tight">
              {service.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              {service.shortDescription}
            </p>
          </div>

          {/* Full description */}
          <div className="p-6 rounded-2xl bg-[#0d121c] border border-white/[0.07] space-y-3.5">
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-emerald-400"></span>
              <span>تفاصيل الخدمة</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {service.description}
            </p>
          </div>

          {/* What is included */}
          <div className="p-6 rounded-2xl bg-[#0d121c] border border-white/[0.07] space-y-4">
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-emerald-400"></span>
              <span>ماذا تشمل الخدمة؟</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {service.deliverables && service.deliverables.length > 0 ? (
                service.deliverables.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-[#121824] border border-white/[0.05]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                      {item}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">
                  تشمل الخدمة كافة خطوات التحليل والتنفيذ والتسليم.
                </p>
              )}
            </div>
          </div>

          {/* Additional information */}
          {service.additionalInfo && (
            <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-3.5">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                <span className="font-semibold text-emerald-300 block mb-0.5">معلومات إضافية:</span>
                <p>{service.additionalInfo}</p>
              </div>
            </div>
          )}
        </div>

        {/* Pricing & CTA Card (Sticky on desktop) */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 p-6 sm:p-7 rounded-2xl bg-[#0d121c] border border-white/[0.07] shadow-xl space-y-6">
            <div className="space-y-1.5">
              <span className="text-xs text-slate-400 font-medium block">تكلفة الخدمة</span>
              <div className="flex items-baseline gap-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                    {currentPrice.toLocaleString()}
                  </span>
                  <span className="text-sm text-emerald-500/80 font-medium">ج.م</span>
                </div>
                {service.isDiscounted && (
                  <span className="text-sm text-slate-500 line-through font-mono">
                    {service.basePrice.toLocaleString()} ج.م
                  </span>
                )}
              </div>
              {service.isDiscounted && (
                <span className="inline-block text-xs text-emerald-400 font-medium">
                  وفرت {(service.basePrice - service.discountedPrice).toLocaleString()} ج.م
                </span>
              )}
            </div>

            <div className="p-4 rounded-xl bg-[#121824] border border-white/[0.06] text-xs text-slate-300 space-y-2.5">
              <div className="flex items-center gap-2.5 text-slate-300">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>طريقة الدفع: المحفظة الإلكترونية</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>مراجعة الطلب واعتماده من الإدارة</span>
              </div>
            </div>

            {/* CTA: Primary button "طلب الخدمة" */}
            <button
              onClick={() => onRequestService(service)}
              id="request-service-primary-btn"
              className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-extrabold text-sm sm:text-base font-cairo transition-all duration-200 shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/35 cursor-pointer whitespace-nowrap"
            >
              <span>طلب الخدمة</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={onBack}
              id="service-details-return-btn"
              className="w-full py-2 text-center text-xs text-slate-400 hover:text-white transition-colors"
            >
              العودة إلى قائمة الخدمات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

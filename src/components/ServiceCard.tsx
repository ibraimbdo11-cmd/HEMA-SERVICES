import React from 'react';
import { ServiceItem } from '../types';
import { ArrowLeft, Sparkles } from 'lucide-react';

interface ServiceCardProps {
  service: ServiceItem;
  onRequest: (service: ServiceItem) => void;
  onView?: (id: string) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onRequest }) => {
  const isBudgetPricing = service.pricingType === 'budget' || service.basePrice === 0;
  const currentPrice = service.isDiscounted ? service.discountedPrice : service.basePrice;

  return (
    <div
      id={`service-card-${service.id}`}
      className="group relative bg-[#0b0f18] hover:bg-[#0e1420] border border-white/[0.07] hover:border-emerald-500/35 rounded-[20px] overflow-hidden flex flex-col hover:-translate-y-1.5 transition-all duration-300 ease-out shadow-lg shadow-black/40 hover:shadow-xl hover:shadow-emerald-950/20 text-right"
    >
      {/* Subtle technical corner highlight */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/[0.04] to-transparent pointer-events-none rounded-tr-[20px]" />

      {/* 1. Service image - Edge-to-edge full image without any black gaps/borders */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#070a10] border-b border-white/[0.06]">
        <img
          src={service.image}
          alt={service.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Subtle vignette over image */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f18]/60 via-transparent to-transparent pointer-events-none" />

        {/* Discount badge if applicable and not budget */}
        {service.isDiscounted && !isBudgetPricing && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-[11px] shadow-md font-cairo ring-1 ring-white/20">
            خصم خاص
          </div>
        )}

        {isBudgetPricing && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] flex items-center gap-1.5 backdrop-blur-md font-cairo">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>حسب الميزانية</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* 2. Service title - Bold Arabic font */}
          <h3 className="text-base sm:text-lg font-bold text-slate-100 group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug font-cairo">
            {service.title}
          </h3>

          {/* 3. Short description - Medium Arabic font for high legibility */}
          <p className="text-xs sm:text-sm text-slate-300/90 line-clamp-2 leading-relaxed font-normal font-cairo">
            {service.shortDescription}
          </p>
        </div>

        <div className="pt-3.5 border-t border-white/[0.06] space-y-3.5">
          {/* Price area */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm text-slate-400 font-medium font-cairo">سعر الخدمة</span>
            {isBudgetPricing ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl font-cairo">
                  حسب الميزانية والاتفاق
                </span>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                {service.isDiscounted && (
                  <span className="text-xs text-slate-500 line-through font-mono font-medium">
                    {service.basePrice.toLocaleString()} ج.م
                  </span>
                )}
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight font-sans">
                    {currentPrice.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-emerald-400/90 font-cairo">ج.م</span>
                </div>
              </div>
            )}
          </div>

          {/* Primary CTA: "طلب الخدمة" */}
          <button
            type="button"
            onClick={() => onRequest(service)}
            id={`request-service-btn-${service.id}`}
            className="w-full h-11 sm:h-12 flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-l from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 active:scale-[0.98] text-slate-950 text-sm sm:text-base font-extrabold font-cairo transition-all duration-200 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 cursor-pointer whitespace-nowrap"
          >
            <span>طلب الخدمة</span>
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

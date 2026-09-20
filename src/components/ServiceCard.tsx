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
      className="group relative bg-[linear-gradient(180deg,#0f151f_0%,#0b1119_100%)] border border-white/[0.075] hover:border-emerald-400/35 rounded-[20px] overflow-hidden flex flex-col hover:-translate-y-1 transition-all duration-300 ease-out shadow-[0_16px_40px_-24px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.045)] hover:shadow-[0_24px_55px_-28px_rgba(0,0,0,0.98),0_0_30px_-18px_rgba(16,185,129,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] text-right"
    >
      {/* 1. Service image - Edge-to-edge full image without any black gaps/borders */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#070b13] border-b border-white/[0.055]">
        <img
          src={service.image}
          alt={service.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035] group-hover:saturate-[1.08]"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Discount badge if applicable and not budget */}
        {service.isDiscounted && !isBudgetPricing && (
          <div className="absolute top-3 right-3 px-3 py-1 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-md font-cairo">
            خصم خاص
          </div>
        )}

        {isBudgetPricing && (
          <div className="absolute top-3 right-3 px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 backdrop-blur-md font-cairo">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>حسب الميزانية</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* 2. Service title - Bold Arabic font */}
          <h3 className="text-base sm:text-lg font-bold text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug font-cairo">
            {service.title}
          </h3>

          {/* 3. Short description - Medium Arabic font for high legibility */}
          <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed font-medium font-cairo">
            {service.shortDescription}
          </p>
        </div>

        <div className="pt-3.5 border-t border-white/[0.06] space-y-3.5">
          {/* Price area */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm text-slate-400 font-semibold font-cairo">سعر الخدمة</span>
            {isBudgetPricing ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-xl font-cairo">
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
            className="w-full h-11 sm:h-12 flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-b from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 active:scale-[0.985] text-slate-950 text-sm sm:text-base font-extrabold font-cairo transition-all duration-300 shadow-[0_8px_22px_-10px_rgba(16,185,129,0.5),inset_0_1px_0_rgba(255,255,255,0.22)] hover:shadow-[0_12px_28px_-10px_rgba(16,185,129,0.58),inset_0_1px_0_rgba(255,255,255,0.25)] cursor-pointer whitespace-nowrap"
          >
            <span>طلب الخدمة</span>
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

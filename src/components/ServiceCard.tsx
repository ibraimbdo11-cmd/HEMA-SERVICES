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
      className="group relative bg-gradient-to-b from-[#111925] to-[#0b1018] border border-white/[0.08] hover:border-emerald-400/40 rounded-[20px] overflow-hidden flex flex-col hover:-translate-y-1.5 transition-all duration-300 ease-out shadow-card hover:shadow-card-hover hover:shadow-emerald-950/30 text-right"
    >
      {/* 1. Service image - Edge-to-edge full image without any black gaps/borders */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#070b13] border-b border-white/[0.06]">
        <img
          src={service.image}
          alt={service.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
            className="w-full h-11 sm:h-12 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 text-sm sm:text-base font-extrabold font-cairo transition-all duration-200 shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/35 cursor-pointer whitespace-nowrap"
          >
            <span>طلب الخدمة</span>
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

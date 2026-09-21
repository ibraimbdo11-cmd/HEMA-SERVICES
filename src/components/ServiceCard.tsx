import React from 'react';
import { ServiceItem } from '../types';
import { ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';

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
      className="group relative bg-[#0A0E17] hover:bg-[#0E1422] border border-white/[0.08] hover:border-emerald-500/40 rounded-[22px] overflow-hidden flex flex-col hover:-translate-y-1.5 transition-all duration-300 ease-out shadow-lg shadow-black/60 hover:shadow-2xl hover:shadow-emerald-950/30 text-right ring-1 ring-white/[0.02]"
    >
      {/* Precision corner bracket accent (top-right and bottom-left) */}
      <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-400/40 group-hover:border-emerald-400 transition-colors duration-300" />
      </div>
      <div className="absolute bottom-0 left-0 w-8 h-8 pointer-events-none overflow-hidden z-10">
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-emerald-400/20 group-hover:border-emerald-400/60 transition-colors duration-300" />
      </div>

      {/* Subtle top atmospheric glow line */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/0 group-hover:via-emerald-400/40 to-transparent transition-all duration-500 z-10" />

      {/* 1. Service Media - Edge-to-edge high definition preview */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#070A10] border-b border-white/[0.08]">
        <img
          src={service.image}
          alt={service.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Cinematic Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E17] via-[#0A0E17]/20 to-transparent pointer-events-none" />

        {/* Dynamic status badges */}
        <div className="absolute top-3 right-3 flex flex-wrap items-center gap-2 z-10">
          {service.isDiscounted && !isBudgetPricing && (
            <div className="px-2.5 py-1 rounded-lg bg-[#00FF9D] text-slate-950 font-black text-[11px] shadow-[0_0_12px_rgba(0,255,157,0.4)] font-cairo flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" />
              <span>عرض خاص</span>
            </div>
          )}

          {isBudgetPricing && (
            <div className="px-2.5 py-1 rounded-lg bg-[#0A0E17]/85 border border-emerald-500/35 text-emerald-300 font-bold text-[11px] flex items-center gap-1.5 backdrop-blur-md font-cairo shadow-sm">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>حسب الميزانية</span>
            </div>
          )}
        </div>

        {/* Subtle Tech Index / Service Category Pill on top left */}
        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/60 border border-white/10 text-slate-300 font-mono text-[10px] backdrop-blur-xs z-10">
          HEMA-TECH
        </div>
      </div>

      {/* 2. Service Content */}
      <div className="p-5 sm:p-5.5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Service Title */}
          <h3 className="text-base sm:text-lg font-bold text-slate-100 group-hover:text-emerald-300 transition-colors duration-200 line-clamp-2 leading-snug font-cairo">
            {service.title}
          </h3>

          {/* Short Description */}
          <p className="text-xs sm:text-sm text-slate-300/85 line-clamp-2 leading-relaxed font-normal font-cairo">
            {service.shortDescription}
          </p>
        </div>

        {/* 3. Pricing & Call to Action Footer */}
        <div className="pt-4 border-t border-white/[0.08] space-y-3.5">
          {/* Price Layout */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-400 font-medium font-cairo flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/80 shrink-0" />
              <span>تسعير الخدمة</span>
            </span>

            {isBudgetPricing ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl font-cairo">
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

          {/* Universal Primary Button Integration */}
          <Button
            id={`request-service-btn-${service.id}`}
            variant="primary"
            size="md"
            fullWidth
            onClick={() => onRequest(service)}
            icon={<ArrowLeft className="w-4 h-4" />}
            iconPosition="end"
          >
            طلب الخدمة
          </Button>
        </div>
      </div>
    </div>
  );
};

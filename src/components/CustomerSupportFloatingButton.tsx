import React from 'react';
import { Headset } from 'lucide-react';

interface CustomerSupportFloatingButtonProps {
  onClick: () => void;
  unreadCount?: number;
}

export const CustomerSupportFloatingButton: React.FC<CustomerSupportFloatingButtonProps> = ({
  onClick,
  unreadCount = 0,
}) => {
  return (
    <div className="fixed bottom-5 left-5 sm:bottom-6 sm:left-6 z-40 select-none">
      <button
        onClick={onClick}
        id="floating-customer-support-btn"
        type="button"
        className="relative group w-12 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/25 transition-all duration-200 active:scale-95 flex items-center justify-center border border-emerald-400/40 cursor-pointer"
        aria-label="خدمة العملاء والدعم الفني"
        title="خدمة العملاء والدعم الفني"
      >
        <Headset className="w-5 h-5 text-slate-950 group-hover:scale-105 transition-transform" />

        {unreadCount > 0 && (
          <span
            id="floating-support-unread-dot"
            className="absolute -top-1 -right-1 flex items-center justify-center z-10"
            title={`${unreadCount} رسائل غير مقروءة`}
          >
            {unreadCount > 1 ? (
              <span className="inline-flex items-center gap-1 h-5 min-w-[20px] px-1.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black font-payment-digits shadow-md border-2 border-[#07090e] leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" />
                <span>{unreadCount > 99 ? '99+' : unreadCount}</span>
              </span>
            ) : (
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-[#07090e] shadow-sm shadow-emerald-400/50"></span>
              </span>
            )}
          </span>
        )}

        {/* Tooltip towards inside of screen */}
        <span className="hidden md:group-hover:inline-block absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-[#0d121c] text-slate-200 text-xs font-semibold font-cairo whitespace-nowrap border border-white/[0.08] shadow-xl pointer-events-none transition-opacity">
          خدمة العملاء والدعم
        </span>
      </button>
    </div>
  );
};

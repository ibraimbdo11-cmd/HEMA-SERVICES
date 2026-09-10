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
    <div className="fixed bottom-6 left-6 z-40">
      <button
        onClick={onClick}
        id="floating-customer-support-btn"
        className="relative group w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-lg shadow-emerald-500/10 transition-all duration-200 active:scale-95 flex items-center justify-center border border-emerald-400/40"
        aria-label="خدمة العملاء"
        title="خدمة العملاء والدعم الفني"
      >
        <Headset className="w-5 h-5" />

        {unreadCount > 0 && (
          <span
            id="floating-support-unread-badge"
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center border-2 border-[#080b11]"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        {/* Tooltip on hover */}
        <span className="hidden md:group-hover:inline-block absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-[#0d121c] text-slate-200 text-xs font-medium whitespace-nowrap border border-white/[0.08] shadow-lg pointer-events-none">
          خدمة العملاء
        </span>
      </button>
    </div>
  );
};

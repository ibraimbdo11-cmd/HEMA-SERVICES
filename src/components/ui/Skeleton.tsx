import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`skeleton-shimmer bg-slate-850/80 rounded-lg ${className}`}
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
    />
  );
};

export const ServiceCardSkeleton: React.FC = () => {
  return (
    <div className="bg-[#0A0E17] border border-white/[0.08] rounded-[22px] overflow-hidden flex flex-col h-full animate-pulse text-right">
      {/* Image container */}
      <div className="w-full aspect-[16/10] bg-slate-800/40" />
      
      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <div className="h-5 bg-slate-800/50 rounded-lg w-3/4" />
          <div className="h-3.5 bg-slate-800/30 rounded-md w-full" />
          <div className="h-3.5 bg-slate-800/30 rounded-md w-4/5" />
        </div>

        <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-3 bg-slate-800/30 rounded w-12" />
            <div className="h-6 bg-slate-800/50 rounded-lg w-20" />
          </div>
          <div className="h-11 bg-slate-800/50 rounded-[14px] w-28" />
        </div>
      </div>
    </div>
  );
};

export const OrderItemSkeleton: React.FC = () => {
  return (
    <div className="bg-[#0d121c] border border-white/[0.07] rounded-2xl p-5 space-y-4 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800/50" />
          <div className="space-y-1.5">
            <div className="h-4 bg-slate-800/60 rounded w-36" />
            <div className="h-3 bg-slate-800/30 rounded w-24" />
          </div>
        </div>
        <div className="h-7 w-24 bg-slate-800/40 rounded-lg" />
      </div>

      <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between">
        <div className="h-4 bg-slate-800/40 rounded w-28" />
        <div className="h-8 bg-slate-800/50 rounded-lg w-24" />
      </div>
    </div>
  );
};

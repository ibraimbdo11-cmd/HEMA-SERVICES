import React from 'react';
import { OrderStatus } from '../../types';
import { Clock, CheckCircle2, PlayCircle, XCircle, AlertCircle, Ban } from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  showIcon = true,
}) => {
  switch (status) {
    case 'pending_review':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap h-7 ${className}`}
        >
          {showIcon && <Clock className="w-3.5 h-3.5 shrink-0" />}
          <span>قيد المراجعة</span>
        </span>
      );
    case 'accepted':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 whitespace-nowrap h-7 ${className}`}
        >
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
          <span>تم القبول</span>
        </span>
      );
    case 'in_progress':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 whitespace-nowrap h-7 ${className}`}
        >
          {showIcon && <PlayCircle className="w-3.5 h-3.5 shrink-0" />}
          <span>جاري التنفيذ</span>
        </span>
      );
    case 'completed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 whitespace-nowrap h-7 ${className}`}
        >
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
          <span>مكتمل بنجاح</span>
        </span>
      );
    case 'rejected':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap h-7 ${className}`}
        >
          {showIcon && <XCircle className="w-3.5 h-3.5 shrink-0" />}
          <span>مرفوض</span>
        </span>
      );
    case 'cancelled':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-800/80 text-slate-400 border border-slate-700/60 whitespace-nowrap h-7 ${className}`}
        >
          {showIcon && <Ban className="w-3.5 h-3.5 shrink-0" />}
          <span>ملغي</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap h-7 ${className}`}
        >
          {showIcon && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
          <span>{status}</span>
        </span>
      );
  }
};

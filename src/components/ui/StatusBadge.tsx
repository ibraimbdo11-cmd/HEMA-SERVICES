import React from 'react';
import { OrderStatus } from '../../types';
import { Clock, CheckCircle2, PlayCircle, XCircle, AlertCircle, Ban } from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  showIcon = true,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm'
    ? 'px-2.5 py-0.5 text-[11px] h-6 gap-1'
    : 'px-3 py-1 text-xs h-7 gap-1.5';

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  switch (status) {
    case 'pending_review':
      return (
        <span
          className={`inline-flex items-center font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap rounded-lg ${sizeClasses} ${className}`}
        >
          {showIcon && <Clock className={`${iconSize} shrink-0`} />}
          <span>قيد المراجعة</span>
        </span>
      );
    case 'accepted':
      return (
        <span
          className={`inline-flex items-center font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 whitespace-nowrap rounded-lg ${sizeClasses} ${className}`}
        >
          {showIcon && <CheckCircle2 className={`${iconSize} shrink-0`} />}
          <span>تم القبول</span>
        </span>
      );
    case 'in_progress':
      return (
        <span
          className={`inline-flex items-center font-medium bg-sky-500/10 text-sky-400 border border-sky-500/25 whitespace-nowrap rounded-lg ${sizeClasses} ${className}`}
        >
          {showIcon && <PlayCircle className={`${iconSize} shrink-0`} />}
          <span>جاري التنفيذ</span>
        </span>
      );
    case 'completed':
      return (
        <span
          className={`inline-flex items-center font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 whitespace-nowrap rounded-lg ${sizeClasses} ${className}`}
        >
          {showIcon && <CheckCircle2 className={`${iconSize} shrink-0`} />}
          <span>مكتمل بنجاح</span>
        </span>
      );
    case 'rejected':
      return (
        <span
          className={`inline-flex items-center font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap rounded-lg ${sizeClasses} ${className}`}
        >
          {showIcon && <XCircle className={`${iconSize} shrink-0`} />}
          <span>مرفوض</span>
        </span>
      );
    case 'cancelled':
      return (
        <span
          className={`inline-flex items-center font-medium bg-slate-800/80 text-slate-400 border border-slate-700/60 whitespace-nowrap rounded-lg ${sizeClasses} ${className}`}
        >
          {showIcon && <Ban className={`${iconSize} shrink-0`} />}
          <span>ملغي</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center font-medium bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap rounded-lg ${sizeClasses} ${className}`}
        >
          {showIcon && <AlertCircle className={`${iconSize} shrink-0`} />}
          <span>{status}</span>
        </span>
      );
  }
};

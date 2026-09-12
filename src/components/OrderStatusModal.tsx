import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OrderItem } from '../types';
import { StatusBadge } from './ui/StatusBadge';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  XCircle,
  X,
  Package,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export function hasSeenOrderStatus(orderId: string, status: string, version?: number): boolean {
  try {
    const keyWithVersion = `hema_status_seen_${orderId}_${status}_${version || 1}`;
    const keyWithoutVersion = `hema_status_seen_${orderId}_${status}`;
    return (
      localStorage.getItem(keyWithVersion) === 'true' ||
      localStorage.getItem(keyWithoutVersion) === 'true'
    );
  } catch {
    return false;
  }
}

export function markOrderStatusSeen(orderId: string, status: string, version?: number): void {
  try {
    const keyWithVersion = `hema_status_seen_${orderId}_${status}_${version || 1}`;
    const keyWithoutVersion = `hema_status_seen_${orderId}_${status}`;
    localStorage.setItem(keyWithVersion, 'true');
    localStorage.setItem(keyWithoutVersion, 'true');
  } catch {
    // ignore
  }
}

interface OrderStatusModalProps {
  order: OrderItem | null;
  isOpen: boolean;
  onClose: () => void;
  onViewOrderDetails?: (orderId: string) => void;
}

export const OrderStatusModal: React.FC<OrderStatusModalProps> = ({
  order,
  isOpen,
  onClose,
  onViewOrderDetails,
}) => {
  if (!isOpen || !order) return null;

  const handleDismiss = () => {
    markOrderStatusSeen(order.id, order.status, order.statusVersion);
    onClose();
  };

  const handleViewDetails = () => {
    markOrderStatusSeen(order.id, order.status, order.statusVersion);
    onClose();
    if (onViewOrderDetails) {
      onViewOrderDetails(order.id);
    }
  };

  // Status-specific visuals
  const getStatusConfig = () => {
    switch (order.status) {
      case 'accepted':
        return {
          title: 'تم قبول طلبك بنجاح!',
          description: 'تمت مراجعة بيانات التحويل واعتماد الطلب من قبل فريق الإدارة. سيبدأ العمل عليه فوراً.',
          icon: CheckCircle2,
          iconColor: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/30',
          headerBg: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
        };
      case 'in_progress':
        return {
          title: 'طلبك قيد التنفيذ حالياً',
          description: 'فريق العمل يباشر تنفيذ الخدمة المطلوبة بأعلى معايير الجودة والاحترافية.',
          icon: Clock,
          iconColor: 'text-cyan-400',
          bgColor: 'bg-cyan-500/10',
          borderColor: 'border-cyan-500/30',
          headerBg: 'from-cyan-500/10 via-cyan-500/5 to-transparent',
        };
      case 'completed':
        return {
          title: 'تم اكتمال طلبك بنجاح! 🎉',
          description: 'تم الانتهاء من تجهيز كافة مخرجات الخدمة. يمكنك مراجعة التفاصيل والتواصل معنا إذا كانت لديك أي استفسارات.',
          icon: Sparkles,
          iconColor: 'text-amber-400',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30',
          headerBg: 'from-amber-500/10 via-amber-500/5 to-transparent',
        };
      case 'rejected':
        return {
          title: 'تم رفض الطلب',
          description: 'للأسف تعذر قبول الطلب الحالي. يرجى الاطلاع على السبب أدناه والتواصل مع الدعم الفني.',
          icon: XCircle,
          iconColor: 'text-rose-400',
          bgColor: 'bg-rose-500/10',
          borderColor: 'border-rose-500/30',
          headerBg: 'from-rose-500/10 via-rose-500/5 to-transparent',
        };
      case 'cancelled':
        return {
          title: 'تم إلغاء الطلب',
          description: 'تم تسجيل إلغاء الطلب في النظام بنجاح.',
          icon: AlertTriangle,
          iconColor: 'text-slate-400',
          bgColor: 'bg-slate-500/10',
          borderColor: 'border-slate-500/30',
          headerBg: 'from-slate-500/10 via-slate-500/5 to-transparent',
        };
      default:
        return {
          title: 'تحديث حالة الطلب',
          description: 'تم تحديث حالة طلبك من قبل النظام.',
          icon: Package,
          iconColor: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/30',
          headerBg: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 text-right font-cairo">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-[#0a0d16] border border-white/[0.09] rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header Accent Gradient */}
          <div className={`p-6 bg-gradient-to-b ${config.headerBg} border-b border-white/[0.06] relative`}>
            <button
              onClick={handleDismiss}
              className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl ${config.bgColor} border ${config.borderColor} flex items-center justify-center shrink-0 shadow-inner`}
              >
                <Icon className={`w-6 h-6 ${config.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">
                  إشعار حالة الطلب
                </span>
                <h3 className="text-lg font-bold text-slate-100 leading-snug">
                  {config.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {config.description}
                </p>
              </div>
            </div>
          </div>

          {/* Order Details Body */}
          <div className="p-6 space-y-4">
            {/* Order Summary Card */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.05] pb-2.5">
                <span className="text-xs text-slate-400 font-medium">رقم الطلب</span>
                <span className="font-mono text-xs font-bold text-emerald-400 tracking-wider" dir="ltr">
                  {order.orderNumber}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 border-b border-white/[0.05] pb-2.5">
                <span className="text-xs text-slate-400 font-medium">الخدمة</span>
                <span className="text-xs font-semibold text-slate-200 truncate max-w-[240px]">
                  {order.serviceNameSnapshot}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400 font-medium">الحالة الجديدة</span>
                <StatusBadge status={order.status} />
              </div>
            </div>

            {/* Rejection Reason Alert if applicable */}
            {order.status === 'rejected' && order.rejectionReason && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-bold block mb-0.5 text-rose-200">سبب الرفض:</span>
                  <p className="text-rose-300/90 leading-relaxed font-sans">{order.rejectionReason}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions Footer */}
          <div className="p-4 sm:p-5 bg-[#080b12] border-t border-white/[0.06] flex items-center justify-end gap-2.5">
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              إغلاق
            </button>
            {onViewOrderDetails && (
              <button
                onClick={handleViewDetails}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <span>عرض تفاصيل الطلب</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

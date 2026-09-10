import React from 'react';
import { OrderStatus } from '../types';
import { CheckCircle2, Clock, PlayCircle, CheckCheck, XCircle, Ban } from 'lucide-react';

interface OrderTimelineProps {
  status: OrderStatus;
  rejectionReason?: string;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ status, rejectionReason }) => {
  if (status === 'cancelled') {
    return (
      <div className="p-4 rounded-xl bg-[#0d121c] border border-white/[0.08] text-right">
        <div className="flex items-center gap-2 text-slate-300 mb-1">
          <Ban className="w-5 h-5 text-slate-400" />
          <span className="font-semibold text-sm">تم إلغاء هذا الطلب</span>
        </div>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          تم إلغاء هذا الطلب بنجاح. يمكنك دائماً استعراض الخدمات وتقديم طلب جديد في أي وقت.
        </p>
      </div>
    );
  }

  const steps = [
    { key: 'pending_review', label: 'قيد المراجعة', icon: Clock },
    { key: 'accepted', label: 'مقبول', icon: CheckCircle2 },
    { key: 'in_progress', label: 'جاري التنفيذ', icon: PlayCircle },
    { key: 'completed', label: 'مكتمل', icon: CheckCheck },
  ];

  const statusOrder = ['pending_review', 'accepted', 'in_progress', 'completed'];
  const currentIndex = statusOrder.indexOf(status);
  const isRejected = status === 'rejected';

  if (isRejected) {
    return (
      <div className="p-4 rounded-xl bg-[#0d121c] border border-red-500/30 text-right">
        <div className="flex items-center gap-2 text-red-400 mb-1">
          <XCircle className="w-5 h-5" />
          <span className="font-semibold text-sm">تم رفض الطلب</span>
        </div>
        {rejectionReason ? (
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            سبب الرفض: {rejectionReason}
          </p>
        ) : (
          <p className="text-xs text-slate-400 mt-1">
            تمت مراجعة الطلب وتعذر قبوله في الوقت الحالي. يمكنك التواصل مع خدمة العملاء للمزيد من التفاصيل.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full py-4 text-right">
      <div className="relative flex items-center justify-between">
        {/* Connecting line */}
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-white/[0.08] -z-0">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{
              width: `${(Math.max(0, currentIndex) / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = currentIndex >= idx;
          const isCurrent = currentIndex === idx;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCurrent
                    ? 'bg-[#080b11] border-emerald-400 text-emerald-400 shadow-sm ring-4 ring-emerald-500/10'
                    : isDone
                    ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                    : 'bg-[#121824] border-white/[0.08] text-slate-500'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`mt-2 text-xs font-semibold tracking-tight ${
                  isCurrent ? 'text-emerald-400' : isDone ? 'text-slate-200' : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

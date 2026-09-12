import React from 'react';
import {
  Bell,
  Package,
  Headphones,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { NotificationItem } from '../../../types';

interface AdminNotificationsTabProps {
  notificationsList: NotificationItem[];
  onSelectNotification?: (notif: NotificationItem) => void;
}

export const AdminNotificationsTab: React.FC<AdminNotificationsTabProps> = ({
  notificationsList,
  onSelectNotification,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-100 font-cairo">
            سجل الإشعارات والتنبيهات ({notificationsList.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            كافة التنبيهات الصادرة عن الطلبات الجديدة والمحدثة ومحادثات العملاء.
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6 rounded-2xl bg-[#0d121c] border border-white/[0.07]">
        {notificationsList.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/[0.08] text-slate-500 flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-300">لا توجد إشعارات حتى الآن</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              ستظهر هنا تنبيهات النظام الفورية عند قيام العملاء بإنشاء طلبات أو إرسال استفسارات.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notificationsList.map((notif) => (
              <div
                key={notif.id}
                onClick={() => onSelectNotification?.(notif)}
                className={`p-4 rounded-xl border transition-all duration-150 flex items-start gap-3.5 text-right ${
                  notif.read
                    ? 'bg-[#121824]/50 border-white/[0.04] text-slate-400'
                    : 'bg-[#121824] border-emerald-500/30 text-slate-200 shadow-sm'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    notif.read
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-200 truncate">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {new Date(notif.createdAt).toLocaleString('ar-EG')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {notif.body}
                  </p>

                  {notif.orderNumber && (
                    <span className="inline-block mt-2 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      طلب رقم: #{notif.orderNumber}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

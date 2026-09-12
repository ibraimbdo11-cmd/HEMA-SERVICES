import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationItem } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { Bell, CheckCheck, FileText, MessageSquare, AlertCircle, X } from 'lucide-react';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder?: (orderId: string) => void;
  onOpenSupport?: (conversationId?: string, orderId?: string) => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  isOpen,
  onClose,
  onSelectOrder,
  onOpenSupport,
}) => {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = async (notif: NotificationItem) => {
    // 1. Mark notification as read immediately
    if (!notif.isRead) {
      markAsRead(notif.id).catch(() => {});
    }

    // 2. Exact routing depending on notification type
    if (notif.type === 'new_message') {
      if (onOpenSupport) {
        onOpenSupport(notif.relatedConversationId, notif.relatedOrderId);
      }
      onClose();
    } else if (notif.relatedOrderId && onSelectOrder) {
      onSelectOrder(notif.relatedOrderId);
      onClose();
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dimmed backdrop on mobile screens */}
          <motion.div
            key="notif-mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs sm:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            key="notif-panel"
            id="notifications-dropdown-panel"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-3 top-16 sm:absolute sm:top-14 sm:right-0 sm:left-auto sm:inset-x-auto sm:w-96 max-h-[82vh] sm:max-h-[520px] bg-[#0d121c] border border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden text-right flex flex-col select-none"
          >
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06] bg-[#121824] shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-100">الإشعارات</h3>
              </div>
              <div className="flex items-center gap-3">
                {notifications.some((n) => !n.isRead) && (
                  <button
                    onClick={handleMarkAllRead}
                    id="mark-all-read-btn"
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors font-medium cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>تحديد كمقروء</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="sm:hidden p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                  aria-label="إغلاق الإشعارات"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto divide-y divide-white/[0.04] flex-1 max-h-[68vh] sm:max-h-80">
              {loading ? (
                <div className="p-6 text-center text-xs text-slate-400">جاري التحميل...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  لا توجد إشعارات جديدة.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    id={`notif-item-${notif.id}`}
                    className={`p-3.5 hover:bg-[#121824]/60 cursor-pointer transition-colors flex items-start gap-3 ${
                      !notif.isRead ? 'bg-emerald-500/[0.04]' : ''
                    }`}
                  >
                    <div className="mt-0.5 p-1.5 rounded-lg bg-[#121824] text-emerald-400 border border-white/[0.06] shrink-0">
                      {notif.type === 'order_status' ? (
                        <FileText className="w-3.5 h-3.5" />
                      ) : notif.type === 'new_message' ? (
                        <MessageSquare className="w-3.5 h-3.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4 className="text-xs font-semibold text-slate-200 truncate">
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {notif.body}
                      </p>
                      <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                        {new Date(notif.createdAt).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

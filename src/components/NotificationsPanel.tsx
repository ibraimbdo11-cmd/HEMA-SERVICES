import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationItem } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { Bell, CheckCheck, FileText, MessageSquare, AlertCircle, X } from 'lucide-react';
import { Portal } from './ui/Portal';
import { useFloatingPosition } from '../lib/useFloatingPosition';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder?: (orderId: string) => void;
  onOpenSupport?: (conversationId?: string, orderId?: string) => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  isOpen,
  onClose,
  onSelectOrder,
  onOpenSupport,
  triggerRef,
}) => {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();
  const panelRef = useRef<HTMLDivElement>(null);

  const { coords, isMobile } = useFloatingPosition({
    triggerRef,
    isOpen,
    preferredWidth: 384,
    offset: 10,
    safeMargin: 16,
  });

  // Handle ESC key and outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        (!triggerRef?.current || !triggerRef.current.contains(target))
      ) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Use mousedown with slight delay to avoid closing immediately on trigger click
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleOutsideClick);
    }, 10);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose, triggerRef]);

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
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Dimmed backdrop on mobile screens */}
            {isMobile && (
              <motion.div
                key="notif-mobile-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[998] bg-black/70 backdrop-blur-xs"
                onClick={onClose}
                aria-hidden="true"
              />
            )}

            <motion.div
              ref={panelRef}
              key="notif-panel"
              id="notifications-dropdown-panel"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              style={{
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                width: `${coords.width}px`,
                maxHeight: `${coords.maxHeight}px`,
              }}
              className="fixed z-[999] bg-[#0A0E17] border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/90 overflow-hidden text-right flex flex-col select-none ring-1 ring-emerald-500/10"
              dir="rtl"
            >
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.08] bg-[#0F1422] shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 font-cairo">الإشعارات والتنبيهات</h3>
                </div>
                <div className="flex items-center gap-3">
                  {notifications.some((n) => !n.isRead) && (
                    <button
                      onClick={handleMarkAllRead}
                      id="mark-all-read-btn"
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors font-semibold font-cairo cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>تحديد الكل كمقروء</span>
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                    aria-label="إغلاق الإشعارات"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto divide-y divide-white/[0.04] flex-1">
                {loading ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-cairo">جاري التحميل...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-xs font-cairo">
                    لا توجد إشعارات جديدة في الوقت الحالي.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleItemClick(notif)}
                      id={`notif-item-${notif.id}`}
                      className={`p-3.5 hover:bg-[#121824] cursor-pointer transition-colors flex items-start gap-3 ${
                        !notif.isRead ? 'bg-emerald-500/[0.05]' : ''
                      }`}
                    >
                      <div className="mt-0.5 p-2 rounded-xl bg-[#121927] text-emerald-400 border border-white/[0.06] shrink-0">
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
                          <h4 className="text-xs font-bold text-slate-200 truncate font-cairo">
                            {notif.title}
                          </h4>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(0,255,157,0.8)]"></span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-2 font-cairo">
                          {notif.body}
                        </p>
                        <span className="text-[10px] text-slate-500 mt-1.5 block font-mono">
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
    </Portal>
  );
};

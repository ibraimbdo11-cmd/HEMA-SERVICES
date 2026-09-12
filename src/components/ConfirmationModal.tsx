import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, LogOut, Loader2, X } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  icon?: 'trash' | 'logout' | 'alert';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  isDestructive = true,
  isLoading = false,
  disabled = false,
  icon = 'trash',
}) => {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  const IconComponent =
    icon === 'logout'
      ? LogOut
      : icon === 'trash'
      ? Trash2
      : AlertTriangle;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none"
          dir="rtl"
        >
          {/* Backdrop */}
          <motion.div
            key="confirm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            onClick={() => {
              if (!isLoading) onClose();
            }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            key="confirm-card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-desc"
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full max-w-sm sm:max-w-md bg-[#0d121c] border ${
              isDestructive ? 'border-red-500/25 shadow-red-950/20' : 'border-white/[0.08]'
            } rounded-2xl p-5 sm:p-6 shadow-2xl text-right overflow-hidden`}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                if (!isLoading) onClose();
              }}
              disabled={isLoading}
              className="absolute top-4 left-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-50"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header & Icon */}
            <div className="flex items-start gap-3.5 mb-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                  isDestructive
                    ? 'bg-red-500/15 border-red-500/30 text-red-400 shadow-sm shadow-red-500/10'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/10'
                }`}
              >
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h3
                  id="confirm-modal-title"
                  className="text-base sm:text-[17px] font-bold text-slate-100 font-cairo leading-snug"
                >
                  {title}
                </h3>
                <p
                  id="confirm-modal-desc"
                  className="text-xs sm:text-[13px] text-slate-400 font-cairo leading-relaxed mt-1.5"
                >
                  {description}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 mt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  if (!isLoading) onClose();
                }}
                disabled={isLoading}
                className="h-10 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold font-cairo transition-colors cursor-pointer disabled:opacity-50"
              >
                {cancelLabel}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading || disabled}
                id="confirmation-modal-confirm-btn"
                className={`h-10 px-5 rounded-xl text-xs font-bold font-cairo flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 active:scale-[0.98] ${
                  isDestructive
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <IconComponent className="w-4 h-4" />
                )}
                <span>{confirmLabel}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

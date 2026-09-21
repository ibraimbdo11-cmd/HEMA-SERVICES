import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, LogOut, Loader2, X } from 'lucide-react';
import { Button } from './ui/Button';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  isDestructive?: boolean;
  loading?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  icon?: 'trash' | 'logout' | 'alert';
}

/**
 * Universal Confirmation Modal for HEMA SERVICES.
 *
 * Rules:
 * - 180–220ms smooth motion (duration: 0.2s, subtle y translation: 6px -> 0, opacity).
 * - Strictly NO bounce, NO elastic, NO oversized transforms.
 * - Accessible: ARIA alertdialog, ESC to cancel, focus isolation, double-click protection when loading.
 * - RTL layout with cohesive dark theme styling.
 * - Fully respects prefers-reduced-motion.
 */
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  destructive,
  isDestructive = true,
  loading,
  isLoading = false,
  disabled = false,
  icon = 'trash',
}) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const isDestructiveActual = destructive !== undefined ? destructive : isDestructive;
  const isLoadingActual = loading !== undefined ? loading : isLoading;
  const isActionDisabled = isLoadingActual || disabled;

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  const handleDismiss = () => {
    if (isActionDisabled) return;
    if (onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    }
  };

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isActionDisabled) {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isActionDisabled]);

  const IconComponent =
    icon === 'logout'
      ? LogOut
      : icon === 'trash'
      ? Trash2
      : AlertTriangle;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 select-none"
          dir="rtl"
        >
          {/* Backdrop with fade */}
          <motion.div
            key="confirm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.01 : 0.2, ease: 'easeInOut' }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            aria-hidden="true"
          />

          {/* Modal Container: 180-220ms (0.2s), opacity + subtle directional movement, no bounce, no elastic */}
          <motion.div
            key="confirm-card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-desc"
            initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : 4 }}
            transition={{ duration: reducedMotion ? 0.01 : 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full max-w-sm sm:max-w-md bg-[#0d121c] border ${
              isDestructiveActual ? 'border-red-500/25 shadow-red-950/20' : 'border-white/[0.08]'
            } rounded-2xl p-5 sm:p-6 shadow-2xl text-right overflow-hidden`}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={handleDismiss}
              disabled={isActionDisabled}
              className="absolute top-4 left-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-50"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header & Icon */}
            <div className="flex items-start gap-3.5 mb-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                  isDestructiveActual
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
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDismiss}
                disabled={isActionDisabled}
              >
                {cancelLabel}
              </Button>

              <Button
                id="confirmation-modal-confirm-btn"
                variant={isDestructiveActual ? 'danger' : 'primary'}
                size="sm"
                loading={isLoadingActual}
                disabled={isActionDisabled}
                onClick={() => {
                  if (!isActionDisabled) {
                    onConfirm();
                  }
                }}
                icon={!isLoadingActual ? <IconComponent className="w-4 h-4" /> : undefined}
                iconPosition="start"
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
};

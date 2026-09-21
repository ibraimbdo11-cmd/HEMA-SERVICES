import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { ConfirmationModal } from './ConfirmationModal';
import { Package, Bell, Headset, Shield, LogOut, LogIn, UserPlus } from 'lucide-react';
import { Portal } from './ui/Portal';
import { useFloatingPosition } from '../lib/useFloatingPosition';

interface UserAccountMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenSupport: () => void;
  onOpenNotifications: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const UserAccountMenu: React.FC<UserAccountMenuProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenAuth,
  onOpenSupport,
  onOpenNotifications,
  triggerRef,
}) => {
  const { currentUser, profile, isAdmin, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { coords, isMobile } = useFloatingPosition({
    triggerRef,
    isOpen,
    preferredWidth: 288,
    offset: 10,
    safeMargin: 16,
  });

  // Close on Escape key press and outside clicks
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showLogoutConfirm) {
        onClose();
      }
    };

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        (!triggerRef?.current || !triggerRef.current.contains(target))
      ) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleOutsideClick);
    }, 10);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, showLogoutConfirm, onClose, triggerRef]);

  const initial = (profile?.name || currentUser?.displayName || currentUser?.email || 'H')
    .trim()[0]
    .toUpperCase();

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setShowLogoutConfirm(false);
      onNavigate('home');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <Portal>
        <AnimatePresence>
          {isOpen && (
            <>
              {isMobile && (
                <motion.div
                  key="account-mobile-backdrop"
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
                ref={menuRef}
                id="user-account-dropdown-panel"
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
                className="fixed z-[999] bg-[#0A0E17] border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/90 overflow-hidden text-right select-none ring-1 ring-emerald-500/10"
                dir="rtl"
              >
                {currentUser ? (
                  <>
                    {/* User Profile Header */}
                    <div className="p-4 border-b border-white/[0.08] bg-[#0F1422] flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-slate-800 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base shrink-0">
                        {profile?.photo ? (
                          <img
                            src={profile.photo}
                            alt={profile.name}
                            className="w-full h-full object-cover rounded-xl"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span>{initial}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-slate-100 truncate font-cairo">
                            {profile?.name || currentUser.displayName || 'العميل'}
                          </span>
                          {isAdmin && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold font-mono">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5 font-mono">{currentUser.email}</p>
                      </div>
                    </div>

                    {/* Action Links */}
                    <div className="p-2 space-y-1">
                      {isAdmin && (
                        <button
                          id="menu-item-admin"
                          type="button"
                          onClick={() => handleAction(() => onNavigate('admin'))}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-500/10 active:bg-amber-500/20 active:scale-[0.99] transition-all cursor-pointer select-none font-cairo"
                        >
                          <Shield className="w-4 h-4 text-amber-400" />
                          <span>لوحة التحكم الإدارية</span>
                        </button>
                      )}

                      <button
                        id="menu-item-orders"
                        type="button"
                        onClick={() => handleAction(() => onNavigate('orders'))}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] active:bg-emerald-500/20 active:text-emerald-300 active:scale-[0.99] transition-all cursor-pointer select-none font-cairo"
                      >
                        <Package className="w-4 h-4 text-emerald-400" />
                        <span>الطلبات</span>
                      </button>

                      <button
                        id="menu-item-notifications"
                        type="button"
                        onClick={() => handleAction(onOpenNotifications)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] active:bg-emerald-500/20 active:text-emerald-300 active:scale-[0.99] transition-all cursor-pointer select-none font-cairo"
                      >
                        <Bell className="w-4 h-4 text-emerald-400" />
                        <span>الإشعارات</span>
                      </button>

                      <button
                        id="menu-item-support"
                        type="button"
                        onClick={() => handleAction(onOpenSupport)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] active:bg-emerald-500/20 active:text-emerald-300 active:scale-[0.99] transition-all cursor-pointer select-none font-cairo"
                      >
                        <Headset className="w-4 h-4 text-emerald-400" />
                        <span>خدمة العملاء</span>
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="p-2 border-t border-white/[0.08]">
                      <button
                        id="menu-item-logout"
                        type="button"
                        disabled={isLoggingOut}
                        onClick={() => {
                          setShowLogoutConfirm(true);
                          onClose();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 active:bg-rose-500/20 active:scale-[0.99] transition-all cursor-pointer select-none disabled:opacity-50 font-cairo"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{isLoggingOut ? 'جاري الخروج...' : 'تسجيل الخروج'}</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-4 space-y-3 font-cairo">
                    <div className="text-center pb-2 border-b border-white/[0.08]">
                      <p className="text-xs text-slate-300 font-medium">سجّل الدخول للوصول إلى طلباتك والمحادثات</p>
                    </div>
                    <button
                      id="menu-item-login"
                      type="button"
                      onClick={() => handleAction(() => onOpenAuth('login'))}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00FF9D] hover:bg-[#15FFA5] text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-[0_0_12px_rgba(0,255,157,0.25)]"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>تسجيل الدخول</span>
                    </button>
                    <button
                      id="menu-item-register"
                      type="button"
                      onClick={() => handleAction(() => onOpenAuth('register'))}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-white/[0.1] hover:border-emerald-500/40 hover:bg-white/[0.06] text-slate-300 text-xs font-medium transition-all cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>إنشاء حساب جديد</span>
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </Portal>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        title="تأكيد تسجيل الخروج"
        description="هل أنت متأكد من رغبتك في تسجيل الخروج من حسابك؟"
        confirmLabel="تسجيل الخروج"
        cancelLabel="إلغاء"
        destructive={true}
        loading={isLoggingOut}
        icon="logout"
      />
    </>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { ConfirmationModal } from './ConfirmationModal';
import { Package, Bell, Headset, Shield, LogOut, LogIn, UserPlus } from 'lucide-react';

interface UserAccountMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenSupport: () => void;
  onOpenNotifications: () => void;
}

export const UserAccountMenu: React.FC<UserAccountMenuProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenAuth,
  onOpenSupport,
  onOpenNotifications,
}) => {
  const { currentUser, profile, isAdmin, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showLogoutConfirm) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showLogoutConfirm, onClose]);

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
      setShowLogoutConfirm(false);
      onClose();
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="user-account-dropdown-panel"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-14 right-0 w-72 max-w-[calc(100vw-2rem)] bg-[#0d121c] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/80 z-50 overflow-hidden text-right select-none"
          >
            {currentUser ? (
              <>
                {/* User Profile Header */}
                <div className="p-4 border-b border-white/[0.06] bg-[#121824] flex items-center gap-3">
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
                      <span className="text-sm font-semibold text-slate-100 truncate">
                        {profile?.name || currentUser.displayName || 'العميل'}
                      </span>
                      {isAdmin && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                          أدمن
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{currentUser.email}</p>
                  </div>
                </div>

                {/* Action Links */}
                <div className="p-2 space-y-1">
                  {isAdmin && (
                    <button
                      id="menu-item-admin"
                      type="button"
                      onClick={() => handleAction(() => onNavigate('admin'))}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-500/10 active:bg-amber-500/20 active:scale-[0.99] transition-all cursor-pointer select-none"
                    >
                      <Shield className="w-4 h-4 text-amber-400" />
                      <span>لوحة التحكم الإدارية</span>
                    </button>
                  )}

                  <button
                    id="menu-item-orders"
                    type="button"
                    onClick={() => handleAction(() => onNavigate('orders'))}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] active:bg-emerald-500/20 active:text-emerald-300 active:scale-[0.99] transition-all cursor-pointer select-none"
                  >
                    <Package className="w-4 h-4 text-emerald-400" />
                    <span>الطلبات</span>
                  </button>

                  <button
                    id="menu-item-notifications"
                    type="button"
                    onClick={() => handleAction(onOpenNotifications)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] active:bg-emerald-500/20 active:text-emerald-300 active:scale-[0.99] transition-all cursor-pointer select-none"
                  >
                    <Bell className="w-4 h-4 text-emerald-400" />
                    <span>الإشعارات</span>
                  </button>

                  <button
                    id="menu-item-support"
                    type="button"
                    onClick={() => handleAction(onOpenSupport)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] active:bg-emerald-500/20 active:text-emerald-300 active:scale-[0.99] transition-all cursor-pointer select-none"
                  >
                    <Headset className="w-4 h-4 text-emerald-400" />
                    <span>خدمة العملاء</span>
                  </button>
                </div>

                {/* Logout */}
                <div className="p-2 border-t border-white/[0.06]">
                  <button
                    id="menu-item-logout"
                    type="button"
                    disabled={isLoggingOut}
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 active:bg-red-500/20 active:scale-[0.99] transition-all cursor-pointer select-none disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{isLoggingOut ? 'جاري الخروج...' : 'تسجيل الخروج'}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="p-4 space-y-3">
                <div className="text-center pb-2 border-b border-white/[0.06]">
                  <p className="text-xs text-slate-300 font-medium">سجّل الدخول للوصول إلى طلباتك والمحادثات</p>
                </div>
                <button
                  id="menu-item-login"
                  type="button"
                  onClick={() => handleAction(() => onOpenAuth('login'))}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول</span>
                </button>
                <button
                  id="menu-item-register"
                  type="button"
                  onClick={() => handleAction(() => onOpenAuth('register'))}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-white/[0.1] hover:bg-white/[0.06] text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>إنشاء حساب جديد</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        title="تأكيد تسجيل الخروج"
        description="هل أنت متأكد من رغبتك في تسجيل الخروج من حسابك؟"
        confirmLabel="تسجيل الخروج"
        cancelLabel="البقاء مسجلاً"
        isDestructive={true}
        isLoading={isLoggingOut}
        icon="logout"
      />
    </>
  );
};

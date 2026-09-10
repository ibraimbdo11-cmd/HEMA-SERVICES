import React from 'react';
import { useAuth } from '../context/AuthContext';
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

  if (!isOpen) return null;

  const initial = (profile?.name || currentUser?.displayName || currentUser?.email || 'H')
    .trim()[0]
    .toUpperCase();

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      id="user-account-dropdown-panel"
      className="absolute top-14 right-0 w-72 max-w-[calc(100vw-2rem)] bg-[#0d121f] border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 z-50 overflow-hidden text-right animate-in fade-in zoom-in-95 duration-150"
    >
      {currentUser ? (
        <>
          {/* User Profile Header */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-slate-800 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base shrink-0">
              {profile?.photo ? (
                <img
                  src={profile.photo}
                  alt={profile.name}
                  className="w-full h-full object-cover rounded-lg"
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
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
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
                onClick={() => handleAction(() => onNavigate('admin'))}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span>لوحة التحكم الإدارية</span>
              </button>
            )}

            <button
              id="menu-item-orders"
              onClick={() => handleAction(() => onNavigate('orders'))}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              <Package className="w-4 h-4 text-emerald-400" />
              <span>الطلبات</span>
            </button>

            <button
              id="menu-item-notifications"
              onClick={() => handleAction(onOpenNotifications)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              <Bell className="w-4 h-4 text-emerald-400" />
              <span>الإشعارات</span>
            </button>

            <button
              id="menu-item-support"
              onClick={() => handleAction(onOpenSupport)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              <Headset className="w-4 h-4 text-emerald-400" />
              <span>خدمة العملاء</span>
            </button>
          </div>

          {/* Logout */}
          <div className="p-2 border-t border-slate-800/80">
            <button
              id="menu-item-logout"
              onClick={() => handleAction(logout)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </>
      ) : (
        <div className="p-4 space-y-3">
          <div className="text-center pb-2 border-b border-slate-800/80">
            <p className="text-xs text-slate-300 font-medium">سجّل الدخول للوصول إلى طلباتك والمحادثات</p>
          </div>
          <button
            id="menu-item-login"
            onClick={() => handleAction(() => onOpenAuth('login'))}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>تسجيل الدخول</span>
          </button>
          <button
            id="menu-item-register"
            onClick={() => handleAction(() => onOpenAuth('register'))}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60 text-slate-300 text-xs font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>إنشاء حساب جديد</span>
          </button>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Grid,
  Users,
  Bell,
  Settings,
  Shield,
  ArrowRight,
  ExternalLink,
  X,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { Logo } from '../../../components/Logo';

export type AdminTabId =
  | 'overview'
  | 'orders'
  | 'services'
  | 'users'
  | 'notifications'
  | 'settings';

interface AdminSidebarProps {
  activeTab: AdminTabId;
  onSelectTab: (tab: AdminTabId) => void;
  onBackToHome: () => void;
  adminEmail?: string;
  stats: {
    pendingOrders: number;
    totalOrders: number;
    totalServices: number;
    totalUsers: number;
    unreadCount?: number;
  };
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  onBackToHome,
  adminEmail,
  stats,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setShowLogoutConfirm(false);
      onBackToHome();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const mainNavItems = [
    {
      id: 'overview' as AdminTabId,
      label: 'الرئيسية',
      description: 'نظرة عامة ومؤشرات الأداء',
      icon: LayoutDashboard,
    },
    {
      id: 'orders' as AdminTabId,
      label: 'الطلبات',
      description: 'متابعة وتنفيذ طلبات العملاء',
      icon: Package,
      badge: stats.pendingOrders > 0 ? stats.pendingOrders : undefined,
      badgeColor: 'amber',
    },
    {
      id: 'services' as AdminTabId,
      label: 'الخدمات',
      description: 'إدارة العروض والأسعار',
      icon: Grid,
      badge: stats.totalServices > 0 ? stats.totalServices : undefined,
      badgeColor: 'neutral',
    },
    {
      id: 'users' as AdminTabId,
      label: 'المستخدمون',
      description: 'سجل العملاء والمستخدمين',
      icon: Users,
    },
  ];

  const notificationsNavItems = [
    {
      id: 'notifications' as AdminTabId,
      label: 'الإشعارات',
      description: 'تنبيهات النظام والطلبات',
      icon: Bell,
    },
  ];

  const systemNavItems = [
    {
      id: 'settings' as AdminTabId,
      label: 'إعدادات المنصة',
      description: 'المحفظة وبيانات الدفع',
      icon: Settings,
    },
  ];

  const renderNavGroup = (title: string, items: typeof mainNavItems) => (
    <div className="space-y-1.5 py-2">
      <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
        {title}
      </span>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            id={`admin-nav-${item.id}`}
            onClick={() => {
              onSelectTab(item.id);
              onCloseMobile();
            }}
            className={`w-full group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ease-out text-right cursor-pointer ${
              isActive
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200 ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-900/80 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-right min-w-0">
                <span className="block truncate font-medium text-xs text-inherit">
                  {item.label}
                </span>
                <span className="block text-[10px] text-slate-500 truncate group-hover:text-slate-400 font-normal">
                  {item.description}
                </span>
              </div>
            </div>

            {/* Badges */}
            {item.badge !== undefined && (
              <span
                className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono shrink-0 transition-all ${
                  item.badgeColor === 'amber'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : item.badgeColor === 'emerald'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {item.badge}
              </span>
            )}

            {/* Active Indicator Bar on Edge */}
            {isActive && (
              <div className="absolute right-0 top-2 bottom-2 w-1 bg-emerald-400 rounded-l-full" />
            )}
          </button>
        );
      })}
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#090d16] border-l border-white/[0.07] select-none text-right">
      {/* Brand Header */}
      <div className="p-4 border-b border-white/[0.07] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <Logo variant="monogram" className="w-9 h-9 !p-1.5" />
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-slate-100 font-cairo">لوحة الإدارة</h2>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider block mt-0.5">
              HEMA SERVICES
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onBackToHome}
            title="العودة إلى الموقع الرئيسي"
            className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/[0.06] transition-colors flex items-center gap-1 text-[11px]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[10px]">الموقع</span>
          </button>
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Links Scrollable Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {renderNavGroup('إدارة المنصة', mainNavItems)}
        <div className="h-px bg-white/[0.06] my-1" />
        {renderNavGroup('التنبيهات والمتابعة', notificationsNavItems)}
        <div className="h-px bg-white/[0.06] my-1" />
        {renderNavGroup('النظام والأمان', systemNavItems)}
      </div>

      {/* Admin Profile Footer */}
      <div className="p-3.5 border-t border-white/[0.07] bg-[#070a11] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/30">
            {adminEmail ? adminEmail.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <p className="text-xs font-semibold text-slate-200 truncate font-mono" dir="ltr">
                {adminEmail || 'admin@hema-services.com'}
              </p>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
              المدير العام • كامل الصلاحيات
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            id="admin-sidebar-logout-btn"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer shrink-0"
            title="تسجيل الخروج من الحساب"
            aria-label="تسجيل الخروج من الحساب"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-64 lg:w-72 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex text-right animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-right duration-200">
            {sidebarContent}
          </div>
        </div>
      )}

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

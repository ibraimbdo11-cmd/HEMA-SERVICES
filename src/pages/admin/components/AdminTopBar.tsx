import React from 'react';
import {
  Menu,
  RotateCw,
  ExternalLink,
  Package,
  Bell,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import { AdminTabId } from './AdminSidebar';

interface AdminTopBarProps {
  activeTab: AdminTabId;
  onOpenMobile: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  pendingOrdersCount: number;
  onNavigateToOrders: () => void;
  onBackToHome: () => void;
}

const tabTitles: Record<AdminTabId, { title: string; subtitle: string }> = {
  overview: {
    title: 'الرئيسية',
    subtitle: 'نظرة عامة ومؤشرات أداء المنصة الشاملة',
  },
  orders: {
    title: 'إدارة الطلبات',
    subtitle: 'مراجعة إثباتات الدفع واعتماد ومتابعة مسار التنفيذ',
  },
  services: {
    title: 'إدارة الخدمات',
    subtitle: 'التحكم في الخدمات البرمجية والأسعار ونسب الخصم',
  },
  users: {
    title: 'سجل المستخدمين',
    subtitle: 'بيانات العملاء وتواريخ التسجيل وحجم الطلبات',
  },
  notifications: {
    title: 'سجل الإشعارات',
    subtitle: 'تنبيهات العمليات وطلبات الخدمات ورسائل الدعم',
  },
  settings: {
    title: 'إعدادات المنصة',
    subtitle: 'إدارة أرقام المحافظ الإلكترونية وبيانات الاستلام',
  },
};

export const AdminTopBar: React.FC<AdminTopBarProps> = ({
  activeTab,
  onOpenMobile,
  onRefresh,
  isRefreshing,
  pendingOrdersCount,
  onNavigateToOrders,
  onBackToHome,
}) => {
  const meta = tabTitles[activeTab] || { title: 'لوحة الإدارة', subtitle: '' };

  return (
    <header className="sticky top-0 z-20 bg-[#070a11]/90 backdrop-blur-md border-b border-white/[0.07] px-4 sm:px-6 py-3.5 flex items-center justify-between text-right">
      {/* Right side: Mobile Menu Button & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobile}
          type="button"
          aria-label="فتح القائمة"
          className="md:hidden p-2 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>لوحة التحكم</span>
            <ChevronLeft className="w-3 h-3 text-slate-600" />
            <span className="text-emerald-400 font-semibold">{meta.title}</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-100 truncate mt-0.5">
            {meta.title}
          </h1>
        </div>
      </div>

      {/* Left side: Quick Notification Chips, Refresh & Shortcuts */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Pending Orders Chip */}
        {pendingOrdersCount > 0 && (
          <button
            onClick={onNavigateToOrders}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold transition-all"
            title="عرض الطلبات قيد المراجعة"
          >
            <Package className="w-3.5 h-3.5" />
            <span>{pendingOrdersCount} قيد المراجعة</span>
          </button>
        )}

        {/* Data Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 disabled:opacity-50 text-slate-400 hover:text-white border border-white/[0.08] transition-colors"
          title="تحديث البيانات"
        >
          <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
        </button>

        {/* External Link to Home */}
        <button
          onClick={onBackToHome}
          className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 text-xs font-bold transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>معاينة الموقع</span>
        </button>
      </div>
    </header>
  );
};

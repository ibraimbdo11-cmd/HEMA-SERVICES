import React from 'react';
import {
  Users,
  Grid,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  ExternalLink,
  Eye,
  Plus,
} from 'lucide-react';
import { DashboardOverviewKPI, OrderItem } from '../../../types';
import { StatusBadge } from '../../../components/ui/StatusBadge';

interface AdminOverviewTabProps {
  kpi: DashboardOverviewKPI;
  recentOrders: OrderItem[];
  isLoading: boolean;
  onSelectOrder: (order: OrderItem) => void;
  onNavigateToTab: (tab: any) => void;
  onAddNewService: () => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  kpi,
  recentOrders,
  isLoading,
  onSelectOrder,
  onNavigateToTab,
  onAddNewService,
}) => {
  const kpiItems = [
    {
      id: 'totalUsers',
      label: 'إجمالي المستخدمين',
      value: kpi.totalUsers,
      subtext: 'عملاء ومستخدمون مسجلون',
      icon: Users,
      color: 'blue',
      borderClass: 'border-white/[0.07] hover:border-blue-500/30',
      iconBg: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      actionTab: 'users',
    },
    {
      id: 'totalServices',
      label: 'إجمالي الخدمات',
      value: kpi.totalServices,
      subtext: 'خدمات متاحة للطلب',
      icon: Grid,
      color: 'emerald',
      borderClass: 'border-white/[0.07] hover:border-emerald-500/30',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      actionTab: 'services',
    },
    {
      id: 'totalOrders',
      label: 'إجمالي الطلبات',
      value: kpi.totalOrders,
      subtext: 'كافة الطلبات المسجلة',
      icon: Package,
      color: 'slate',
      borderClass: 'border-white/[0.07] hover:border-white/[0.15]',
      iconBg: 'bg-slate-800 text-slate-300 border border-white/[0.1]',
      actionTab: 'orders',
    },
    {
      id: 'pendingOrders',
      label: 'طلبات قيد المراجعة',
      value: kpi.pendingOrders,
      subtext: kpi.pendingOrders > 0 ? 'تحتاج إلى مراجعة الدفع' : 'لا توجد طلبات معلقة',
      icon: Clock,
      color: 'amber',
      borderClass: kpi.pendingOrders > 0 ? 'border-amber-500/30 bg-amber-500/[0.03]' : 'border-white/[0.07]',
      iconBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      actionTab: 'orders',
      isUrgent: kpi.pendingOrders > 0,
    },
    {
      id: 'completedOrders',
      label: 'طلبات مكتملة',
      value: kpi.completedOrders,
      subtext: 'تم تسليمها بنجاح',
      icon: CheckCircle2,
      color: 'emerald',
      borderClass: 'border-white/[0.07] hover:border-emerald-500/30',
      iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      actionTab: 'orders',
    },
    {
      id: 'rejectedOrders',
      label: 'طلبات مرفوضة',
      value: kpi.rejectedOrders,
      subtext: 'ملغاة أو غير مطابقة',
      icon: XCircle,
      color: 'red',
      borderClass: 'border-white/[0.07] hover:border-red-500/30',
      iconBg: 'bg-red-500/10 text-red-400 border border-red-500/20',
      actionTab: 'orders',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-950/20 via-[#0d121f] to-[#0d121f] border border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <h2 className="text-sm sm:text-base font-bold text-slate-100 font-cairo">
              نظرة عامة على النشاط التجاري
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            مرحباً بك في مركز إدارة المنصة. يمكنك متابعة واعتماد الطلبات والتواصل المباشر مع العملاء عبر خدمة العملاء.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={onAddNewService}
            id="overview-quick-add-service"
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة خدمة جديدة</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-[#0d121c] border border-white/[0.06] animate-pulse space-y-3"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800" />
                <div className="h-6 w-16 bg-slate-800 rounded" />
                <div className="h-3 w-24 bg-slate-800/60 rounded" />
              </div>
            ))
          : kpiItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => onNavigateToTab(item.actionTab)}
                  className={`p-4 rounded-2xl bg-[#0d121c] border transition-all duration-200 cursor-pointer group flex flex-col justify-between ${item.borderClass}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {item.isUrgent && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    )}
                  </div>

                  <div>
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-100 tracking-tight block">
                      {item.value}
                    </span>
                    <span className="text-xs font-semibold text-slate-300 block mt-1 truncate">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                      {item.subtext}
                    </span>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Recent Orders Section */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#0d121c] border border-white/[0.07] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100">أحدث الطلبات</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              آخر العمليات والطلبات المقدمة من العملاء
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('orders')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>كافة الطلبات ({kpi.totalOrders})</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </button>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#121824] border-b border-white/[0.06] text-slate-400 select-none">
              <tr>
                <th className="py-3.5 px-4 font-semibold">رقم الطلب</th>
                <th className="py-3.5 px-4 font-semibold">العميل</th>
                <th className="py-3.5 px-4 font-semibold">الخدمة المطلوبة</th>
                <th className="py-3.5 px-4 font-semibold">المبلغ</th>
                <th className="py-3.5 px-4 font-semibold">التاريخ</th>
                <th className="py-3.5 px-4 font-semibold">الحالة</th>
                <th className="py-3.5 px-4 font-semibold text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    لا توجد طلبات مسجلة حتى الآن.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-[#121824]/60 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {order.userName}
                    </td>
                    <td className="py-3.5 px-4 max-w-[200px] truncate text-slate-300">
                      {order.serviceNameSnapshot}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold">
                      {order.price.toLocaleString()} ج.م
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => {
                          onSelectOrder(order);
                          onNavigateToTab('orders');
                        }}
                        className="h-8 px-3 rounded-lg bg-[#121824] hover:bg-emerald-500 hover:text-slate-950 text-slate-200 text-xs font-semibold transition-all border border-white/[0.08] flex items-center gap-1.5 mx-auto cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>عرض</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Stacked Cards (Zero horizontal overflow) */}
        <div className="md:hidden space-y-3">
          {recentOrders.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              لا توجد طلبات مسجلة حتى الآن.
            </div>
          ) : (
            recentOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => {
                  onSelectOrder(order);
                  onNavigateToTab('orders');
                }}
                className="p-4 rounded-xl bg-[#121824]/70 border border-white/[0.06] space-y-3 active:scale-[0.99] transition-transform cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {order.orderNumber}
                  </span>
                  <StatusBadge status={order.status} size="sm" />
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-200 truncate">
                    {order.serviceNameSnapshot}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    العميل: <span className="text-slate-300">{order.userName}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
                  <span className="font-mono text-emerald-400 font-bold">
                    {order.price.toLocaleString()} ج.م
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

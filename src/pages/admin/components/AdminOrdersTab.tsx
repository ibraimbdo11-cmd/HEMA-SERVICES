import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  CheckCircle2,
  XCircle,
  PlayCircle,
  ExternalLink,
  MessageSquare,
  X,
  Eye,
  Calendar,
  CreditCard,
  User,
  FileText,
  Filter,
  Maximize2,
  Headphones,
} from 'lucide-react';
import { OrderItem, OrderStatus } from '../../../types';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { OrderTimeline } from '../../../components/OrderTimeline';

interface AdminOrdersTabProps {
  ordersList: OrderItem[];
  selectedOrder: OrderItem | null;
  onSelectOrder: (order: OrderItem | null) => void;
  orderFilter: string;
  onSetFilter: (filter: string) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus, reason?: string) => Promise<void>;
  onRequestRejectOrder: (order: OrderItem) => void;
  onOpenCustomerChat: (order: OrderItem) => void;
  onViewImageLightbox: (item: { url: string; name?: string }) => void;
}

export const AdminOrdersTab: React.FC<AdminOrdersTabProps> = ({
  ordersList,
  selectedOrder,
  onSelectOrder,
  orderFilter,
  onSetFilter,
  onUpdateStatus,
  onRequestRejectOrder,
  onOpenCustomerChat,
  onViewImageLightbox,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filterOptions = [
    { id: 'all', label: 'الكل' },
    { id: 'pending_review', label: 'قيد المراجعة' },
    { id: 'accepted', label: 'مقبول' },
    { id: 'in_progress', label: 'جاري التنفيذ' },
    { id: 'completed', label: 'مكتمل' },
    { id: 'rejected', label: 'مرفوض' },
  ];

  // Filter and search
  const filteredOrders = useMemo(() => {
    return ordersList.filter((order) => {
      const matchesStatus = orderFilter === 'all' ? true : order.status === orderFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        order.orderNumber.toLowerCase().includes(query) ||
        order.userName.toLowerCase().includes(query) ||
        order.serviceNameSnapshot.toLowerCase().includes(query) ||
        (order.userEmail && order.userEmail.toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [ordersList, orderFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-100 font-cairo">
            إدارة ومتابعة الطلبات ({filteredOrders.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            مراجعة إيصالات التحويل واعتماد الطلبات ومتابعة مراحل التنفيذ والتسليم.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالرقم، العميل، أو الخدمة..."
            className="w-full bg-[#0d121f] border border-white/[0.08] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 rounded-xl pr-9 pl-4 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs Pills */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0d121c] border border-white/[0.06] overflow-x-auto custom-scrollbar">
        {filterOptions.map((opt) => {
          const count =
            opt.id === 'all'
              ? ordersList.length
              : ordersList.filter((o) => o.status === opt.id).length;
          const isActive = orderFilter === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => onSetFilter(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>{opt.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Order Detailed Drawer / Panel */}
      {selectedOrder && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#0e1424] to-[#0a0d16] border border-emerald-500/30 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start sm:items-center justify-between border-b border-white/[0.08] pb-4 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {selectedOrder.orderNumber}
                </span>
                <StatusBadge status={selectedOrder.status} size="sm" />
              </div>
              <h3 className="text-base font-bold text-slate-100 mt-1.5">
                {selectedOrder.serviceNameSnapshot}
              </h3>
            </div>

            <button
              onClick={() => onSelectOrder(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="إغلاق التفاصيل"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Timeline */}
          <OrderTimeline
            status={selectedOrder.status}
            rejectionReason={selectedOrder.rejectionReason}
          />

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Customer Info Card */}
            <div className="p-4 rounded-xl bg-[#090d16] border border-white/[0.06] space-y-2.5">
              <div className="flex items-center gap-2 text-slate-200 font-bold border-b border-white/[0.06] pb-2">
                <User className="w-4 h-4 text-emerald-400" />
                <span>بيانات العميل</span>
              </div>
              <p className="text-slate-300">
                الاسم: <span className="font-semibold text-slate-100">{selectedOrder.userName}</span>
              </p>
              <p className="text-slate-400">
                البريد الإلكتروني:{' '}
                <span className="font-mono text-slate-300" dir="ltr">
                  {selectedOrder.userEmail}
                </span>
              </p>
              <p className="text-slate-400">
                تاريخ الطلب:{' '}
                <span className="font-mono text-slate-300">
                  {new Date(selectedOrder.createdAt).toLocaleString('ar-EG')}
                </span>
              </p>
            </div>

            {/* Payment & Receipt Card */}
            <div className="p-4 rounded-xl bg-[#090d16] border border-white/[0.06] space-y-2.5">
              <div className="flex items-center gap-2 text-slate-200 font-bold border-b border-white/[0.06] pb-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>طريقة الدفع وإثبات التحويل</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">وسيلة الدفع:</span>
                <span className="text-slate-200 font-semibold">{selectedOrder.paymentMethod}</span>
              </div>
              {selectedOrder.senderWalletNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">رقم المحفظة المُحول منها:</span>
                  <span className="font-mono text-emerald-400 font-bold" dir="ltr">
                    {selectedOrder.senderWalletNumber}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">المبلغ الإجمالي:</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  {selectedOrder.price.toLocaleString()} ج.م
                </span>
              </div>

              {/* Receipt Thumbnail and Lightbox Opener */}
              {selectedOrder.paymentProof && (
                <div className="pt-2 border-t border-white/[0.06] flex items-center gap-3">
                  <div
                    onClick={() =>
                      onViewImageLightbox({
                        url: selectedOrder.paymentProof,
                        name: `إثبات تحويل - طلب ${selectedOrder.orderNumber}`,
                      })
                    }
                    className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/[0.1] bg-slate-950 shrink-0 group cursor-pointer"
                  >
                    <img
                      src={selectedOrder.paymentProof}
                      alt="إيصال التحويل"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Maximize2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-300 block">
                      صورة الإيصال المرفق
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onViewImageLightbox({
                          url: selectedOrder.paymentProof,
                          name: `إثبات تحويل - طلب ${selectedOrder.orderNumber}`,
                        })
                      }
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 underline inline-flex items-center gap-1 mt-0.5 cursor-pointer"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>تكبير ومعاينة الإيصال</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Customer Requirements */}
          {selectedOrder.customerRequirements && (
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-bold">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>متطلبات وتفاصيل العميل:</span>
              </div>
              <div className="p-4 rounded-xl bg-[#090d16] border border-white/[0.06] text-slate-200 leading-relaxed whitespace-pre-line text-xs font-normal">
                {selectedOrder.customerRequirements}
              </div>
            </div>
          )}

          {/* Action Bar (Status progression & Contact in Customer Support) */}
          <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {selectedOrder.status === 'pending_review' && (
                <>
                  <button
                    onClick={() => onUpdateStatus(selectedOrder.id, 'accepted')}
                    id="accept-order-btn"
                    className="h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm shadow-emerald-500/20 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>قبول واعتماد الطلب</span>
                  </button>
                  <button
                    onClick={() => onRequestRejectOrder(selectedOrder)}
                    id="reject-order-btn"
                    className="h-9 px-4 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>رفض الطلب</span>
                  </button>
                </>
              )}

              {selectedOrder.status === 'accepted' && (
                <button
                  onClick={() => onUpdateStatus(selectedOrder.id, 'in_progress')}
                  id="start-progress-order-btn"
                  className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>بدء التنفيذ الفعلي</span>
                </button>
              )}

              {selectedOrder.status === 'in_progress' && (
                <button
                  onClick={() => onUpdateStatus(selectedOrder.id, 'completed')}
                  id="complete-order-btn"
                  className="h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm shadow-emerald-500/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تسليم وإكمال الطلب</span>
                </button>
              )}
            </div>

            {/* Direct Open in Customer Support */}
            <button
              onClick={() => onOpenCustomerChat(selectedOrder)}
              className="h-9 px-4 rounded-xl bg-[#090d16] hover:bg-slate-800 border border-white/[0.1] text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Headphones className="w-4 h-4 text-emerald-400" />
              <span>مراسلة العميل في خدمة العملاء</span>
            </button>
          </div>
        </div>
      )}

      {/* Orders Table (Desktop) */}
      <div className="hidden md:block p-4 sm:p-6 rounded-2xl bg-[#0d121c] border border-white/[0.07] overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-[#121824] border-b border-white/[0.06] text-slate-400 select-none">
            <tr>
              <th className="py-3.5 px-4 font-semibold">رقم الطلب</th>
              <th className="py-3.5 px-4 font-semibold">العميل</th>
              <th className="py-3.5 px-4 font-semibold">الخدمة</th>
              <th className="py-3.5 px-4 font-semibold">المبلغ</th>
              <th className="py-3.5 px-4 font-semibold">التاريخ</th>
              <th className="py-3.5 px-4 font-semibold">الحالة</th>
              <th className="py-3.5 px-4 font-semibold text-center">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-slate-300">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                  لا توجد طلبات مطابقة لمعايير البحث أو التصفية الحالية.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                return (
                  <tr
                    key={order.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-emerald-950/20' : 'hover:bg-[#121824]/60'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">{order.userName}</td>
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
                        onClick={() => onSelectOrder(order)}
                        className={`h-8 px-3.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                            : 'bg-[#121824] hover:bg-emerald-500 hover:text-slate-950 text-slate-200 border-white/[0.08]'
                        }`}
                      >
                        {isSelected ? 'المحدد حالياً' : 'عرض الطلب'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Orders Responsive Stacked Cards (Mobile - Zero horizontal overflow) */}
      <div className="md:hidden space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs bg-[#0d121c] rounded-2xl border border-white/[0.06]">
            لا توجد طلبات مطابقة للمعايير.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isSelected = selectedOrder?.id === order.id;
            return (
              <div
                key={order.id}
                onClick={() => onSelectOrder(order)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                  isSelected
                    ? 'bg-[#121824] border-emerald-500/50 shadow-md shadow-emerald-500/10'
                    : 'bg-[#0d121c] border-white/[0.06] active:bg-[#121824]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-emerald-400 text-xs">
                    {order.orderNumber}
                  </span>
                  <StatusBadge status={order.status} size="sm" />
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-200 line-clamp-1">
                    {order.serviceNameSnapshot}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">العميل: {order.userName}</p>
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
            );
          })
        )}
      </div>
    </div>
  );
};

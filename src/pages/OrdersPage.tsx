import React, { useState, useEffect } from 'react';
import { OrderItem } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { OrderTimeline } from '../components/OrderTimeline';
import { StatusBadge } from '../components/ui/StatusBadge';
import { OrderItemSkeleton } from '../components/ui/Skeleton';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { markOrderStatusSeen } from '../components/OrderStatusModal';
import {
  Package,
  Calendar,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  Shield,
  Loader2,
  X,
  FileImage,
  Ban,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface OrdersPageProps {
  onOpenSupportForOrder: (orderId: string, orderNumber: string) => void;
  onExploreServices: () => void;
  selectedOrderId?: string | null;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  onOpenSupportForOrder,
  onExploreServices,
  selectedOrderId,
}) => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<OrderItem | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

  // Cancellation state
  const [orderToCancel, setOrderToCancel] = useState<OrderItem | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getOrders();
      setOrders(data);

      if (selectedOrderId) {
        const found = data.find((o) => o.id === selectedOrderId);
        if (found) setActiveOrder(found);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOrders([]);
    setActiveOrder(null);
    setOrderToCancel(null);
    setCancelError(null);
    setCancelSuccess(null);
    if (currentUser) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [currentUser?.uid, selectedOrderId]);

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    try {
      setCancelling(true);
      setCancelError(null);
      await api.cancelOrder(orderToCancel.id);
      markOrderStatusSeen(orderToCancel.id, 'cancelled', (orderToCancel.statusVersion || 1) + 1);
      setCancelSuccess(`تم إلغاء الطلب ${orderToCancel.orderNumber} بنجاح.`);

      // Update local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderToCancel.id ? { ...o, status: 'cancelled' } : o))
      );
      if (activeOrder && activeOrder.id === orderToCancel.id) {
        setActiveOrder((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
      }
      setTimeout(() => {
        setOrderToCancel(null);
        setCancelSuccess(null);
      }, 1500);
    } catch (err: any) {
      setCancelError(err.message || 'تعذر إلغاء الطلب، يرجى المحاولة مرة أخرى.');
    } finally {
      setCancelling(false);
    }
  };

  const pendingCount = orders.filter((o) => o.status === 'pending_review').length;
  const inProgressCount = orders.filter((o) => o.status === 'accepted' || o.status === 'in_progress').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled' || o.status === 'rejected').length;

  const filteredOrders = orders.filter((o) => {
    if (filterTab === 'pending') return o.status === 'pending_review';
    if (filterTab === 'in_progress') return o.status === 'accepted' || o.status === 'in_progress';
    if (filterTab === 'completed') return o.status === 'completed';
    if (filterTab === 'cancelled') return o.status === 'cancelled' || o.status === 'rejected';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-right">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 flex items-center gap-2.5 tracking-tight font-cairo">
            <Package className="w-7 h-7 text-emerald-400" />
            <span>الطلبات</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium font-cairo">
            متابعة حالة طلباتك البرمجية، إدارتها أو إلغائها ومراجعة مراحل التنفيذ.
          </p>
        </div>

        {orders.length > 0 && (
          <button
            onClick={onExploreServices}
            id="orders-new-request-btn"
            className="self-start sm:self-auto h-10 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 text-xs font-bold font-cairo transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <span>طلب خدمة جديدة</span>
          </button>
        )}
      </div>

      {/* Filter Tabs Bar (if orders exist) */}
      {!loading && orders.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 scrollbar-none text-xs font-bold font-cairo">
          <button
            onClick={() => setFilterTab('all')}
            className={`h-9 px-3.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-[#0e1320] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
            }`}
          >
            <span>الكل</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[11px] ${filterTab === 'all' ? 'bg-slate-950/20 text-slate-950' : 'bg-white/[0.06] text-slate-400'}`}>
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setFilterTab('pending')}
            className={`h-9 px-3.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-[#0e1320] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
            }`}
          >
            <span>قيد المراجعة</span>
            {pendingCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-md text-[11px] ${filterTab === 'pending' ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/20 text-amber-300'}`}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterTab('in_progress')}
            className={`h-9 px-3.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'in_progress'
                ? 'bg-blue-500 text-slate-950 shadow-sm'
                : 'bg-[#0e1320] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
            }`}
          >
            <span>قيد التنفيذ</span>
            {inProgressCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-md text-[11px] ${filterTab === 'in_progress' ? 'bg-slate-950/20 text-slate-950' : 'bg-blue-500/20 text-blue-300'}`}>
                {inProgressCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterTab('completed')}
            className={`h-9 px-3.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'completed'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-[#0e1320] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
            }`}
          >
            <span>مكتملة</span>
            {completedCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-md text-[11px] ${filterTab === 'completed' ? 'bg-slate-950/20 text-slate-950' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {completedCount}
              </span>
            )}
          </button>

          {cancelledCount > 0 && (
            <button
              onClick={() => setFilterTab('cancelled')}
              className={`h-9 px-3.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'cancelled'
                  ? 'bg-rose-500 text-slate-100 shadow-sm'
                  : 'bg-[#0e1320] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
              }`}
            >
              <span>ملغاة ومرفوضة</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[11px] ${filterTab === 'cancelled' ? 'bg-slate-950/20 text-slate-100' : 'bg-rose-500/20 text-rose-300'}`}>
                {cancelledCount}
              </span>
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <OrderItemSkeleton key={n} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 px-6 bg-[#0d121c] border border-white/[0.07] rounded-3xl text-center space-y-5 max-w-lg mx-auto shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-[#121824] border border-white/[0.08] flex items-center justify-center text-slate-400 mx-auto">
            <Package className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-100 font-cairo">
              لا توجد طلبات حتى الآن
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium font-cairo">
              لم تقم بطلب أي خدمة بعد. تصفح الخدمات واختر ما يناسب فكرتك الرقمية.
            </p>
          </div>
          <button
            onClick={onExploreServices}
            id="orders-empty-explore-btn"
            className="h-11 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-extrabold text-xs sm:text-sm font-cairo transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            استعرض الخدمات
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-14 px-6 bg-[#0d121c] border border-white/[0.07] rounded-3xl text-center space-y-4 max-w-md mx-auto">
          <p className="text-xs sm:text-sm text-slate-400 font-medium font-cairo">
            لا توجد طلبات تطابق التصنيف المختار.
          </p>
          <button
            onClick={() => setFilterTab('all')}
            className="h-9 px-4 rounded-xl bg-[#121824] hover:bg-[#172030] text-emerald-400 border border-emerald-500/30 text-xs font-bold font-cairo cursor-pointer"
          >
            عرض كافة الطلبات
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.map((order) => {
            const canCancel = order.status === 'pending_review' || order.status === 'accepted';

            return (
              <div
                key={order.id}
                id={`order-card-${order.id}`}
                className="p-5 sm:p-6 rounded-3xl bg-[#0d121c] border border-white/[0.07] hover:border-white/[0.14] transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-lg shadow-black/20"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-[#121824] border border-white/[0.08] flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                    <Package className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs text-slate-400 font-bold tracking-wider">
                        {order.orderNumber}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-100 font-cairo truncate">
                      {order.serviceNameSnapshot}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400 pt-0.5 flex-wrap font-medium">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {new Date(order.createdAt).toLocaleDateString('ar-EG', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="font-extrabold text-emerald-400 font-mono text-sm">
                        {order.price.toLocaleString()} ج.م
                      </span>
                      {order.senderWalletNumber && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            {order.senderWalletNumber}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 self-end md:self-center flex-wrap pt-2 md:pt-0">
                  <button
                    onClick={() => onOpenSupportForOrder(order.id, order.orderNumber)}
                    id={`chat-order-btn-${order.id}`}
                    className="h-10 px-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 text-xs font-bold font-cairo transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    title="محادثة الدعم لهذا الطلب"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>محادثة الطلب</span>
                  </button>

                  {canCancel && (
                    <button
                      onClick={() => setOrderToCancel(order)}
                      id={`cancel-order-btn-${order.id}`}
                      className="h-10 px-3.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 text-xs font-bold font-cairo transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>إلغاء</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveOrder(order)}
                    id={`view-order-details-${order.id}`}
                    className="h-10 px-4 rounded-xl bg-[#121824] hover:bg-[#172030] text-slate-200 hover:text-white text-xs font-bold font-cairo transition-all border border-white/[0.08] cursor-pointer whitespace-nowrap"
                  >
                    عرض التفاصيل
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Order Cancellation */}
      <ConfirmationModal
        isOpen={Boolean(orderToCancel)}
        onClose={() => {
          if (!cancelling) {
            setOrderToCancel(null);
            setCancelError(null);
            setCancelSuccess(null);
          }
        }}
        onConfirm={handleConfirmCancel}
        title="تأكيد إلغاء الطلب"
        description={
          orderToCancel
            ? `طلبك رقم #${orderToCancel.orderNumber} (${orderToCancel.serviceNameSnapshot}) سيتم إلغاؤه وتتوقف متابعته.`
            : ''
        }
        confirmLabel="نعم، تأكيد الإلغاء"
        cancelLabel="تراجع"
        isDestructive={true}
        icon="alert"
        isLoading={cancelling}
      />

      {/* Order Details Modal */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 text-right">
          <div className="w-full max-w-2xl bg-[#0d121c] border border-white/[0.08] rounded-2xl shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">تفاصيل الطلب:</span>
                  <span className="font-mono text-xs font-bold text-emerald-400 tracking-wider">
                    {activeOrder.orderNumber}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-100 mt-1">
                  {activeOrder.serviceNameSnapshot}
                </h2>
              </div>
              <button
                onClick={() => setActiveOrder(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#121824]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Timeline */}
            <div className="p-5 rounded-xl bg-[#121824] border border-white/[0.06]">
              <span className="text-xs text-slate-300 font-semibold block mb-3.5">
                مراحل حالة الطلب:
              </span>
              <OrderTimeline
                status={activeOrder.status}
                rejectionReason={activeOrder.rejectionReason}
              />
            </div>

            {/* Requirements */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300">متطلبات المشروع المقدمة:</span>
              <p className="p-4 rounded-xl bg-[#07090e] border border-white/[0.07] text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                {activeOrder.customerRequirements}
              </p>
            </div>

            {/* Payment & Proof Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#121824] border border-white/[0.06] space-y-2.5">
                <span className="text-slate-300 block font-semibold">بيانات الدفع:</span>
                <div className="flex justify-between">
                  <span className="text-slate-400">طريقة الدفع:</span>
                  <span className="text-slate-200 font-medium">{activeOrder.paymentMethod}</span>
                </div>
                {activeOrder.senderWalletNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">المحفظة المُحول منها:</span>
                    <span className="text-emerald-400 font-mono font-bold">{activeOrder.senderWalletNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">المبلغ المسدد:</span>
                  <span className="text-emerald-400 font-bold font-mono">{activeOrder.price.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">تاريخ الطلب:</span>
                  <span className="text-slate-300">
                    {new Date(activeOrder.createdAt).toLocaleString('ar-EG')}
                  </span>
                </div>
              </div>

              {/* Payment proof preview */}
              <div className="p-4 rounded-xl bg-[#121824] border border-white/[0.06] space-y-2.5">
                <span className="text-slate-300 block font-semibold">إثبات التحويل المرفق:</span>
                <div className="flex items-center gap-3 pt-1">
                  <img
                    src={activeOrder.paymentProof}
                    alt="إثبات التحويل"
                    className="w-16 h-16 rounded-xl object-cover border border-white/[0.08] bg-[#07090e] cursor-pointer hover:opacity-85 transition-opacity"
                    onClick={() => setPreviewReceiptUrl(activeOrder.paymentProof)}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-slate-300 font-medium block truncate">
                      {activeOrder.paymentProofFilename || 'صورة التحويل'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewReceiptUrl(activeOrder.paymentProof)}
                      className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1 mt-1 font-bold cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>معاينة الإيصال</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions: Cancel & Chat */}
            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-2.5">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    onOpenSupportForOrder(activeOrder.id, activeOrder.orderNumber);
                    setActiveOrder(null);
                  }}
                  id="open-order-chat-btn"
                  className="h-10 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-xs sm:text-sm font-cairo transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>محادثة الطلب</span>
                </button>

                {(activeOrder.status === 'pending_review' || activeOrder.status === 'accepted') && (
                  <button
                    onClick={() => {
                      setOrderToCancel(activeOrder);
                    }}
                    id="modal-cancel-order-btn"
                    className="h-10 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>إلغاء الطلب</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setActiveOrder(null)}
                className="h-10 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Receipt Image */}
      {previewReceiptUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewReceiptUrl(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0c1018] p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08] mb-2 text-right">
              <span className="text-xs font-bold text-slate-200 font-cairo">إيصال التحويل المرفق</span>
              <button
                onClick={() => setPreviewReceiptUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={previewReceiptUrl}
              alt="معاينة كاملة لإيصال التحويل"
              className="max-h-[75vh] w-auto mx-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

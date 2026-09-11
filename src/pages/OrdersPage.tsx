import React, { useState, useEffect } from 'react';
import { OrderItem } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { OrderTimeline } from '../components/OrderTimeline';
import { StatusBadge } from '../components/ui/StatusBadge';
import { OrderItemSkeleton } from '../components/ui/Skeleton';
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-right">
      {/* Title */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 flex items-center gap-2.5 tracking-tight">
            <Package className="w-7 h-7 text-emerald-400" />
            <span>الطلبات</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            متابعة حالة طلباتك البرمجية، إدارتها أو إلغائها ومراجعة مراحل التنفيذ.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <OrderItemSkeleton key={n} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 px-6 bg-[#0d121c] border border-white/[0.07] rounded-2xl text-center space-y-5 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#121824] border border-white/[0.08] flex items-center justify-center text-slate-400 mx-auto">
            <Package className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-slate-100">
              لا توجد طلبات حتى الآن
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              لم تقم بطلب أي خدمة بعد. تصفح الخدمات واختر ما يناسب فكرتك الرقمية.
            </p>
          </div>
          <button
            onClick={onExploreServices}
            id="orders-empty-explore-btn"
            className="h-11 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:translate-y-px text-slate-950 font-semibold text-xs sm:text-sm transition-all shadow-sm"
          >
            استعرض الخدمات
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {orders.map((order) => {
            const canCancel = order.status === 'pending_review' || order.status === 'accepted';

            return (
              <div
                key={order.id}
                id={`order-card-${order.id}`}
                className="p-5 rounded-2xl bg-[#0d121c] border border-white/[0.07] hover:border-white/[0.12] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#121824] border border-white/[0.07] flex items-center justify-center text-emerald-400 shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs text-slate-400 font-semibold tracking-wider">
                        {order.orderNumber}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold text-slate-100">
                      {order.serviceNameSnapshot}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400 pt-0.5">
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
                      <span className="font-semibold text-emerald-400 font-mono">
                        {order.price.toLocaleString()} ج.م
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 self-end md:self-center flex-wrap pt-2 md:pt-0">
                  {canCancel && (
                    <button
                      onClick={() => setOrderToCancel(order)}
                      id={`cancel-order-btn-${order.id}`}
                      className="h-10 px-3.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>إلغاء الطلب</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveOrder(order)}
                    id={`view-order-details-${order.id}`}
                    className="h-10 px-4 rounded-xl bg-[#121824] hover:bg-emerald-500 hover:text-slate-950 text-slate-200 text-xs font-semibold transition-all border border-white/[0.08]"
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
      {orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 text-right">
          <div className="w-full max-w-md bg-[#0d121c] border border-white/[0.08] rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-semibold text-slate-100">
                هل أنت متأكد من إلغاء هذا الطلب؟
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                طلبك رقم <span className="font-mono text-emerald-400 font-semibold">{orderToCancel.orderNumber}</span> ({orderToCancel.serviceNameSnapshot}) سيتم إلغاؤه وتتوقف متابعته.
              </p>
            </div>

            {cancelError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                {cancelError}
              </div>
            )}

            {cancelSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 justify-center">
                <CheckCircle className="w-4 h-4" />
                <span>{cancelSuccess}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.06]">
              <button
                onClick={() => setOrderToCancel(null)}
                disabled={cancelling}
                className="h-10 px-4 rounded-xl bg-[#121824] hover:bg-[#172030] border border-white/[0.08] text-slate-300 text-xs font-semibold transition-colors"
              >
                تراجع
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelling}
                id="confirm-cancel-order-btn"
                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                {cancelling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>تأكيد الإلغاء</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
                    className="w-16 h-16 rounded-lg object-cover border border-white/[0.08] bg-[#07090e] cursor-pointer hover:opacity-85"
                    onClick={() => window.open(activeOrder.paymentProof, '_blank')}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-slate-300 font-medium block truncate">
                      {activeOrder.paymentProofFilename || 'صورة التحويل'}
                    </span>
                    <a
                      href={activeOrder.paymentProof}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1 mt-1 font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>معاينة كاملة</span>
                    </a>
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
                  className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:translate-y-px text-slate-950 font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-sm"
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
                    className="h-10 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>إلغاء الطلب</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setActiveOrder(null)}
                className="h-10 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

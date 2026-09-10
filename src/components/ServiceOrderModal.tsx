import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ServiceItem, OrderItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  X,
  Copy,
  Check,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Wallet,
  ArrowLeft,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

interface ServiceOrderModalProps {
  isOpen: boolean;
  service: ServiceItem | null;
  onClose: () => void;
  onSuccessNavigateToOrders?: () => void;
  onOpenSupportAfterOrder?: (orderId: string, orderNumber: string) => void;
  onOpenAuth?: () => void;
}

export const ServiceOrderModal: React.FC<ServiceOrderModalProps> = ({
  isOpen,
  service,
  onClose,
  onSuccessNavigateToOrders,
  onOpenSupportAfterOrder,
  onOpenAuth,
}) => {
  const { currentUser, profile } = useAuth();

  // Inputs
  const [senderWallet, setSenderWallet] = useState('');
  const [customerRequirements, setCustomerRequirements] = useState('');

  // Platform Wallet config
  const [walletNumber, setWalletNumber] = useState('01098765432');
  const [walletName, setWalletName] = useState('المحفظة الإلكترونية الموحدة');
  const [copied, setCopied] = useState(false);

  // Upload proof state
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Submission & Validation state
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<OrderItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch configured wallet details from backend
  useEffect(() => {
    if (!isOpen) return;
    const fetchConfig = async () => {
      try {
        const config = await api.getConfig();
        if (config.walletNumber) setWalletNumber(config.walletNumber);
        if (config.walletName) setWalletName(config.walletName);
      } catch (err) {
        console.error('Error fetching platform config:', err);
      }
    };
    fetchConfig();
  }, [isOpen]);

  // Reset form when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setSenderWallet('');
      setCustomerRequirements('');
      setProofFile(null);
      setProofPreview(null);
      setUploadedUrl(null);
      setValidationError(null);
      setCreatedOrder(null);
      setSubmitting(false);
      setIsDragging(false);
    }
  }, [isOpen, service]);

  if (!isOpen || !service) return null;

  const isBudgetPricing = service.pricingType === 'budget' || service.basePrice === 0;
  const finalPrice = service.isDiscounted ? service.discountedPrice : service.basePrice;
  const discountAmount = service.isDiscounted ? service.basePrice - service.discountedPrice : 0;

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(walletNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSelectedFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setValidationError('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP) لإثبات التحويل.');
      return;
    }

    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
    setValidationError(null);

    try {
      setUploading(true);
      const res = await api.uploadFile(file, file.name);
      setUploadedUrl(res.url);
    } catch (err: any) {
      setValidationError(err.message || 'فشل في رفع صورة الإيصال');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!currentUser) {
      onOpenAuth?.();
      return;
    }

    if (!senderWallet.trim()) {
      setValidationError('يرجى كتابة رقم المحفظة المُحول منها لتأكيد العملية.');
      return;
    }

    if (!uploadedUrl) {
      setValidationError('يرجى إرفاق صورة إيصال التحويل للمتابعة.');
      return;
    }

    setSubmitting(true);
    try {
      const newOrder = await api.createOrder({
        userId: currentUser.uid,
        userName: profile?.name || currentUser.displayName || 'عميل',
        userEmail: currentUser.email || '',
        serviceId: service.id,
        senderWalletNumber: senderWallet.trim(),
        customerRequirements: customerRequirements.trim() || `طلب خدمة: ${service.title}`,
        paymentMethod: `المحفظة الإلكترونية (${walletName})`,
        paymentProof: uploadedUrl,
        paymentProofFilename: proofFile?.name || 'payment-receipt.png',
      });

      setCreatedOrder(newOrder);

      // Transition smoothly to customer support chat
      setTimeout(() => {
        if (onOpenSupportAfterOrder) {
          onClose();
          onOpenSupportAfterOrder(newOrder.id, newOrder.orderNumber);
        }
      }, 1500);
    } catch (err: any) {
      setValidationError(err.message || 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && service && (
        <motion.div
          key="service-order-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          id="service-checkout-modal-backdrop"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 text-right"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            id="service-checkout-modal-container"
            className="w-full max-w-lg bg-[#0c1018] border border-white/[0.1] rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100 relative will-change-transform"
          >
        {/* Modal Top Bar: Balanced header with prominent, well-aligned close button */}
        <div className="px-5 py-4 border-b border-white/[0.08] bg-[#111726] flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold font-cairo text-slate-100 truncate">
                بوابة الدفع الإلكتروني الموحدة
              </h2>
              <span className="text-xs sm:text-sm font-semibold font-cairo text-emerald-400 block truncate">
                {service.title}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={submitting}
            id="checkout-close-modal-btn"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-white/[0.08] bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-white/[0.16] transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-95 shadow-sm"
            aria-label="إغلاق النافذة"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {createdOrder ? (
            /* Success State */
            <div className="text-center py-6 sm:py-8 space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold font-cairo text-slate-100">
                  تم تأكيد الطلب بنجاح!
                </h3>
                <p className="text-sm sm:text-base font-medium font-cairo text-slate-300 max-w-sm mx-auto leading-relaxed">
                  تم استلام إيصال التحويل وتسجيل طلبك بنجاح. جاري نقلك تلقائياً لمحادثة الدعم الفني لمباشرة التنفيذ...
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#121824] border border-white/[0.06] text-right max-w-xs mx-auto space-y-2.5 shadow-sm font-cairo">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-slate-300">رقم الطلب:</span>
                  <span className="font-mono font-black text-emerald-400 text-sm sm:text-base">
                    {createdOrder.orderNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-slate-300">المحفظة المُحول منها:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {createdOrder.senderWalletNumber || senderWallet}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-slate-300">الحالة:</span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                    قيد المراجعة
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenSupportAfterOrder) {
                      onOpenSupportAfterOrder(createdOrder.id, createdOrder.orderNumber);
                    } else {
                      onSuccessNavigateToOrders?.();
                    }
                  }}
                  id="checkout-success-chat-btn"
                  className="w-full sm:w-auto h-12 px-7 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-extrabold text-base font-cairo transition-all duration-200 shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>التوجه لمحادثة الدعم الفني الآن</span>
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Validation Alert */}
              {validationError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in font-cairo font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                  <span className="leading-relaxed">{validationError}</span>
                </div>
              )}

              {/* أولاً: ملخص المبلغ (Header & Summary) */}
              <div
                id="checkout-summary-section"
                className="p-5 rounded-2xl bg-gradient-to-b from-[#111728] to-[#0d121c] border border-white/[0.08] text-center space-y-2 relative overflow-hidden shadow-inner"
              >
                <span className="text-xs font-bold font-cairo text-slate-400 block tracking-wide">
                  المبلغ المطلوب دفعه
                </span>

                <div className="flex items-baseline justify-center gap-2">
                  {isBudgetPricing ? (
                    <span className="text-2xl sm:text-3xl font-extrabold font-cairo text-emerald-400">
                      حسب الميزانية والاتفاق
                    </span>
                  ) : (
                    <>
                      <span className="text-3xl sm:text-4xl md:text-5xl font-black text-emerald-400 tracking-tight font-sans">
                        {finalPrice.toLocaleString()}
                      </span>
                      <span className="text-base sm:text-lg font-bold text-emerald-300 font-cairo">
                        ج.م
                      </span>
                    </>
                  )}
                </div>

                {service.isDiscounted && !isBudgetPricing && (
                  <div className="flex items-center justify-center gap-2 pt-0.5">
                    <span className="text-xs sm:text-sm text-slate-500 line-through font-mono font-medium">
                      {service.basePrice.toLocaleString()} ج.م
                    </span>
                    <span className="text-xs font-bold font-cairo text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      وفرت {discountAmount.toLocaleString()} ج.م
                    </span>
                  </div>
                )}
              </div>

              {/* ثانياً: قسم التحويل ورقم المحفظة (Transfer Card) */}
              <div
                id="checkout-transfer-card"
                className="p-4 sm:p-5 rounded-2xl bg-[#111726] border border-emerald-500/30 shadow-lg space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-bold font-cairo text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>رقم المحفظة الإلكترونية الموحدة للتحويل</span>
                  </span>
                  <span className="text-[11px] sm:text-xs font-bold font-cairo px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                    معتمد ورسمي
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl bg-[#090d16] border border-white/[0.08]">
                  <span className="font-mono text-xl sm:text-2xl font-black text-slate-50 tracking-[0.18em] select-all dir-ltr text-center sm:text-left py-0.5">
                    {walletNumber}
                  </span>

                  <button
                    type="button"
                    onClick={handleCopyWallet}
                    id="checkout-copy-number-btn"
                    className={`h-10 sm:h-11 px-5 rounded-xl text-xs sm:text-sm font-bold font-cairo flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shrink-0 active:scale-95 shadow-sm ${
                      copied
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30'
                        : 'bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 hover:text-white'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>تم النسخ ✓</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>نسخ الرقم</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ثالثاً: خطوات الدفع (Step-by-Step Guide) */}
              <div
                id="checkout-steps-guide"
                className="p-4 rounded-2xl bg-[#0a0f1a] border border-white/[0.06] space-y-2.5"
              >
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center border border-emerald-500/25 shrink-0 mt-0.5">
                    1
                  </span>
                  <span className="text-xs sm:text-sm font-medium font-cairo text-slate-300 leading-relaxed">
                    انسخ الرقم وقم بتحويل المبلغ من أي محفظة إلكترونية (فودافون كاش، إنستاباي، وغيرها).
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center border border-emerald-500/25 shrink-0 mt-0.5">
                    2
                  </span>
                  <span className="text-xs sm:text-sm font-medium font-cairo text-slate-300 leading-relaxed">
                    أدخل رقم المحفظة الذي حولت منه وأرفق صورة الإيصال لإثبات العملية.
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center border border-emerald-500/25 shrink-0 mt-0.5">
                    3
                  </span>
                  <span className="text-xs sm:text-sm font-medium font-cairo text-slate-300 leading-relaxed">
                    اضغط على تأكيد إرسال الطلب لمباشرة التنفيذ فوراً مع الدعم الفني.
                  </span>
                </div>
              </div>

              {/* رابعاً: نموذج إدخال البيانات والتحقق (Inputs) */}
              <div className="space-y-4">
                {/* 1. حقل رقم المحفظة المُحول منها */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="sender-wallet-input"
                    className="block text-xs sm:text-sm font-bold font-cairo text-slate-200"
                  >
                    رقم المحفظة المُحول منها <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    id="sender-wallet-input"
                    type="tel"
                    required
                    value={senderWallet}
                    onChange={(e) => setSenderWallet(e.target.value)}
                    placeholder="010xxxxxxxx أو رقم المحفظة المحول منها"
                    dir="ltr"
                    className="w-full h-12 bg-[#090d16] border border-white/[0.09] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-4 text-sm sm:text-base font-mono font-semibold text-slate-100 placeholder:text-slate-500 placeholder:font-sans transition-all outline-none text-left"
                  />
                </div>

                {/* 2. منطقة إرفاق الإيصال (File Upload) */}
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold font-cairo text-slate-200">
                    صورة إيصال التحويل <span className="text-emerald-400">*</span>
                  </label>

                  {proofPreview ? (
                    /* Preview Thumbnail */
                    <div className="p-3.5 rounded-2xl bg-[#090d16] border border-emerald-500/30 flex items-center justify-between gap-3 shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={proofPreview}
                          alt="معاينة إيصال التحويل"
                          className="w-14 h-14 object-cover rounded-xl border border-white/[0.1] shrink-0"
                        />
                        <div className="min-w-0 font-cairo">
                          <p className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
                            {proofFile?.name}
                          </p>
                          <span className="text-xs text-slate-400 font-mono block">
                            {formatFileSize(proofFile?.size)}
                          </span>
                          <p className="text-xs text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                            {uploading ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>جاري الرفع...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>تم تجهيز الإيصال بنجاح</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={uploading}
                        onClick={() => {
                          setProofFile(null);
                          setProofPreview(null);
                          setUploadedUrl(null);
                        }}
                        className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer active:scale-95"
                        title="إزالة واختيار صورة أخرى"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    /* Dashed Border Upload Area */
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleSelectedFile(file);
                      }}
                      className={`group border-2 border-dashed rounded-2xl p-6 sm:p-7 text-center cursor-pointer transition-all ${
                        isDragging
                          ? 'border-emerald-400 bg-emerald-500/10 scale-[0.99]'
                          : 'border-white/[0.12] hover:border-emerald-500/50 bg-[#090d16]/70 hover:bg-[#090d16]'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleSelectedFile(f);
                        }}
                        className="hidden"
                      />
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-2.5 transition-transform group-hover:scale-110">
                        <UploadCloud className="w-6 h-6 stroke-[1.75]" />
                      </div>
                      <p className="text-xs sm:text-sm text-slate-200 font-bold font-cairo">
                        اضغط هنا لاختيار صورة الإيصال أو قم بالسحب والإفلات
                      </p>
                      <p className="text-xs text-slate-400 font-medium font-cairo mt-1">
                        يدعم ملفات PNG, JPG, WEBP
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. حقل تفاصيل ومواصفات التصميم (ملاحظات اختيارية) */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="customer-requirements-input"
                    className="block text-xs sm:text-sm font-bold font-cairo text-slate-200"
                  >
                    تفاصيل ومواصفات التصميم أو ملاحظاتك (اختياري)
                  </label>
                  <textarea
                    id="customer-requirements-input"
                    rows={2}
                    value={customerRequirements}
                    onChange={(e) => setCustomerRequirements(e.target.value)}
                    placeholder="اكتب أي مواصفات أو تفاصيل تريد إبلاغ فريق العمل بها بشأن طلبك..."
                    className="w-full bg-[#090d16] border border-white/[0.09] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl p-3 text-sm sm:text-base font-medium font-cairo text-slate-100 placeholder:text-slate-500 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* خامساً: أزرار التحكم والعمليات (Action Buttons) */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={submitting || uploading || !senderWallet.trim() || !uploadedUrl}
                  id="checkout-submit-order-btn"
                  className="w-full h-12 sm:h-13 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-emerald-500 text-slate-950 font-extrabold text-base sm:text-lg font-cairo transition-all duration-200 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                      <span>جاري إرسال الطلب...</span>
                    </>
                  ) : (
                    <span>تأكيد الدفع وإرسال الطلب</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  id="checkout-cancel-btn"
                  className="w-full py-2 text-center text-xs sm:text-sm font-semibold font-cairo text-slate-400 hover:text-slate-200 transition-colors cursor-pointer bg-transparent border-0"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
};

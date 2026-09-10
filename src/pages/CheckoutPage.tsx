import React, { useState, useRef, useEffect } from 'react';
import { ServiceItem, OrderItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  ArrowRight,
  Copy,
  Check,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Wallet,
  X,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';

interface CheckoutPageProps {
  service: ServiceItem;
  onBack: () => void;
  onViewOrders: () => void;
  onOpenAuth: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  service,
  onBack,
  onViewOrders,
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

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<OrderItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch configured wallet details from backend
  useEffect(() => {
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
  }, []);

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
      onOpenAuth();
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
    } catch (err: any) {
      setValidationError(err.message || 'حدث خطأ أثناء إرسال الطلب.');
    } finally {
      setSubmitting(false);
    }
  };

  const isBudgetPricing = service.pricingType === 'budget' || service.basePrice === 0;
  const finalPrice = service.isDiscounted ? service.discountedPrice : service.basePrice;
  const discountAmount = service.isDiscounted ? service.basePrice - service.discountedPrice : 0;

  // Order Success State
  if (createdOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-right">
        <div className="bg-[#0c1018] border border-emerald-500/30 rounded-3xl p-6 sm:p-10 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
              تم تأكيد الطلب بنجاح!
            </h1>
            <p className="text-sm font-normal text-slate-400 max-w-md mx-auto leading-relaxed">
              تم استلام إيصال التحويل وتسجيل طلبك بنجاح. يمكنك متابعة حالة الطلب أو التواصل مع الدعم الفني لمتابعة التنفيذ.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#121824] border border-white/[0.06] text-right w-full max-w-sm mx-auto space-y-3 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-400">رقم الطلب:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm tracking-wider">
                {createdOrder.orderNumber}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-400">الخدمة:</span>
              <span className="font-medium text-slate-200 truncate max-w-[200px]">{service.title}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-400">المحفظة المُحول منها:</span>
              <span className="font-mono font-bold text-slate-200">
                {createdOrder.senderWalletNumber || senderWallet}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-400">الحالة:</span>
              <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 text-xs font-semibold border border-amber-500/20">
                قيد المراجعة
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onViewOrders}
              id="success-view-orders-btn"
              className="w-full sm:w-auto h-11 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:translate-y-px text-slate-950 font-bold text-sm transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              صفحة طلباتي
            </button>
            <button
              onClick={onBack}
              id="success-explore-more-btn"
              className="w-full sm:w-auto h-11 px-6 rounded-xl bg-[#121824] hover:bg-[#172030] border border-white/[0.08] text-slate-200 font-semibold text-sm transition-all cursor-pointer"
            >
              استعراض خدمات أخرى
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 text-right">
      {/* Back button */}
      <button
        onClick={onBack}
        id="checkout-page-back-btn"
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 mb-6 transition-colors cursor-pointer"
      >
        <ArrowRight className="w-4 h-4" />
        <span>العودة لتفاصيل الخدمة</span>
      </button>

      <div className="bg-[#0c1018] border border-white/[0.08] rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header Badge */}
        <div className="flex items-center gap-2.5 pb-2 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-slate-100">
              بوابة الدفع الإلكتروني الموحدة
            </h1>
            <span className="text-xs font-medium text-slate-400">
              {service.title}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Validation Alert */}
          {validationError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="leading-relaxed font-normal">{validationError}</span>
            </div>
          )}

          {/* أولاً: ملخص المبلغ (Header & Summary) */}
          <div
            id="checkout-page-summary-box"
            className="p-4 sm:p-5 rounded-2xl bg-[#0a0e17] border border-white/[0.06] text-center space-y-1 relative overflow-hidden"
          >
            <span className="text-xs font-medium text-slate-400 block">
              المبلغ المطلوب دفعه
            </span>

            <div className="flex items-baseline justify-center gap-1.5">
              {isBudgetPricing ? (
                <span className="text-2xl sm:text-3xl font-bold text-emerald-400">
                  حسب الميزانية والاتفاق
                </span>
              ) : (
                <>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight font-latin">
                    {finalPrice.toLocaleString()}
                  </span>
                  <span className="text-sm font-medium text-emerald-300/80 font-cairo">
                    ج.م
                  </span>
                </>
              )}
            </div>

            {service.isDiscounted && !isBudgetPricing && (
              <div className="flex items-center justify-center gap-2 pt-0.5">
                <span className="text-xs text-slate-500 line-through font-mono">
                  {service.basePrice.toLocaleString()} ج.م
                </span>
                <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  وفرت {discountAmount.toLocaleString()} ج.م
                </span>
              </div>
            )}
          </div>

          {/* ثانياً: قسم التحويل ورقم المحفظة (Transfer Card) */}
          <div
            id="checkout-page-transfer-card"
            className="p-4 sm:p-5 rounded-2xl bg-[#121826] border border-emerald-500/30 shadow-lg space-y-3 relative overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>رقم المحفظة الإلكترونية الموحدة للتحويل</span>
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                معتمد
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#080b11] border border-white/[0.06]">
              <span className="font-mono text-xl sm:text-2xl font-bold text-slate-100 tracking-[0.16em] select-all dir-ltr text-center sm:text-left py-0.5">
                {walletNumber}
              </span>

              <button
                type="button"
                onClick={handleCopyWallet}
                id="checkout-page-copy-btn"
                className={`h-10 px-4 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shrink-0 active:scale-95 ${
                  copied
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300'
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
            id="checkout-page-steps-guide"
            className="p-4 rounded-2xl bg-[#0a0e17] border border-white/[0.05] space-y-2.5"
          >
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center border border-emerald-500/25 shrink-0 mt-0.5">
                1
              </span>
              <span className="text-sm font-normal text-slate-300 leading-relaxed">
                انسخ الرقم وقم بتحويل المبلغ من أي محفظة إلكترونية.
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center border border-emerald-500/25 shrink-0 mt-0.5">
                2
              </span>
              <span className="text-sm font-normal text-slate-300 leading-relaxed">
                أدخل رقم المحفظة الذي حولت منه وأرفق صورة الإيصال.
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center border border-emerald-500/25 shrink-0 mt-0.5">
                3
              </span>
              <span className="text-sm font-normal text-slate-300 leading-relaxed">
                اضغط على تأكيد إرسال الطلب.
              </span>
            </div>
          </div>

          {/* رابعاً: نموذج إدخال البيانات والتحقق (Inputs) */}
          <div className="space-y-4">
            {/* 1. حقل رقم المحفظة المُحول منها */}
            <div className="space-y-1.5">
              <label
                htmlFor="checkout-page-sender-wallet"
                className="block text-xs font-medium text-slate-300"
              >
                رقم المحفظة المُحول منها <span className="text-emerald-400">*</span>
              </label>
              <input
                id="checkout-page-sender-wallet"
                type="tel"
                required
                value={senderWallet}
                onChange={(e) => setSenderWallet(e.target.value)}
                placeholder="010xxxxxxxx أو رقم المحفظة المحول منها"
                dir="ltr"
                className="w-full h-12 bg-[#0a0e17] border border-white/[0.09] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-4 text-sm font-mono text-slate-100 placeholder:text-slate-500 placeholder:font-sans transition-all outline-none text-left"
              />
            </div>

            {/* 2. منطقة إرفاق الإيصال (File Upload) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                صورة إيصال التحويل <span className="text-emerald-400">*</span>
              </label>

              {proofPreview ? (
                /* Preview Thumbnail */
                <div className="p-3.5 rounded-2xl bg-[#0a0e17] border border-emerald-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={proofPreview}
                      alt="معاينة إيصال التحويل"
                      className="w-14 h-14 object-cover rounded-xl border border-white/[0.08] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">
                        {proofFile?.name}
                      </p>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        {formatFileSize(proofFile?.size)}
                      </span>
                      <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                        {uploading ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>جاري الرفع...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
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
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
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
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-emerald-400 bg-emerald-500/10'
                      : 'border-white/[0.12] hover:border-emerald-500/50 bg-[#0a0e17]/50 hover:bg-[#0a0e17]'
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
                  <UploadCloud className="w-8 h-8 text-emerald-400/90 mx-auto mb-2 stroke-[1.5]" />
                  <p className="text-xs text-slate-300 font-medium">
                    اضغط هنا لاختيار صورة الإيصال أو قم بالسحب والإفلات
                  </p>
                  <p className="text-xs text-slate-500 font-normal mt-1">
                    يدعم ملفات PNG, JPG, WEBP
                  </p>
                </div>
              )}
            </div>

            {/* 3. حقل تفاصيل ومواصفات التصميم (اختياري) */}
            <div className="space-y-1.5">
              <label
                htmlFor="checkout-page-requirements"
                className="block text-xs font-medium text-slate-300"
              >
                تفاصيل ومواصفات التصميم أو ملاحظاتك (اختياري)
              </label>
              <textarea
                id="checkout-page-requirements"
                rows={2}
                value={customerRequirements}
                onChange={(e) => setCustomerRequirements(e.target.value)}
                placeholder="اكتب أي مواصفات أو تفاصيل تريد إبلاغ فريق العمل بها بشأن طلبك..."
                className="w-full bg-[#0a0e17] border border-white/[0.09] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* خامساً: أزرار التحكم والعمليات (Action Buttons) */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={submitting || uploading || !senderWallet.trim() || !uploadedUrl}
              id="checkout-page-submit-btn"
              className="w-full h-12 sm:h-13 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-emerald-500 text-slate-950 font-extrabold text-base sm:text-lg font-cairo transition-all duration-200 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>جاري إرسال الطلب...</span>
                </>
              ) : (
                <span>تأكيد الدفع وإرسال الطلب</span>
              )}
            </button>

            <button
              type="button"
              onClick={onBack}
              disabled={submitting}
              id="checkout-page-cancel-btn"
              className="w-full py-2.5 text-center text-sm font-normal text-slate-400 hover:text-slate-200 transition-colors cursor-pointer bg-transparent border-0"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

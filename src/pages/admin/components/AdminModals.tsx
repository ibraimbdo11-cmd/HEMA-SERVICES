import React, { RefObject } from 'react';
import {
  X,
  Upload,
  Trash2,
  Loader2,
  Pencil,
  Download,
  AlertCircle,
} from 'lucide-react';
import { OrderItem, ServiceItem, MessageItem } from '../../../types';
import { downloadAttachment } from '../../../lib/chatUtils';

// ==========================================
// 1. ADD / EDIT SERVICE MODAL
// ==========================================
interface ServiceModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit' | null;
  editingService: Partial<ServiceItem>;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  onChangeService: (service: Partial<ServiceItem>) => void;
  imageInputRef: RefObject<HTMLInputElement>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingImage: boolean;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  mode,
  editingService,
  onClose,
  onSave,
  onChangeService,
  imageInputRef,
  onImageUpload,
  isUploadingImage,
}) => {
  if (!isOpen || !mode) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm text-right animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#0c101a] border border-white/[0.09] rounded-2xl p-6 max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.07] pb-3.5">
          <h3 className="text-base font-bold text-slate-100 font-cairo">
            {mode === 'add' ? 'إضافة خدمة برمجية جديدة' : 'تعديل بيانات الخدمة'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4 text-xs">
          {/* Service Image Upload */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">صورة الخدمة</label>
            <input
              type="file"
              ref={imageInputRef}
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
              id="admin-service-image-input"
            />

            {isUploadingImage ? (
              <div className="w-full h-36 rounded-xl border border-dashed border-emerald-500/50 bg-emerald-500/10 flex flex-col items-center justify-center gap-2 text-emerald-400">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="font-semibold text-xs">جاري تحميل وحفظ صورة الخدمة...</span>
              </div>
            ) : editingService.image ? (
              <div className="space-y-2.5">
                <div className="w-full h-44 rounded-xl border border-white/[0.08] bg-slate-950 flex items-center justify-center overflow-hidden p-2">
                  <img
                    src={editingService.image}
                    alt="معاينة الخدمة"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-white/[0.08] transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>تغيير الصورة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeService({ ...editingService, image: '' })}
                    className="py-2 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-red-500/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف الصورة</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => imageInputRef.current?.click()}
                className="w-full h-32 rounded-xl border-2 border-dashed border-slate-800 hover:border-emerald-500/60 bg-[#121824]/60 hover:bg-[#121824] transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-emerald-400 p-4"
              >
                <div className="p-2.5 rounded-full bg-slate-800 text-emerald-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-xs text-slate-200">
                    اضغط لرفع صورة العرض الخاصة بالخدمة
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">JPG أو PNG أو WebP</p>
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">عنوان الخدمة</label>
            <input
              type="text"
              required
              value={editingService.title || ''}
              onChange={(e) => onChangeService({ ...editingService, title: e.target.value })}
              placeholder="مثال: تطوير متجر إلكتروني متكامل"
              className="w-full bg-[#121824] border border-white/[0.08] focus:border-emerald-500 rounded-xl p-2.5 text-slate-100 outline-none"
            />
          </div>

          {/* Short Description */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">الوصف المختصر للخدمة</label>
            <input
              type="text"
              required
              value={editingService.shortDescription || ''}
              onChange={(e) =>
                onChangeService({ ...editingService, shortDescription: e.target.value })
              }
              placeholder="وصف مختصر ودقيق لأبرز مزايا الخدمة"
              className="w-full bg-[#121824] border border-white/[0.08] focus:border-emerald-500 rounded-xl p-2.5 text-slate-100 outline-none"
            />
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">السعر الأساسي (ج.م)</label>
              <input
                type="number"
                required
                min={1}
                value={editingService.basePrice || 0}
                onChange={(e) =>
                  onChangeService({ ...editingService, basePrice: Number(e.target.value) })
                }
                className="w-full bg-[#121824] border border-white/[0.08] focus:border-emerald-500 rounded-xl p-2.5 text-slate-100 font-mono outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">السعر بعد الخصم (ج.م)</label>
              <input
                type="number"
                min={1}
                value={editingService.discountedPrice || 0}
                onChange={(e) =>
                  onChangeService({
                    ...editingService,
                    discountedPrice: Number(e.target.value),
                  })
                }
                className="w-full bg-[#121824] border border-white/[0.08] focus:border-emerald-500 rounded-xl p-2.5 text-slate-100 font-mono outline-none"
              />
            </div>
          </div>

          {/* Discount Active Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="service-discount-active-checkbox"
              checked={Boolean(editingService.isDiscounted)}
              onChange={(e) =>
                onChangeService({ ...editingService, isDiscounted: e.target.checked })
              }
              className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-white/[0.1] focus:ring-emerald-500"
            />
            <label
              htmlFor="service-discount-active-checkbox"
              className="text-slate-300 font-medium cursor-pointer"
            >
              تفعيل الخصم وعرض السعر الترويجي للعملاء
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/[0.07] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              id="admin-submit-service-btn"
              className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {mode === 'add' ? 'إضافة الخدمة' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 2. REJECT ORDER REASON DIALOG
// ==========================================
interface RejectionModalProps {
  order: OrderItem | null;
  reasonText: string;
  onChangeReason: (val: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export const RejectionModal: React.FC<RejectionModalProps> = ({
  order,
  reasonText,
  onChangeReason,
  onClose,
  onConfirm,
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm text-right animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#0c101a] border border-red-500/30 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center gap-2.5 text-red-400 font-bold text-sm">
          <AlertCircle className="w-5 h-5" />
          <span>رفض اعتماد الطلب {order.orderNumber}</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          يرجى تدوين سبب الرفض؛ سيصل هذا الإشعار للعميل لمساعدته على تصحيح المشكلة أو إعادة رفع الإيصال:
        </p>
        <textarea
          rows={3}
          value={reasonText}
          onChange={(e) => onChangeReason(e.target.value)}
          placeholder="مثال: لم يتم استلام التحويل على رقم المحفظة، أو المبلغ المحول غير مطابق..."
          className="w-full bg-[#121824] border border-white/[0.08] focus:border-red-500 rounded-xl p-3 text-xs text-slate-100 outline-none leading-relaxed"
        />
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            id="admin-confirm-reject-btn"
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all cursor-pointer"
          >
            تأكيد الرفض
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. EDIT MESSAGE DIALOG
// ==========================================
interface EditMessageModalProps {
  message: MessageItem | null;
  editText: string;
  onChangeText: (val: string) => void;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export const EditMessageModal: React.FC<EditMessageModalProps> = ({
  message,
  editText,
  onChangeText,
  onClose,
  onSave,
  isSaving,
}) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 text-right animate-in fade-in duration-150">
      <div className="bg-[#0c101a] border border-white/[0.09] rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Pencil className="w-4 h-4 text-emerald-400" />
            <span>تعديل رسالة الإدارة</span>
          </h4>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <textarea
          value={editText}
          onChange={(e) => onChangeText(e.target.value)}
          className="w-full h-28 bg-[#121824] border border-white/[0.08] focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-100 outline-none resize-none leading-relaxed"
          placeholder="نص الرسالة المعدل..."
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || !editText.trim()}
            className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>حفظ التعديل</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. FULLSCREEN IMAGE LIGHTBOX
// ==========================================
interface ImageLightboxModalProps {
  image: { url: string; name?: string } | null;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  image,
  onClose,
}) => {
  if (!image) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
    >
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            downloadAttachment(image.url, image.name || 'image.jpg');
          }}
          className="p-2.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer border border-white/[0.1] shadow-lg"
          title="تنزيل الصورة"
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer border border-white/[0.1] shadow-lg"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-4xl max-h-[85vh] flex flex-col items-center gap-3"
      >
        <img
          src={image.url}
          alt={image.name || 'صورة مكبرة'}
          className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/[0.1]"
          referrerPolicy="no-referrer"
        />
        {image.name && (
          <p className="text-xs text-slate-300 font-mono truncate max-w-md">
            {image.name}
          </p>
        )}
      </div>
    </div>
  );
};

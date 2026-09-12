import React from 'react';
import {
  Settings,
  CreditCard,
  Phone,
  Mail,
  Save,
  CheckCircle,
  Loader2,
  Sparkles,
  Info,
} from 'lucide-react';
import { PlatformSettings } from '../../../types';

interface AdminSettingsTabProps {
  settings: PlatformSettings;
  onUpdateSettings: (newSettings: PlatformSettings) => void;
  onSaveSettings: (e: React.FormEvent) => void;
  isSaving: boolean;
  isSavedMsg: boolean;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({
  settings,
  onUpdateSettings,
  onSaveSettings,
  isSaving,
  isSavedMsg,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-100 font-cairo">
          إعدادات المنصة ووسائل الدفع
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          تحديد بيانات المحفظة الإلكترونية التي تظهر للعميل في صفحة الدفع وتأكيد الحجز.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <form
          onSubmit={onSaveSettings}
          className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-[#0d121c] border border-white/[0.07] space-y-5"
        >
          <div className="space-y-4">
            {/* Payment Method Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                اسم وسيلة الدفع / المحفظة
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={settings.walletName}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, walletName: e.target.value })
                  }
                  placeholder="مثال: فودافون كاش / إنستاباي"
                  className="w-full bg-[#121824] border border-white/[0.08] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-100 outline-none"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                الاسم الذي سيظهر للعميل كعنوان لطريقة الدفع
              </p>
            </div>

            {/* Wallet Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                رقم الهاتف المعتمد لاستلام التحويلات
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={settings.walletNumber}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, walletNumber: e.target.value })
                  }
                  placeholder="010XXXXXXXX"
                  className="w-full bg-[#121824] border border-white/[0.08] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-100 font-mono outline-none"
                  dir="ltr"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                سيقوم العميل بالتحويل المالي المباشر إلى هذا الرقم ورفع صورة الإيصال
              </p>
            </div>

            {/* Admin Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                البريد الإلكتروني المعتمد للمدير العام
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, adminEmail: e.target.value })
                  }
                  className="w-full bg-[#121824] border border-white/[0.08] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-100 font-mono outline-none"
                  dir="ltr"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                البريد المخول بصلاحيات لوحة التحكم الكاملة
              </p>
            </div>
          </div>

          {/* Feedback & Submit Button */}
          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
            <div>
              {isSavedMsg && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle className="w-4 h-4" />
                  <span>تم حفظ الإعدادات بنجاح في النظام</span>
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSaving}
              id="admin-save-settings-btn"
              className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>حفظ التعديلات</span>
            </button>
          </div>
        </form>

        {/* Live Customer Preview Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#090d16] border border-emerald-500/25 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>معاينة حية للمستخدمين</span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            هكذا ستظهر بيانات وسيلة الدفع للعملاء في نافذة إتمام الطلب:
          </p>

          <div className="p-4 rounded-xl bg-[#121824] border border-white/[0.08] space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">وسيلة الدفع:</span>
              <span className="text-slate-100 font-bold">{settings.walletName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">رقم التحويل:</span>
              <span className="text-emerald-400 font-mono font-bold" dir="ltr">
                {settings.walletNumber}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.04] text-[10px] text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              أي تعديل على رقم المحفظة يتم اعتماده فوراً لجميع عمليات الدفع الجديدة دون الحاجة لإعادة تشغيل النظام.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

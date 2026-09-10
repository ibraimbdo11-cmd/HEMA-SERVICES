import React, { useState } from 'react';
import { Logo } from './Logo';
import { X, ShieldCheck, FileText } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
  onOpenSupport: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenSupport }) => {
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | null>(null);

  return (
    <footer id="global-footer" className="w-full bg-[#05070c] border-t border-white/[0.06] text-right pt-10 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-white/[0.06]">
          {/* Brand */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-right space-y-2">
            <Logo onClick={() => onNavigate('home')} />
            <p className="text-xs text-slate-400">
              منصة HEMA SERVICES للحلول البرمجية وتطوير الأنظمة الرقمية.
            </p>
          </div>

          {/* Legal Links Only */}
          <div className="flex items-center gap-6 text-xs font-medium text-slate-400">
            <button
              onClick={() => setActiveModal('privacy')}
              id="footer-link-privacy"
              className="hover:text-emerald-400 transition-colors py-1 px-2 rounded-lg hover:bg-white/[0.04]"
            >
              سياسة الخصوصية
            </button>
            <span className="text-white/[0.1]">•</span>
            <button
              onClick={() => setActiveModal('terms')}
              id="footer-link-terms"
              className="hover:text-emerald-400 transition-colors py-1 px-2 rounded-lg hover:bg-white/[0.04]"
            >
              شروط الاستخدام
            </button>
          </div>
        </div>

        {/* Bottom copyright & credit */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p id="footer-copyright">
            © 2026 HEMA SERVICES. جميع الحقوق محفوظة.
          </p>
          <p id="footer-developer-credit" className="text-slate-400 font-medium">
            Developed by HEMA
          </p>
        </div>
      </div>

      {/* Privacy Policy & Terms Modal */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 text-right animate-in fade-in duration-150"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-lg bg-[#0d121c] border border-white/[0.08] rounded-2xl shadow-2xl p-6 text-slate-200 relative max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.07] mb-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                {activeModal === 'privacy' ? (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>سياسة الخصوصية</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    <span>شروط الاستخدام</span>
                  </>
                )}
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeModal === 'privacy' ? (
              <div className="space-y-3.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <p>
                  نحن في منصة <strong>HEMA SERVICES</strong> نلتزم بحماية خصوصية بيانات عملائنا. نحرص على ألا يتم مشاركة أي معلومات شخصية أو بيانات مشاريع مع أي طرف ثالث خارج إطار تنفيذ وتسليم الخدمة البرمجية.
                </p>
                <h5 className="font-semibold text-slate-100 pt-2">1. جمع البيانات:</h5>
                <p>
                  يقتصر جمع البيانات على البيانات اللازمة لإنشاء الحساب، وإدارة الطلبات، ومتابعة التحويلات المالية عبر المحفظة الإلكترونية.
                </p>
                <h5 className="font-semibold text-slate-100 pt-2">2. أمان البيانات:</h5>
                <p>
                  يتم تشفير وتأمين كافة الرسائل والبيانات الفنية بما يضمن أعلى درجات الحماية والسرية.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <p>
                  باستخدامك لمنصة <strong>HEMA SERVICES</strong>، فإنك توافق على الالتزام بالشروط والأحكام المنصوص عليها هنا:
                </p>
                <h5 className="font-semibold text-slate-100 pt-2">1. طلب الخدمات:</h5>
                <p>
                  يتم تأكيد الطلب بعد مراجعة إشعار التحويل عبر المحفظة الإلكترونية والتأكد من وضوح متطلبات المشروع.
                </p>
                <h5 className="font-semibold text-slate-100 pt-2">2. التعديلات والدعم:</h5>
                <p>
                  يحق للعميل طلب تعديلات ضمن نطاق العمل المحدد في تفاصيل الخدمة قبل الاعتماد النهائي للمشروع.
                </p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-white/[0.07] text-left">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-xl bg-[#121824] hover:bg-[#172030] text-slate-200 text-xs font-semibold border border-white/[0.08]"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

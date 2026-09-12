import React from 'react';
import {
  Grid,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  Tag,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { ServiceItem } from '../../../types';

interface AdminServicesTabProps {
  servicesList: ServiceItem[];
  onAddNewService: () => void;
  onEditService: (service: ServiceItem) => void;
  onDeleteService: (service: ServiceItem) => void;
}

export const AdminServicesTab: React.FC<AdminServicesTabProps> = ({
  servicesList,
  onAddNewService,
  onEditService,
  onDeleteService,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-100 font-cairo">
            إدارة الخدمات البرمجية ({servicesList.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            إضافة وتعديل وحذف الخدمات وتحديد الأسعار وتفعيل الخصومات الترويجية.
          </p>
        </div>

        <button
          onClick={onAddNewService}
          id="admin-add-service-btn"
          className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة خدمة جديدة</span>
        </button>
      </div>

      {/* Services Grid */}
      {servicesList.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0d121c] border border-white/[0.06] space-y-3">
          <Grid className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-200">لا توجد خدمات متاحة حالياً</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            ابدأ بإضافة أول خدمة برمجية ليتمكن العملاء من استعراضها وطلبها مباشرة من الموقع.
          </p>
          <button
            onClick={onAddNewService}
            className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold"
          >
            إضافة خدمة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {servicesList.map((srv) => {
            const currentPrice = srv.isDiscounted && srv.discountedPrice ? srv.discountedPrice : srv.basePrice;

            return (
              <div
                key={srv.id}
                className="bg-[#0d121c] border border-white/[0.07] hover:border-white/[0.14] rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 group shadow-lg"
              >
                <div>
                  {/* Image Container with Discount Badge */}
                  <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                    <img
                      src={srv.image}
                      alt={srv.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d121c] via-transparent to-transparent opacity-80" />

                    {srv.isDiscounted && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 text-[10px] font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        <span>خصم فعال</span>
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2.5">
                    <h3 className="text-sm font-bold text-slate-100 truncate group-hover:text-emerald-400 transition-colors">
                      {srv.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {srv.shortDescription}
                    </p>

                    {/* Price and Deliverables */}
                    <div className="pt-2 flex items-baseline gap-2">
                      <span className="font-bold text-emerald-400 text-base font-mono">
                        {currentPrice.toLocaleString()} ج.م
                      </span>
                      {srv.isDiscounted && srv.discountedPrice && (
                        <span className="text-slate-500 line-through text-xs font-mono">
                          {srv.basePrice.toLocaleString()} ج.م
                        </span>
                      )}
                    </div>

                    {/* Deliverables snippet if available */}
                    {srv.deliverables && srv.deliverables.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1">
                        {srv.deliverables.slice(0, 2).map((item, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-[#121824] text-[10px] text-slate-400 border border-white/[0.04] truncate max-w-full"
                          >
                            ✓ {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-3.5 border-t border-white/[0.06] bg-[#090d16] flex items-center gap-2">
                  <button
                    onClick={() => onEditService(srv)}
                    id={`edit-service-btn-${srv.id}`}
                    className="flex-1 h-9 rounded-xl bg-[#121824] hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-white/[0.06] cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تعديل</span>
                  </button>
                  <button
                    onClick={() => onDeleteService(srv)}
                    id={`delete-service-btn-${srv.id}`}
                    className="h-9 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="حذف الخدمة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">حذف</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

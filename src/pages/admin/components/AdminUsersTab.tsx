import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  MessageSquare,
  Headphones,
  Calendar,
  Clock,
  Package,
  X,
  Mail,
  UserCheck,
} from 'lucide-react';
import { UserProfile } from '../../../types';

interface AdminUsersTabProps {
  usersList: UserProfile[];
  onContactUser: (user: UserProfile) => void;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  usersList,
  onContactUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return usersList;
    return usersList.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.phone && u.phone.includes(query))
    );
  }, [usersList, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-100 font-cairo">
            سجل العملاء والمستخدمين ({filteredUsers.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            قاعدة بيانات المسجلين، تواريخ الدخول، وعدد الطلبات مع إمكانية بدء المحادثة الفورية.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم أو البريد..."
            className="w-full bg-[#0d121f] border border-white/[0.08] focus:border-emerald-500 rounded-xl pr-9 pl-4 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all"
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

      {/* Desktop Table View */}
      <div className="hidden md:block p-4 sm:p-6 rounded-2xl bg-[#0d121c] border border-white/[0.07] overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-[#121824] border-b border-white/[0.06] text-slate-400 select-none">
            <tr>
              <th className="py-3.5 px-4 font-semibold">المستخدم</th>
              <th className="py-3.5 px-4 font-semibold">البريد الإلكتروني</th>
              <th className="py-3.5 px-4 font-semibold">تاريخ التسجيل</th>
              <th className="py-3.5 px-4 font-semibold">آخر تسجيل دخول</th>
              <th className="py-3.5 px-4 font-semibold text-center">الطلبات</th>
              <th className="py-3.5 px-4 font-semibold text-center">التواصل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-slate-300">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                  لا يوجد مستخدمون مطابقون للبحث.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const createdDate = new Date(user.createdAt);
                const lastLoginDate = new Date(user.lastLoginAt);

                return (
                  <tr key={user.id} className="hover:bg-[#121824]/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-xs flex items-center justify-center shrink-0">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="font-semibold text-slate-200 truncate">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]" dir="ltr">
                      <span className="text-right block">{user.email}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      <div>{createdDate.toLocaleDateString('ar-EG')}</div>
                      <div className="text-[10px] text-slate-500">
                        {createdDate.toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      <div>{lastLoginDate.toLocaleDateString('ar-EG')}</div>
                      <div className="text-[10px] text-slate-500">
                        {lastLoginDate.toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-white/[0.08] text-emerald-400 font-mono font-bold text-xs">
                        {user.orderCount || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onContactUser(user)}
                        className="h-8 px-3.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 mx-auto transition-colors cursor-pointer"
                      >
                        <Headphones className="w-3.5 h-3.5" />
                        <span>خدمة العملاء</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Stacked Cards (Zero horizontal overflow) */}
      <div className="md:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs bg-[#0d121c] rounded-2xl border border-white/[0.06]">
            لا يوجد مستخدمون مطابقون.
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="p-4 rounded-xl bg-[#0d121c] border border-white/[0.06] space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-xs flex items-center justify-center shrink-0">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-200 truncate">{user.name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono block truncate" dir="ltr">
                      {user.email}
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-white/[0.08] text-emerald-400 font-mono font-bold text-[11px] shrink-0">
                  {user.orderCount || 0} طلبات
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[11px] text-slate-400">
                <span>
                  آخر ظهور: {new Date(user.lastLoginAt).toLocaleDateString('ar-EG')}
                </span>
                <button
                  onClick={() => onContactUser(user)}
                  className="h-8 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>تواصل</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

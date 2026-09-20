import React from 'react';
import { Conversation } from '../../types';
import { formatArabicRelativeTime } from '../../lib/chatUtils';
import {
  Search,
  RefreshCw,
  MessageSquare,
  Package,
  CheckCheck,
  User,
  X,
} from 'lucide-react';

interface AdminConversationsListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conv: Conversation) => void;
  loading: boolean;
  onRefresh: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterUnreadOnly: boolean;
  onToggleFilterUnread: () => void;
  totalUnreadCount: number;
  onClose?: () => void;
}

export const AdminConversationsList: React.FC<AdminConversationsListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  loading,
  onRefresh,
  searchQuery,
  onSearchChange,
  filterUnreadOnly,
  onToggleFilterUnread,
  totalUnreadCount,
  onClose,
}) => {
  // Filter conversations based on search and unread toggle
  const filtered = conversations.filter((c) => {
    if (filterUnreadOnly && (!c.unreadByAdmin || c.unreadByAdmin <= 0)) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = (c.userName || '').toLowerCase().includes(q);
    const emailMatch = (c.userEmail || '').toLowerCase().includes(q);
    const orderMatch = (c.orderNumber || c.orderId || '').toLowerCase().includes(q);
    const textMatch = (c.lastMessageText || '').toLowerCase().includes(q);
    return nameMatch || emailMatch || orderMatch || textMatch;
  });

  return (
    <div className="flex flex-col h-full bg-[#080b13] border-l border-white/[0.08] select-none">
      {/* Header & Stats */}
      <div className="p-3.5 border-b border-white/[0.07] bg-[#0c101c]/90 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-cairo flex items-center gap-1.5">
                <span>محادثات العملاء</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400 font-mono">
                  {conversations.length}
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="w-8 h-8 rounded-xl border border-white/[0.08] bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer disabled:opacity-50 shrink-0"
              title="تحديث المحادثات"
              aria-label="تحديث المحادثات"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                id="admin-conv-exit-btn"
                className="w-8 h-8 rounded-xl border border-white/[0.08] bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-sm shrink-0"
                title="إغلاق خدمة العملاء"
                aria-label="إغلاق خدمة العملاء"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث بالاسم، البريد، أو رقم الطلب..."
            className="w-full h-9 pr-9 pl-8 bg-slate-900/90 border border-white/[0.08] rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 font-cairo transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={() => {
              if (filterUnreadOnly) onToggleFilterUnread();
            }}
            className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium font-cairo transition-all text-center cursor-pointer ${
              !filterUnreadOnly
                ? 'bg-slate-800 text-slate-100 border border-white/[0.08] shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            الكل ({conversations.length})
          </button>
          <button
            type="button"
            onClick={() => {
              if (!filterUnreadOnly) onToggleFilterUnread();
            }}
            className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium font-cairo transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
              filterUnreadOnly
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <span>غير مقروءة</span>
            {totalUnreadCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-mono font-bold text-[10px] flex items-center justify-center leading-none">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Conversation List Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04] scrollbar-thin scrollbar-thumb-slate-800">
        {loading && conversations.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-cairo">جاري جلب محادثات العملاء...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-slate-500 mx-auto">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-300 font-cairo">
              {searchQuery ? 'لم يتم العثور على محادثات تطابق بحثك' : 'لا توجد محادثات واردة حالياً'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-[11px] text-emerald-400 hover:underline font-cairo cursor-pointer"
              >
                إلغاء البحث
              </button>
            )}
          </div>
        ) : (
          filtered.map((conv) => {
            const isSelected = selectedConversationId === conv.id;
            const unread = conv.unreadByAdmin || 0;
            const initial = (conv.userName || conv.userEmail || 'U').trim()[0].toUpperCase();
            const timeStr = formatArabicRelativeTime(conv.lastMessageAt || conv.updatedAt || conv.createdAt);

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelectConversation(conv)}
                className={`w-full p-3 text-right transition-all flex items-start gap-3 cursor-pointer relative group ${
                  isSelected
                    ? 'bg-emerald-500/10 border-r-2 border-emerald-500'
                    : 'hover:bg-white/[0.03]'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-inner ${
                    unread > 0
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-300 border border-white/[0.06]'
                  }`}>
                    {initial}
                  </div>
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#080b13]" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className={`text-xs font-bold truncate font-cairo ${
                      isSelected ? 'text-emerald-300' : 'text-slate-100'
                    }`}>
                      {conv.userName || 'العميل'}
                    </span>
                    {timeStr && (
                      <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                        {timeStr}
                      </span>
                    )}
                  </div>

                  {/* Customer Email & Order Tag */}
                  <div className="flex items-center gap-1.5 mb-1">
                    {conv.userEmail && (
                      <span className="text-[11px] text-slate-400 truncate max-w-[140px] font-mono">
                        {conv.userEmail}
                      </span>
                    )}
                    {conv.orderNumber && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-[10px] font-mono shrink-0">
                        <Package className="w-2.5 h-2.5" />
                        <span>#{conv.orderNumber}</span>
                      </span>
                    )}
                  </div>

                  {/* Last message preview */}
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-[11px] truncate font-cairo ${
                      unread > 0 ? 'text-slate-200 font-semibold' : 'text-slate-500'
                    }`}>
                      {conv.lastMessageText || 'محادثة جديدة مع خدمة العملاء'}
                    </p>

                    {unread > 0 && (
                      <span className="min-w-[18px] h-4 px-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold font-mono flex items-center justify-center shrink-0">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

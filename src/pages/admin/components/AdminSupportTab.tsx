import React, { useState, useMemo } from 'react';
import {
  Headphones,
  Search,
  RotateCw,
  Send,
  Paperclip,
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Copy,
  Check,
  Reply,
  Pencil,
  ArrowRight,
  ArrowDown,
  Upload,
  Loader2,
  X,
  FileText,
  Download,
  AlertCircle,
  Clock,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Conversation, MessageItem } from '../../../types';
import { AudioMessagePlayer } from '../../../components/ui/AudioMessagePlayer';
import {
  formatFileSize,
  downloadAttachment,
  getFileCategory,
} from '../../../lib/chatUtils';

interface AdminSupportTabProps {
  conversationsList: Conversation[];
  activeConversation: Conversation | null;
  onSelectConversation: (conv: Conversation) => void;
  onRefreshConversations: () => void;
  activeMessages: MessageItem[];
  chatInput: string;
  onChatInputChange: (val: string) => void;
  onSendAdminMessage: (e?: React.FormEvent) => void;
  sendingMsg: boolean;
  adminChatUploadStatus: string | null;
  adminChatError: string | null;
  onClearChatError: () => void;
  isClientTyping: boolean;
  activeClientPresence: { isOnline: boolean; lastSeenAt?: string };
  adminReplyingTo: MessageItem | null;
  onSetReplyingTo: (msg: MessageItem | null) => void;
  onStartEditMessage: (msg: MessageItem) => void;
  onRequestDeleteMessage: (msgId: string) => void;
  adminCopiedMsgId: string | null;
  onCopyMessage: (msg: MessageItem) => void;
  adminHasMore: boolean;
  adminLoadingOlder: boolean;
  adminHasNewMessagesBelow: boolean;
  onScrollToBottom: () => void;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  onScroll: () => void;
  chatFileRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  adminStagedFile: {
    file: File;
    name: string;
    size: number;
    isImage: boolean;
    previewUrl?: string;
  } | null;
  onRemoveStagedFile: () => void;
  isRecording: boolean;
  recordSeconds: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  adminRecordedAudioPreview: { blob: Blob; url: string; duration: number } | null;
  onSendAudioPreview: () => void;
  onDiscardAudioPreview: () => void;
  adminIsDraggingFile: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onViewImageLightbox: (item: { url: string; name?: string }) => void;
}

export const AdminSupportTab: React.FC<AdminSupportTabProps> = ({
  conversationsList,
  activeConversation,
  onSelectConversation,
  onRefreshConversations,
  activeMessages,
  chatInput,
  onChatInputChange,
  onSendAdminMessage,
  sendingMsg,
  adminChatUploadStatus,
  adminChatError,
  onClearChatError,
  isClientTyping,
  activeClientPresence,
  adminReplyingTo,
  onSetReplyingTo,
  onStartEditMessage,
  onRequestDeleteMessage,
  adminCopiedMsgId,
  onCopyMessage,
  adminHasMore,
  adminLoadingOlder,
  adminHasNewMessagesBelow,
  onScrollToBottom,
  scrollContainerRef,
  onScroll,
  chatFileRef,
  onFileSelect,
  adminStagedFile,
  onRemoveStagedFile,
  isRecording,
  recordSeconds,
  onStartRecording,
  onStopRecording,
  adminRecordedAudioPreview,
  onSendAudioPreview,
  onDiscardAudioPreview,
  adminIsDraggingFile,
  onDragOver,
  onDragLeave,
  onDrop,
  onViewImageLightbox,
}) => {
  const [convSearch, setConvSearch] = useState('');
  const [audioPreviewPlaying, setAudioPreviewPlaying] = useState(false);
  const audioPreviewRef = React.useRef<HTMLAudioElement | null>(null);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    const q = convSearch.trim().toLowerCase();
    if (!q) return conversationsList;
    return conversationsList.filter(
      (c) =>
        c.userName.toLowerCase().includes(q) ||
        (c.userEmail && c.userEmail.toLowerCase().includes(q)) ||
        (c.orderNumber && c.orderNumber.toLowerCase().includes(q))
    );
  }, [conversationsList, convSearch]);

  // Audio preview toggle
  const toggleAudioPreview = () => {
    if (!audioPreviewRef.current) return;
    if (audioPreviewPlaying) {
      audioPreviewRef.current.pause();
      setAudioPreviewPlaying(false);
    } else {
      audioPreviewRef.current.play().then(() => setAudioPreviewPlaying(true)).catch(() => {});
    }
  };

  const formatAudioTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 font-cairo">
                خدمة العملاء (مركز الدعم والمراسلة)
              </h2>
              <span className="text-[11px] text-slate-400 block">
                متابعة استفسارات العملاء، إرسال التحديثات والملفات الصوتية والمستندات.
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-lg bg-[#0d121c] border border-white/[0.08] text-slate-300 font-mono">
            {conversationsList.length} محادثة مفتوحة
          </span>
          <button
            onClick={onRefreshConversations}
            className="p-1.5 rounded-lg bg-[#0d121c] hover:bg-slate-800 text-slate-400 hover:text-white border border-white/[0.08] transition-colors"
            title="تحديث قائمة المحادثات"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Support Center Workspace */}
      <div className="flex flex-col md:flex-row h-[680px] max-h-[82vh] bg-[#0c101a] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Left/Sidebar: Conversations List */}
        <div
          className={`w-full md:w-80 lg:w-96 flex flex-col shrink-0 border-b md:border-b-0 md:border-l border-white/[0.07] bg-[#090d16] min-h-0 ${
            activeConversation ? 'hidden md:flex h-full' : 'flex h-full'
          }`}
        >
          {/* Search bar inside list */}
          <div className="p-3 border-b border-white/[0.07] space-y-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={convSearch}
                onChange={(e) => setConvSearch(e.target.value)}
                placeholder="ابحث بالعميل أو رقم الطلب..."
                className="w-full bg-[#111726] border border-white/[0.08] focus:border-emerald-500 rounded-xl pr-8 pl-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all"
              />
              {convSearch && (
                <button
                  onClick={() => setConvSearch('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-white/[0.04] custom-scrollbar">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                لا توجد محادثات مطابقة.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeConversation?.id === conv.id;
                const hasUnread = Boolean(conv.unreadCount && conv.unreadCount > 0);

                return (
                  <div
                    key={conv.id}
                    onClick={() => onSelectConversation(conv)}
                    className={`p-3.5 cursor-pointer transition-all duration-150 relative text-right ${
                      isSelected
                        ? 'bg-emerald-500/10 border-r-2 border-emerald-400'
                        : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                          {conv.userName ? conv.userName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <h4 className="text-xs font-bold text-slate-200 truncate">
                          {conv.userName}
                        </h4>
                      </div>

                      <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                        {conv.lastMessageAt &&
                          new Date(conv.lastMessageAt).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 truncate pr-9 leading-relaxed">
                      {conv.lastMessage || 'محادثة جديدة مع العميل'}
                    </p>

                    <div className="flex items-center justify-between mt-1.5 pr-9">
                      {conv.orderNumber ? (
                        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                          طلب #{conv.orderNumber}
                        </span>
                      ) : (
                        <span />
                      )}

                      {hasUnread && (
                        <span className="px-2 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] font-mono">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Active Conversation Workspace with Drag & Drop */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`relative flex-1 flex flex-col h-full min-h-0 min-w-0 bg-[#080b12] text-right ${
            !activeConversation ? 'hidden md:flex items-center justify-center' : 'flex'
          }`}
        >
          {/* Drag & Drop Visual Overlay */}
          {adminIsDraggingFile && (
            <div className="absolute inset-0 z-50 bg-[#080b12]/95 border-2 border-dashed border-emerald-500 flex flex-col items-center justify-center gap-3 backdrop-blur-sm pointer-events-none animate-in fade-in">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Upload className="w-7 h-7 animate-bounce" />
              </div>
              <p className="text-sm font-bold text-slate-100">أفلت الملف أو الصورة هنا</p>
              <p className="text-xs text-slate-400">يدعم الصور والمستندات والملفات حتى 200 ميجابايت</p>
            </div>
          )}

          {activeConversation ? (
            <>
              {/* Header with Client Presence & Identity */}
              <div className="p-3 sm:p-3.5 bg-[#090d16] border-b border-white/[0.07] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => onSelectConversation(null as any)}
                    className="md:hidden p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white shrink-0"
                    title="العودة لقائمة المحادثات"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                        {activeConversation.userName}
                      </h3>
                      {/* Presence pill */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-medium border ${
                          activeClientPresence.isOnline
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            activeClientPresence.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                          }`}
                        />
                        <span>{activeClientPresence.isOnline ? 'متصل الآن' : 'غير متصل'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-mono truncate" dir="ltr">
                        {activeConversation.userEmail}
                      </span>
                      {isClientTyping && (
                        <span className="text-[10px] text-emerald-400 font-semibold animate-pulse">
                          • يكتب الآن...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {activeConversation.orderNumber && (
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      طلب #{activeConversation.orderNumber}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={onScrollToBottom}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-white/[0.08] transition-colors"
                    title="النزول لأسفل المحادثة"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages History Area */}
              <div
                id="admin-messages-scroll-area"
                ref={scrollContainerRef}
                onScroll={onScroll}
                className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto space-y-3 relative custom-scrollbar"
              >
                {/* Older messages loading */}
                {adminLoadingOlder && (
                  <div className="flex justify-center items-center py-2 text-xs text-slate-400 gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>جاري تحميل الرسائل السابقة...</span>
                  </div>
                )}
                {!adminHasMore && activeMessages.length > 15 && (
                  <div className="text-center py-2 text-[10px] text-slate-500 font-medium">
                    — بداية المحادثة مع العميل —
                  </div>
                )}

                {activeMessages.map((msg) => {
                  const isFromAdmin = msg.senderRole === 'admin';
                  const isDeleted = msg.isDeleted || msg.text === 'تم حذف هذه الرسالة';

                  return (
                    <div
                      key={msg.id}
                      className={`group flex flex-col ${
                        isFromAdmin ? 'items-end' : 'items-start'
                      }`}
                    >
                      <span className="text-[10px] text-slate-400 mb-1 px-1">
                        {isFromAdmin ? 'الإدارة (HEMA SERVICES)' : activeConversation.userName}
                      </span>

                      <div className="flex items-center gap-1.5 max-w-[85%]">
                        {/* Action buttons on hover */}
                        {!isDeleted && (
                          <div
                            className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ${
                              isFromAdmin ? 'order-first' : 'order-last'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => onSetReplyingTo(msg)}
                              className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                              title="رد على الرسالة"
                            >
                              <Reply className="w-3.5 h-3.5" />
                            </button>
                            {msg.text && (
                              <button
                                type="button"
                                onClick={() => onCopyMessage(msg)}
                                className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                                title="نسخ النص"
                              >
                                {adminCopiedMsgId === msg.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                            {isFromAdmin && msg.type === 'text' && (
                              <button
                                type="button"
                                onClick={() => onStartEditMessage(msg)}
                                className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                                title="تعديل الرسالة"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {isFromAdmin && (
                              <button
                                type="button"
                                onClick={() => onRequestDeleteMessage(msg.id)}
                                className="p-1 rounded-md hover:bg-red-950/40 text-slate-400 hover:text-red-400 transition-colors"
                                title="حذف الرسالة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}

                        {/* Message Bubble Container */}
                        <div
                          className={`rounded-2xl p-3 text-xs leading-relaxed space-y-1.5 shadow-md ${
                            isDeleted
                              ? 'bg-slate-900/60 border border-slate-800 text-slate-500 italic'
                              : isFromAdmin
                              ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-100 rounded-br-xs'
                              : 'bg-[#121824] border border-white/[0.08] text-slate-200 rounded-bl-xs'
                          }`}
                        >
                          {/* Quoted Message */}
                          {msg.replyTo && (
                            <div className="p-2 rounded-lg bg-black/40 border-r-2 border-emerald-400 text-[10px] text-slate-300 mb-1">
                              <span className="font-bold text-emerald-400 block mb-0.5">
                                {msg.replyTo.senderName}
                              </span>
                              <span className="line-clamp-2 text-slate-400">
                                {msg.replyTo.text || msg.replyTo.fileName || 'مرفق'}
                              </span>
                            </div>
                          )}

                          {/* Image Attachment with Lightbox */}
                          {msg.isImage && msg.fileUrl && !isDeleted && (
                            <div className="space-y-1">
                              <div
                                onClick={() =>
                                  onViewImageLightbox({
                                    url: msg.fileUrl!,
                                    name: msg.fileName,
                                  })
                                }
                                className="rounded-xl overflow-hidden max-w-sm max-h-64 bg-black/40 cursor-pointer relative group/img border border-white/[0.08]"
                              >
                                <img
                                  src={msg.fileUrl}
                                  alt={msg.fileName || 'صورة مرفقة'}
                                  className="w-full h-full object-cover transition-transform group-hover/img:scale-105"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                  <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-1 rounded-lg">
                                    اضغط للمعاينة
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Document or General File Attachment */}
                          {!msg.isImage && msg.fileUrl && !isDeleted && (
                            <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-black/30 border border-white/[0.06] text-[11px]">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                                <div className="min-w-0">
                                  <p className="font-medium text-slate-200 truncate">
                                    {msg.fileName || 'ملف مرفق'}
                                  </p>
                                  <span className="text-[9px] text-slate-400 font-mono">
                                    {formatFileSize(msg.fileSize)}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => downloadAttachment(msg.fileUrl!, msg.fileName || 'file')}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
                                title="تنزيل الملف"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Voice Note Player */}
                          {msg.audioUrl && !isDeleted && (
                            <div className="pt-1">
                              <AudioMessagePlayer
                                audioUrl={msg.audioUrl}
                                duration={msg.audioDuration}
                                isSender={isFromAdmin}
                                senderName={isFromAdmin ? 'الإدارة' : activeConversation.userName}
                                createdAt={msg.createdAt}
                              />
                            </div>
                          )}

                          {/* Text Message */}
                          {msg.text && (
                            <p className="whitespace-pre-line break-words text-xs">
                              {msg.text}
                            </p>
                          )}

                          {/* Bubble Footer: Time & Status */}
                          <div className="flex items-center justify-end gap-1.5 pt-1 text-[9px] text-slate-400 font-mono select-none">
                            {msg.isEdited && <span className="text-slate-500">(معدلة)</span>}
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString('ar-EG', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isFromAdmin && (
                              <span title={msg.readAt ? 'تمت القراءة من العميل' : 'تم الإرسال'}>
                                {msg.readAt ? (
                                  <Check className="w-3 h-3 text-emerald-400 inline" />
                                ) : (
                                  <Check className="w-3 h-3 text-slate-500 inline" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Floating "New Messages Below" pill */}
              {adminHasNewMessagesBelow && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 animate-bounce">
                  <button
                    type="button"
                    onClick={onScrollToBottom}
                    className="px-3.5 py-1.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                    <span>رسائل جديدة بالأسفل</span>
                  </button>
                </div>
              )}

              {/* Bottom Input Workspace */}
              <div className="p-3 bg-[#090d16] border-t border-white/[0.07] space-y-2 shrink-0">
                {/* Upload Status / Error Feedback */}
                {adminChatUploadStatus && (
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>{adminChatUploadStatus}</span>
                  </div>
                )}
                {adminChatError && (
                  <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center justify-between">
                    <span>{adminChatError}</span>
                    <button onClick={onClearChatError} className="p-1 text-red-400 hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Replying-To Preview Banner */}
                {adminReplyingTo && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/40 border border-emerald-500/30 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Reply className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-emerald-400 font-bold block">
                          الرد على {adminReplyingTo.senderName}
                        </span>
                        <span className="text-slate-300 truncate text-[11px] block">
                          {adminReplyingTo.text || adminReplyingTo.fileName || 'مرفق'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSetReplyingTo(null)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Staged Attachment Preview */}
                {adminStagedFile && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#111726] border border-emerald-500/30 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {adminStagedFile.isImage && adminStagedFile.previewUrl ? (
                        <img
                          src={adminStagedFile.previewUrl}
                          alt="معاينة"
                          className="w-10 h-10 rounded-lg object-cover bg-black"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-200 truncate">
                          {adminStagedFile.name}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatFileSize(adminStagedFile.size)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onRemoveStagedFile}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                      title="إلغاء المرفق"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Voice Note Recording Bar */}
                {isRecording ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-950/30 border border-red-500/40 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                      <span className="font-bold text-red-400">جاري تسجيل رسالة صوتية...</span>
                      <span className="font-mono text-slate-200 font-bold">
                        {formatAudioTime(recordSeconds)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={onStopRecording}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>إيقاف ومعاينة</span>
                    </button>
                  </div>
                ) : adminRecordedAudioPreview ? (
                  /* Audio Preview before send */
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#111726] border border-emerald-500/30 text-xs">
                    <audio
                      ref={audioPreviewRef}
                      src={adminRecordedAudioPreview.url}
                      onEnded={() => setAudioPreviewPlaying(false)}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={toggleAudioPreview}
                        className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold"
                      >
                        {audioPreviewPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 mr-0.5" />
                        )}
                      </button>
                      <span className="font-semibold text-slate-200">
                        معاينة التسجيل ({formatAudioTime(adminRecordedAudioPreview.duration)})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onDiscardAudioPreview}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        onClick={onSendAudioPreview}
                        disabled={sendingMsg}
                        className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5"
                      >
                        {sendingMsg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 -rotate-90" />}
                        <span>إرسال الصوت</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard Text & Attachment Input Form */
                  <form onSubmit={onSendAdminMessage} className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={chatFileRef}
                      onChange={onFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => chatFileRef.current?.click()}
                      disabled={sendingMsg}
                      title="إرفاق ملف أو صورة"
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#111726] hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors shrink-0 flex items-center justify-center border border-white/[0.08] cursor-pointer"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={onStartRecording}
                      disabled={sendingMsg}
                      title="تسجيل رسالة صوتية"
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#111726] hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors shrink-0 flex items-center justify-center border border-white/[0.08] cursor-pointer"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => onChatInputChange(e.target.value)}
                      placeholder={
                        adminStagedFile
                          ? 'اكتب تعليقاً مصاحباً للملف...'
                          : 'اكتب ردك للعميل في خدمة العملاء...'
                      }
                      disabled={sendingMsg}
                      className="flex-1 min-w-0 h-9 sm:h-10 bg-[#111726] border border-white/[0.08] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 rounded-xl px-3.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all"
                    />
                    <button
                      type="submit"
                      disabled={(!chatInput.trim() && !adminStagedFile) || sendingMsg}
                      id="admin-send-chat-btn"
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold transition-all shrink-0 flex items-center justify-center cursor-pointer shadow-md shadow-emerald-500/20"
                      title="إرسال"
                    >
                      {sendingMsg ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 -rotate-90" />
                      )}
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Headphones className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">مركز خدمة العملاء</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                اختر أي محادثة من القائمة للرد على العميل، إرسال التحديثات، أو متابعة الملفات.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

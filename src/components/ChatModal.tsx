import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Conversation, MessageItem } from '../types';
import { Logo } from './Logo';
import { AudioMessagePlayer } from './ui/AudioMessagePlayer';
import {
  X,
  Send,
  Paperclip,
  Mic,
  Square,
  FileText,
  Download,
  AlertCircle,
  Loader2,
  Trash2,
  Ban,
  ImageIcon,
  Headphones,
} from 'lucide-react';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
  orderNumber?: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
}) => {
  const { currentUser, profile, isAdmin } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Delete confirmation modal state
  const [msgToDelete, setMsgToDelete] = useState<string | null>(null);
  const [deletingMsg, setDeletingMsg] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingStartTimeRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Format seconds to mm:ss
  const formatAudioDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Format bytes to readable size
  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize or fetch conversation
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    let isMounted = true;
    const initChat = async () => {
      try {
        setLoading(true);
        setError(null);

        const conv = await api.findOrCreateConversation({
          userId: currentUser.uid,
          userName: profile?.name || currentUser.displayName || 'العميل',
          userEmail: currentUser.email || '',
          orderId: orderId,
        });

        if (!isMounted) return;
        setConversation(conv);

        const msgs = await api.getMessages(conv.id);
        if (isMounted) {
          setMessages(msgs);
          setTimeout(scrollToBottom, 100);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'حدث خطأ أثناء تحميل المحادثة');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initChat();

    // Poll for new messages every 5 seconds
    const interval = setInterval(async () => {
      if (conversation?.id) {
        try {
          const msgs = await api.getMessages(conversation.id);
          if (isMounted) {
            setMessages(msgs);
          }
        } catch {
          // ignore
        }
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, currentUser, orderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send Text Message
  const handleSendText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !conversation || !currentUser || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const msg = await api.sendMessage(conversation.id, {
        senderId: currentUser.uid,
        senderName: profile?.name || currentUser.displayName || 'العميل',
        senderRole: isAdmin ? 'admin' : 'user',
        type: 'text',
        text: textToSend,
      });
      setMessages((prev) => [...prev, msg]);
    } catch (err: any) {
      setError(err.message || 'فشل في إرسال الرسالة');
    } finally {
      setSending(false);
    }
  };

  // Send File or Image Attachment
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversation || !currentUser) return;

    const isImg = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg)$/i.test(file.name);

    try {
      setSending(true);
      setUploadStatusText(isImg ? 'جاري رفع الصورة...' : 'جاري رفع الملف المرفق...');
      const uploadRes = await api.uploadFile(file, file.name);

      const msg = await api.sendMessage(conversation.id, {
        senderId: currentUser.uid,
        senderName: profile?.name || currentUser.displayName || 'العميل',
        senderRole: isAdmin ? 'admin' : 'user',
        type: isImg ? 'image' : 'file',
        fileUrl: uploadRes.url,
        fileName: file.name,
        fileSize: file.size,
        isImage: isImg,
      });

      setMessages((prev) => [...prev, msg]);
    } catch (err: any) {
      setError(err.message || 'فشل في رفع الملف');
    } finally {
      setSending(false);
      setUploadStatusText(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Delete message with WhatsApp-like placeholder
  const confirmDelete = async () => {
    if (!conversation || !msgToDelete) return;
    try {
      setDeletingMsg(true);
      await api.deleteMessage(conversation.id, msgToDelete);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgToDelete
            ? {
                ...m,
                isDeleted: true,
                text: 'تم حذف هذه الرسالة',
                fileUrl: undefined,
                fileName: undefined,
                fileSize: undefined,
                audioUrl: undefined,
                audioDuration: undefined,
              }
            : m
        )
      );
      setMsgToDelete(null);
    } catch (err: any) {
      setError(err.message || 'فشل في حذف الرسالة');
    } finally {
      setDeletingMsg(false);
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      const startTime = Date.now();
      recordingStartTimeRef.current = startTime;

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());

        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - (recordingStartTimeRef.current || startTime)) / 1000)
        );

        if (audioBlob.size > 100 && conversation && currentUser) {
          try {
            setSending(true);
            setUploadStatusText('جاري إرسال التسجيل الصوتي...');
            const uploadRes = await api.uploadFile(audioBlob, `voice-${Date.now()}.webm`);
            const msg = await api.sendMessage(conversation.id, {
              senderId: currentUser.uid,
              senderName: profile?.name || currentUser.displayName || 'العميل',
              senderRole: isAdmin ? 'admin' : 'user',
              type: 'audio',
              audioUrl: uploadRes.url,
              audioDuration: durationSeconds,
            });
            setMessages((prev) => [...prev, msg]);
          } catch (err: any) {
            setError(err.message || 'فشل في إرسال التسجيل الصوتي');
          } finally {
            setSending(false);
            setUploadStatusText(null);
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingSeconds(elapsed);
      }, 250);
    } catch (err) {
      console.error(err);
      setError('يرجى السماح بالوصول إلى الميكروفون لتسجيل الرسالة الصوتية');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="customer-support-chat-modal"
      className="fixed inset-0 z-50 flex justify-start bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Mobile: Full screen. Computer/Desktop: Left half of screen */}
      <div className="w-full md:w-1/2 lg:w-1/2 h-full bg-[#0d121c] border-r border-white/[0.08] shadow-2xl flex flex-col overflow-hidden text-right">
        {/* Header - EXACT SPECIFICATION: Only site logo & name and close button */}
        <div className="px-4 py-3 bg-[#121824] border-b border-white/[0.06] flex items-center justify-between shrink-0">
          {/* Logo with Site Name */}
          <Logo iconPosition="left" />

          {/* Close button */}
          <button
            onClick={onClose}
            id="close-chat-modal-btn"
            className="w-9 h-9 rounded-xl border border-white/[0.08] bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer"
            title="إغلاق المحادثة"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-950/40 border-b border-red-500/30 text-red-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#080b11]">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>جاري تحميل المحادثة...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-slate-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-md">
                <Headphones className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-200 mb-1 font-cairo">
                فريق الدعم الفني في خدمتك
              </p>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-cairo">
                اكتب استفسارك أو أرفق متطلبات مشروعك، وسنرد عليك بأسرع وقت.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUser?.uid;
              const isAdminMsg = msg.senderRole === 'admin';
              const isDeleted = msg.isDeleted || msg.text === 'تم حذف هذه الرسالة';

              // User cannot delete admin's messages
              const canDelete = isMine || isAdmin;

              return (
                <div
                  key={msg.id}
                  id={`chat-msg-${msg.id}`}
                  className={`group flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1 font-cairo">
                    <span className="text-xs font-bold text-slate-300">
                      {isMine ? 'أنت' : msg.senderName}
                    </span>
                    {isAdminMsg && !isMine && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                        الإدارة
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 max-w-[88%]">
                    {/* Delete button (Visible ONLY if allowed and not deleted) */}
                    {canDelete && !isDeleted && (
                      <button
                        type="button"
                        onClick={() => setMsgToDelete(msg.id)}
                        title="حذف الرسالة"
                        className={`opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 shrink-0 ${
                          isMine ? 'order-first' : 'order-last'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* WhatsApp-like Deleted Message Bubble */}
                    {isDeleted ? (
                      <div className="flex items-center gap-2 py-2.5 px-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] text-slate-400 italic text-xs sm:text-sm shadow-sm font-cairo">
                        <Ban className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>تم حذف هذه الرسالة</span>
                      </div>
                    ) : (
                      <div
                        className={`rounded-2xl p-3.5 text-sm sm:text-base leading-relaxed shadow-sm flex-1 font-cairo font-medium ${
                          isMine
                            ? 'bg-emerald-500 text-slate-950 rounded-tl-sm'
                            : 'bg-[#121824] text-slate-200 border border-white/[0.07] rounded-tr-sm'
                        }`}
                      >
                        {/* 1. Text message */}
                        {msg.type === 'text' && <p className="whitespace-pre-wrap">{msg.text}</p>}

                        {/* 2. Image message with inline preview and dedicated download button */}
                        {(msg.type === 'image' || msg.isImage) && msg.fileUrl && (
                          <div className="space-y-2 min-w-[200px] max-w-sm">
                            <div className="rounded-xl overflow-hidden bg-black/40 border border-white/[0.1] max-h-64 flex items-center justify-center">
                              <img
                                src={msg.fileUrl}
                                alt={msg.fileName || 'صورة'}
                                className="w-full max-h-64 object-contain rounded-xl"
                                referrerPolicy="no-referrer"
                                loading="lazy"
                              />
                            </div>
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <ImageIcon className={`w-3.5 h-3.5 shrink-0 ${isMine ? 'text-slate-900' : 'text-emerald-400'}`} />
                                <span className={`text-[11px] truncate ${isMine ? 'text-slate-950 font-bold' : 'text-slate-300'}`}>
                                  {msg.fileName || 'صورة'}
                                </span>
                                {Boolean(msg.fileSize) && (
                                  <span className={`text-[10px] ${isMine ? 'text-slate-800' : 'text-slate-500'}`}>
                                    ({formatFileSize(msg.fileSize)})
                                  </span>
                                )}
                              </div>
                              <a
                                href={msg.fileUrl}
                                download={msg.fileName || 'image.jpg'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1 py-1 px-2.5 rounded-lg text-[11px] font-bold transition-colors ${
                                  isMine
                                    ? 'bg-slate-950 text-emerald-400 hover:bg-slate-900'
                                    : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                                }`}
                              >
                                <Download className="w-3 h-3" />
                                <span>تنزيل</span>
                              </a>
                            </div>
                          </div>
                        )}

                        {/* 3. Document / File with clear file icon, name, size and download button */}
                        {msg.type === 'file' && !msg.isImage && (
                          <div className="space-y-2 min-w-[200px]">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`p-2.5 rounded-xl ${
                                  isMine ? 'bg-emerald-600 text-slate-950' : 'bg-[#172030] text-emerald-400 border border-white/[0.06]'
                                }`}
                              >
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-bold truncate text-xs ${isMine ? 'text-slate-950' : 'text-slate-100'}`}>
                                  {msg.fileName || 'ملف مرفق'}
                                </p>
                                {Boolean(msg.fileSize) && (
                                  <p className={`text-[11px] ${isMine ? 'text-slate-800' : 'text-slate-400'}`}>
                                    الحجم: {formatFileSize(msg.fileSize)}
                                  </p>
                                )}
                              </div>
                            </div>

                            <a
                              href={msg.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={msg.fileName || 'document'}
                              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors ${
                                isMine
                                  ? 'bg-slate-950 text-emerald-400 hover:bg-slate-900'
                                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                              }`}
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>تحميل الملف</span>
                            </a>
                          </div>
                        )}

                        {/* 4. Voice message with custom theme player */}
                        {msg.type === 'audio' && msg.audioUrl && (
                          <AudioMessagePlayer
                            src={msg.audioUrl}
                            duration={msg.audioDuration}
                            isMine={isMine}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-500 px-1 mt-1 font-mono">
                    {new Date(msg.createdAt).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {msgToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-sm bg-[#121824] border border-white/[0.1] rounded-2xl p-5 space-y-4 text-right shadow-2xl">
              <div className="flex items-center gap-3 text-red-400">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">تأكيد حذف الرسالة</h4>
                  <p className="text-xs text-slate-400 mt-0.5">هل أنت متأكد من رغبتك في حذف هذه الرسالة؟</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deletingMsg}
                  className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {deletingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>نعم، حذف الرسالة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMsgToDelete(null)}
                  disabled={deletingMsg}
                  className="h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-2.5 sm:p-3 bg-[#121824] border-t border-white/[0.06]">
          {/* Uploading Status Banner */}
          {uploadStatusText && (
            <div className="mb-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span className="font-semibold">{uploadStatusText}</span>
            </div>
          )}

          {/* Recording indicator */}
          {isRecording ? (
            <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-red-950/40 border border-red-500/40">
              <div className="flex items-center gap-2 text-red-400 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0"></span>
                <span className="text-xs font-semibold truncate font-mono">
                  جاري التسجيل ({formatAudioDuration(recordingSeconds)})...
                </span>
              </div>
              <button
                onClick={stopRecording}
                id="stop-recording-btn"
                className="flex items-center gap-1 h-9 px-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" />
                <span>إيقاف وإرسال</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendText} className="flex items-center gap-1.5 sm:gap-2 w-full min-w-0">
              {/* File upload hidden input & button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                id="chat-file-upload-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                id="attach-file-btn"
                title="إرفاق صورة أو ملف"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#172030] hover:bg-[#1f2b40] text-slate-300 hover:text-emerald-400 transition-colors border border-white/[0.08] flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Voice Record button */}
              <button
                type="button"
                onClick={startRecording}
                disabled={sending}
                id="voice-record-btn"
                title="تسجيل رسالة صوتية"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#172030] hover:bg-[#1f2b40] text-slate-300 hover:text-emerald-400 transition-colors border border-white/[0.08] flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                disabled={sending}
                className="flex-1 min-w-0 h-10 sm:h-11 bg-[#080b11] border border-white/[0.08] focus:border-emerald-500/60 rounded-xl px-3.5 text-sm sm:text-base font-medium font-cairo text-slate-100 placeholder:text-slate-500 outline-none transition-colors"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                id="send-chat-msg-btn"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer"
                title="إرسال"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5 -rotate-90" />
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

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
  Reply,
  Pencil,
  Play,
  Pause,
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
  orderNumber: _orderNumber,
}) => {
  const { currentUser, profile, isAdmin } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Presence & Typing State
  const [adminStatus, setAdminStatus] = useState<{ isOnline: boolean; statusText: string }>({
    isOnline: false,
    statusText: 'خدمة العملاء متاحة',
  });
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const adminTypingTimerRef = useRef<any>(null);
  const userTypingTimerRef = useRef<any>(null);

  // Message Reply & Edit State
  const [replyingToMessage, setReplyingToMessage] = useState<MessageItem | null>(null);
  const [editingMessage, setEditingMessage] = useState<MessageItem | null>(null);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Staged attachment for preview before sending
  interface StagedAttachment {
    file: File;
    name: string;
    size: number;
    isImage: boolean;
    previewUrl?: string;
  }
  const [stagedFile, setStagedFile] = useState<StagedAttachment | null>(null);

  // Audio recording & preview state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioPreview, setRecordedAudioPreview] = useState<{
    blob: Blob;
    url: string;
    duration: number;
  } | null>(null);
  const [isPreviewAudioPlaying, setIsPreviewAudioPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const recordingStartTimeRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Delete confirmation modal state
  const [msgToDelete, setMsgToDelete] = useState<string | null>(null);
  const [deletingMsg, setDeletingMsg] = useState(false);

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

  // Initialize conversation and setup Realtime SSE
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    let isMounted = true;
    let unsubSSE: (() => void) | undefined;
    let heartbeatTimer: any;

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

        // Fetch existing messages
        const msgs = await api.getMessages(conv.id);
        if (isMounted) {
          setMessages(msgs);
          setTimeout(scrollToBottom, 100);
          api.markConversationRead(conv.id).catch(() => {});
        }

        // Fetch initial admin status
        api.getAdminPresenceStatus().then((st) => {
          if (isMounted) setAdminStatus(st);
        }).catch(() => {});

        // Send initial heartbeat
        api.sendPresenceHeartbeat(currentUser.uid, 'user').catch(() => {});

        // Realtime SSE Subscription
        unsubSSE = api.subscribeChat({
          userId: currentUser.uid,
          role: 'user',
          conversationId: conv.id,
          onMessage: (newMsg) => {
            if (!isMounted) return;
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            setTimeout(scrollToBottom, 50);
            if (newMsg.senderRole === 'admin') {
              api.markConversationRead(conv.id).catch(() => {});
            }
          },
          onMessageUpdated: (updatedMsg) => {
            if (!isMounted) return;
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
            );
          },
          onMessagesRead: (readData) => {
            if (!isMounted) return;
            setMessages((prev) =>
              prev.map((m) => {
                if (m.senderId === currentUser.uid && !m.readAt) {
                  return { ...m, readAt: readData.readAt };
                }
                return m;
              })
            );
          },
          onTyping: (data) => {
            if (!isMounted) return;
            if (data.userId !== currentUser.uid) {
              setIsAdminTyping(data.isTyping);
              if (adminTypingTimerRef.current) clearTimeout(adminTypingTimerRef.current);
              if (data.isTyping) {
                adminTypingTimerRef.current = setTimeout(() => {
                  if (isMounted) setIsAdminTyping(false);
                }, 3500);
              }
            }
          },
          onPresence: (pres) => {
            if (!isMounted) return;
            if (pres.role === 'admin') {
              setAdminStatus({
                isOnline: pres.isOnline,
                statusText: pres.isOnline ? 'فريق الدعم متصل الآن' : 'خدمة العملاء متاحة للرد',
              });
            }
          },
        });
      } catch (err: any) {
        if (isMounted) setError(err.message || 'حدث خطأ أثناء تحميل المحادثة');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initChat();

    // Heartbeat every 20s while open
    heartbeatTimer = setInterval(() => {
      if (currentUser) {
        api.sendPresenceHeartbeat(currentUser.uid, 'user').catch(() => {});
        api.getAdminPresenceStatus().then((st) => {
          if (isMounted) setAdminStatus(st);
        }).catch(() => {});
      }
    }, 20000);

    return () => {
      isMounted = false;
      if (unsubSSE) unsubSSE();
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (adminTypingTimerRef.current) clearTimeout(adminTypingTimerRef.current);
      if (userTypingTimerRef.current) clearTimeout(userTypingTimerRef.current);
    };
  }, [isOpen, currentUser, orderId]);

  // Clean up staged attachment URL when changing or unmounting
  useEffect(() => {
    return () => {
      if (stagedFile?.previewUrl) {
        URL.revokeObjectURL(stagedFile.previewUrl);
      }
      if (recordedAudioPreview?.url) {
        URL.revokeObjectURL(recordedAudioPreview.url);
      }
    };
  }, [stagedFile, recordedAudioPreview]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle typing debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (conversation && currentUser) {
      api.sendTyping(conversation.id, true, {
        userId: currentUser.uid,
        userName: profile?.name || currentUser.displayName || 'العميل',
        role: 'user',
      });

      if (userTypingTimerRef.current) clearTimeout(userTypingTimerRef.current);
      userTypingTimerRef.current = setTimeout(() => {
        if (conversation && currentUser) {
          api.sendTyping(conversation.id, false, {
            userId: currentUser.uid,
            userName: profile?.name || currentUser.displayName || 'العميل',
            role: 'user',
          });
        }
      }, 2500);
    }
  };

  // Stage File or Image for Preview before sending
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (stagedFile?.previewUrl) {
      URL.revokeObjectURL(stagedFile.previewUrl);
    }

    const isImg = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg)$/i.test(file.name);
    const previewUrl = isImg ? URL.createObjectURL(file) : undefined;

    setStagedFile({
      file,
      name: file.name,
      size: file.size,
      isImage: isImg,
      previewUrl,
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveStagedFile = () => {
    if (stagedFile?.previewUrl) {
      URL.revokeObjectURL(stagedFile.previewUrl);
    }
    setStagedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Unified Send Message (Text, Attachment with Text, or Quoted Reply)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !stagedFile) || !conversation || !currentUser || sending) return;

    const textToSend = inputText.trim();
    const fileToUpload = stagedFile;
    const replyRef = replyingToMessage
      ? {
          id: replyingToMessage.id,
          senderName: replyingToMessage.senderName,
          type: replyingToMessage.type,
          text: replyingToMessage.text,
          fileName: replyingToMessage.fileName,
          isImage: replyingToMessage.isImage,
        }
      : undefined;

    setInputText('');
    setStagedFile(null);
    setReplyingToMessage(null);
    setSending(true);

    if (userTypingTimerRef.current) clearTimeout(userTypingTimerRef.current);
    api.sendTyping(conversation.id, false, {
      userId: currentUser.uid,
      userName: profile?.name || currentUser.displayName || 'العميل',
      role: 'user',
    }).catch(() => {});

    try {
      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let fileSize: number | undefined;
      let isImage: boolean | undefined;

      if (fileToUpload) {
        setUploadStatusText(fileToUpload.isImage ? 'جاري رفع الصورة...' : 'جاري رفع الملف المرفق...');
        const uploadRes = await api.uploadFile(fileToUpload.file, fileToUpload.name);
        fileUrl = uploadRes.url;
        fileName = fileToUpload.name;
        fileSize = fileToUpload.size;
        isImage = fileToUpload.isImage;

        if (fileToUpload.previewUrl) {
          URL.revokeObjectURL(fileToUpload.previewUrl);
        }
      }

      setUploadStatusText('جاري إرسال الرسالة...');
      const msg = await api.sendMessage(conversation.id, {
        senderId: currentUser.uid,
        senderName: profile?.name || currentUser.displayName || 'العميل',
        senderRole: isAdmin ? 'admin' : 'user',
        type: fileToUpload ? (isImage ? 'image' : 'file') : 'text',
        text: textToSend || undefined,
        fileUrl,
        fileName,
        fileSize,
        isImage,
        replyTo: replyRef,
      });

      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    } catch (err: any) {
      setError(err.message || 'فشل في إرسال الرسالة');
    } finally {
      setSending(false);
      setUploadStatusText(null);
    }
  };

  // Message Edit Handlers
  const handleStartEdit = (msg: MessageItem) => {
    setEditingMessage(msg);
    setEditText(msg.text || '');
  };

  const handleSaveEdit = async () => {
    if (!conversation || !editingMessage || !editText.trim() || savingEdit) return;
    try {
      setSavingEdit(true);
      const updated = await api.editMessage(conversation.id, editingMessage.id, editText.trim());
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditingMessage(null);
      setEditText('');
    } catch (err: any) {
      setError(err.message || 'فشل في تعديل الرسالة');
    } finally {
      setSavingEdit(false);
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

  // Voice recording & preview
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

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());

        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - (recordingStartTimeRef.current || startTime)) / 1000)
        );

        if (audioBlob.size > 100) {
          const previewUrl = URL.createObjectURL(audioBlob);
          setRecordedAudioPreview({
            blob: audioBlob,
            url: previewUrl,
            duration: durationSeconds,
          });
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

  const handleDiscardAudioPreview = () => {
    if (recordedAudioPreview?.url) {
      URL.revokeObjectURL(recordedAudioPreview.url);
    }
    setRecordedAudioPreview(null);
    setIsPreviewAudioPlaying(false);
  };

  const handleSendAudioPreview = async () => {
    if (!recordedAudioPreview || !conversation || !currentUser || sending) return;
    const replyRef = replyingToMessage
      ? {
          id: replyingToMessage.id,
          senderName: replyingToMessage.senderName,
          type: replyingToMessage.type,
          text: replyingToMessage.text,
          fileName: replyingToMessage.fileName,
          isImage: replyingToMessage.isImage,
        }
      : undefined;

    setReplyingToMessage(null);
    setSending(true);
    setUploadStatusText('جاري إرسال التسجيل الصوتي...');

    try {
      const uploadRes = await api.uploadFile(
        recordedAudioPreview.blob,
        `voice-${Date.now()}.webm`
      );
      const msg = await api.sendMessage(conversation.id, {
        senderId: currentUser.uid,
        senderName: profile?.name || currentUser.displayName || 'العميل',
        senderRole: isAdmin ? 'admin' : 'user',
        type: 'audio',
        audioUrl: uploadRes.url,
        audioDuration: recordedAudioPreview.duration,
        replyTo: replyRef,
      });
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      handleDiscardAudioPreview();
    } catch (err: any) {
      setError(err.message || 'فشل في إرسال التسجيل الصوتي');
    } finally {
      setSending(false);
      setUploadStatusText(null);
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
        {/* Header - Site logo & live presence indicator & close button */}
        <div className="px-4 py-3 bg-[#121824] border-b border-white/[0.06] flex items-center justify-between shrink-0">
          {/* Logo with Site Name */}
          <div className="flex items-center gap-3">
            <Logo iconPosition="left" />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-white/[0.07] text-[11px] text-slate-300">
              <span
                className={`w-2 h-2 rounded-full ${
                  adminStatus.isOnline ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50' : 'bg-slate-500'
                }`}
              />
              <span className="font-cairo text-[11px] font-medium">{adminStatus.statusText}</span>
            </div>
          </div>

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
              const canDelete = isMine || isAdmin;
              const canEdit = isMine && !isDeleted && msg.type === 'text';

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

                  <div className="flex items-center gap-1.5 max-w-[90%]">
                    {/* Actions Toolbar: Reply, Edit, Delete */}
                    {!isDeleted && (
                      <div
                        className={`opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 ${
                          isMine ? 'order-first' : 'order-last'
                        }`}
                      >
                        {/* Reply Button */}
                        <button
                          type="button"
                          onClick={() => setReplyingToMessage(msg)}
                          title="رد على الرسالة"
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                        >
                          <Reply className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Button (Text messages by author only) */}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(msg)}
                            title="تعديل الرسالة"
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete Button */}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setMsgToDelete(msg.id)}
                            title="حذف الرسالة"
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Deleted Message Bubble */}
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
                        {/* Quoted Reply Preview */}
                        {msg.replyTo && (
                          <div
                            className={`mb-2 p-2 rounded-lg border-r-2 text-xs font-cairo leading-relaxed ${
                              isMine
                                ? 'bg-emerald-600/60 border-slate-950 text-slate-900'
                                : 'bg-[#0a0e16] border-emerald-500 text-slate-300'
                            }`}
                          >
                            <div className="font-bold text-[11px] opacity-90 mb-0.5">
                              {msg.replyTo.senderName}
                            </div>
                            <div className="truncate text-[11px] opacity-80">
                              {msg.replyTo.text ||
                                (msg.replyTo.type === 'image'
                                  ? '📷 صورة'
                                  : msg.replyTo.type === 'audio'
                                  ? '🎙️ رسالة صوتية'
                                  : '📎 ملف مرفق')}
                            </div>
                          </div>
                        )}

                        {/* Text message or caption */}
                        {msg.text && (
                          <p className="whitespace-pre-wrap font-cairo font-medium text-sm sm:text-base leading-relaxed">
                            {msg.text}
                          </p>
                        )}

                        {/* Image message with inline preview and dedicated download button */}
                        {(msg.type === 'image' || msg.isImage) && msg.fileUrl && (
                          <div className="space-y-2 min-w-[200px] max-w-sm mt-2">
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

                        {/* Document / File */}
                        {msg.type === 'file' && !msg.isImage && (
                          <div className="space-y-2 min-w-[200px] mt-2">
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

                        {/* Voice message */}
                        {msg.type === 'audio' && msg.audioUrl && (
                          <div className="mt-1">
                            <AudioMessagePlayer
                              src={msg.audioUrl}
                              duration={msg.audioDuration}
                              isMine={isMine}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Message timestamp, Edited status, and Sent (✓) / Read (✓✓) status indicator */}
                  <div className="flex items-center gap-1.5 px-1 mt-1 font-mono text-[10px]">
                    <span className="text-slate-500 font-payment-digits">
                      {new Date(msg.createdAt).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {msg.isEdited && !isDeleted && (
                      <span className="text-slate-500 font-cairo text-[9px]">(معدلة)</span>
                    )}
                    {isMine && !isDeleted && (
                      <span
                        className={`inline-flex items-center text-xs font-bold transition-colors ${
                          msg.readAt ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                        title={msg.readAt ? `تمت القراءة: ${new Date(msg.readAt).toLocaleTimeString('ar-EG')}` : 'تم الإرسال'}
                      >
                        {msg.readAt ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Typing indicator bubble */}
          {isAdminTyping && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#121824] border border-white/[0.07] text-slate-300 text-xs font-cairo w-fit animate-in fade-in duration-150">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-slate-400 text-[11px] mr-1">الدعم الفني يكتب الآن...</span>
            </div>
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

        {/* Edit Message Modal Overlay */}
        {editingMessage && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-md bg-[#121824] border border-white/[0.1] rounded-2xl p-5 space-y-4 text-right shadow-2xl">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-100 font-cairo">تعديل الرسالة</h4>
                <button
                  type="button"
                  onClick={() => setEditingMessage(null)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full p-3 bg-[#080b11] border border-white/[0.1] focus:border-emerald-500/60 rounded-xl text-sm font-cairo text-slate-100 outline-none resize-none"
                placeholder="اكتب التعديل..."
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMessage(null)}
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={savingEdit || !editText.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 text-xs font-bold flex items-center gap-1.5"
                >
                  {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>حفظ التعديل</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-2.5 sm:p-3 bg-[#121824] border-t border-white/[0.06]">
          {/* Quoted Reply Preview Banner */}
          {replyingToMessage && (
            <div className="mb-2 p-2 rounded-xl bg-[#090d16] border border-emerald-500/30 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-1 h-8 rounded-full bg-emerald-400 shrink-0" />
                <div className="min-w-0 text-right">
                  <span className="text-[11px] font-bold text-emerald-400 block font-cairo">
                    الرد على {replyingToMessage.senderName}
                  </span>
                  <span className="text-xs text-slate-300 truncate block font-cairo">
                    {replyingToMessage.text ||
                      (replyingToMessage.type === 'image'
                        ? 'صورة'
                        : replyingToMessage.type === 'audio'
                        ? 'تسجيل صوتي'
                        : 'ملف مرفق')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyingToMessage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
                title="إلغاء الرد"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Staged Attachment Preview Banner (Before Sending) */}
          {stagedFile && (
            <div className="mb-2.5 p-2.5 rounded-xl bg-[#090d16] border border-emerald-500/40 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                {stagedFile.isImage && stagedFile.previewUrl ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-emerald-500/30 bg-black/40 shrink-0">
                    <img
                      src={stagedFile.previewUrl}
                      alt={stagedFile.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0 text-right">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-200 truncate max-w-[180px] sm:max-w-xs font-cairo">
                      {stagedFile.name}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 shrink-0 font-cairo">
                      جاهز للإرسال
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-payment-digits mt-0.5">
                    الحجم: {formatFileSize(stagedFile.size)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveStagedFile}
                disabled={sending}
                title="إلغاء إرفاق الملف"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Staged Audio Recording Preview Banner (After Recording, Before Sending) */}
          {recordedAudioPreview && (
            <div className="mb-2.5 p-2.5 rounded-xl bg-[#090d16] border border-emerald-500/40 flex items-center justify-between gap-3 animate-in fade-in">
              <audio
                ref={previewAudioRef}
                src={recordedAudioPreview.url}
                onEnded={() => setIsPreviewAudioPlaying(false)}
              />
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    if (previewAudioRef.current) {
                      if (isPreviewAudioPlaying) {
                        previewAudioRef.current.pause();
                        setIsPreviewAudioPlaying(false);
                      } else {
                        previewAudioRef.current.play();
                        setIsPreviewAudioPlaying(true);
                      }
                    }
                  }}
                  className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0"
                >
                  {isPreviewAudioPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
                <div>
                  <span className="text-xs font-bold text-slate-200 font-cairo block">
                    تسجيل صوتي ({formatAudioDuration(recordedAudioPreview.duration)})
                  </span>
                  <span className="text-[10px] text-emerald-400 font-cairo">جاهز للإرسال، استمع أو اضغط إرسال</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDiscardAudioPreview}
                  disabled={sending}
                  title="حذف التسجيل"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSendAudioPreview}
                  disabled={sending}
                  title="إرسال التسجيل"
                  className="h-9 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 -rotate-90" />}
                  <span>إرسال</span>
                </button>
              </div>
            </div>
          )}

          {/* Uploading Status Banner */}
          {uploadStatusText && (
            <div className="mb-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 font-cairo">
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span className="font-semibold">{uploadStatusText}</span>
            </div>
          )}

          {/* Recording active indicator */}
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
                <span>إيقاف ومعاينة</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex items-end gap-1.5 sm:gap-2 w-full min-w-0">
              {/* File upload hidden input & button */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                id="chat-file-upload-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                id="attach-file-btn"
                title="إرفاق صورة أو ملف"
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl transition-colors border flex items-center justify-center shrink-0 cursor-pointer ${
                  stagedFile
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-[#172030] hover:bg-[#1f2b40] text-slate-300 hover:text-emerald-400 border-white/[0.08]'
                }`}
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Voice Record button */}
              <button
                type="button"
                onClick={startRecording}
                disabled={sending || Boolean(recordedAudioPreview)}
                id="voice-record-btn"
                title="تسجيل رسالة صوتية"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#172030] hover:bg-[#1f2b40] text-slate-300 hover:text-emerald-400 transition-colors border border-white/[0.08] flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* Enhanced Textarea with comfortable Cairo font and line-height */}
              <textarea
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder={stagedFile ? 'اكتب تعليقًا على الملف المرفق...' : 'اكتب رسالتك هنا...'}
                disabled={sending}
                className="flex-1 min-w-0 min-h-[42px] max-h-28 py-2 px-3.5 bg-[#080b11] border border-white/[0.1] focus:border-emerald-500/60 rounded-xl text-sm sm:text-[15px] font-normal font-cairo leading-relaxed text-slate-100 placeholder:text-slate-500 outline-none resize-none transition-colors"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={(!inputText.trim() && !stagedFile) || sending}
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

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Conversation, MessageItem } from '../types';
import { Logo } from './Logo';
import { AudioMessagePlayer } from './ui/AudioMessagePlayer';
import { ConfirmationModal } from './ConfirmationModal';
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
  Package,
  Copy,
  Check,
  ArrowDown,
  Upload,
  Eye,
  FileArchive,
  FileSpreadsheet,
} from 'lucide-react';
import {
  mergeAndSortMessages,
  copyTextToClipboard,
  isNearBottom,
  formatFileSize,
  validateAttachmentFile,
  downloadAttachment,
  getFileCategory,
} from '../lib/chatUtils';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  orderId?: string;
  orderNumber?: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  conversationId,
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
  const markReadTimerRef = useRef<any>(null);

  // Pagination & Smart Scroll State
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasNewMessagesBelow, setHasNewMessagesBelow] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeConvIdRef = useRef<string | null>(null);

  const scheduleMarkAsRead = (convId: string, delay = 800) => {
    if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    markReadTimerRef.current = setTimeout(() => {
      if (isOpen && !document.hidden) {
        api.markConversationRead(convId).catch(() => {});
      }
    }, delay);
  };

  // Active Order Context inside customer canonical conversation
  const [activeOrderContext, setActiveOrderContext] = useState<{
    orderId?: string;
    orderNumber?: string;
  }>({ orderId, orderNumber });

  useEffect(() => {
    if (orderId) {
      setActiveOrderContext({ orderId, orderNumber });
    }
  }, [orderId, orderNumber]);

  // Presence & Typing State
  const [adminStatus, setAdminStatus] = useState<{ isOnline: boolean; statusText: string }>({
    isOnline: false,
    statusText: 'خدمة العملاء متاحة',
  });
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const adminTypingTimerRef = useRef<any>(null);
  const userTypingTimerRef = useRef<any>(null);
  const lastTypingSentRef = useRef<number>(0);

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

  // Desktop Drag & Drop and Image Viewer states
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [viewingImage, setViewingImage] = useState<{ url: string; name?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Format seconds to mm:ss
  const formatAudioDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Reset chat state when active user changes
  useEffect(() => {
    setConversation(null);
    setMessages([]);
    setError(null);
    setEditingMessage(null);
    setReplyingToMessage(null);
    setHasMore(false);
    setLoadingOlder(false);
    setHasNewMessagesBelow(false);
  }, [currentUser?.uid]);

  // Format bytes to readable size
  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Scroll to bottom
  const scrollToBottom = (smooth = true) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  // Load older messages (Pagination)
  const loadOlderMessages = async () => {
    if (loadingOlder || !hasMore || messages.length === 0 || !conversation) return;
    const firstMsg = messages[0];
    if (!firstMsg) return;

    setLoadingOlder(true);
    const container = scrollContainerRef.current;
    const prevScrollHeight = container ? container.scrollHeight : 0;
    const prevScrollTop = container ? container.scrollTop : 0;

    try {
      const res = await api.getMessagesWithMeta(conversation.id, {
        limit: 25,
        before: firstMsg.id,
      });

      if (res.messages.length === 0) {
        setHasMore(false);
      } else {
        setHasMore(res.hasMore);
        setMessages((prev) => mergeAndSortMessages(prev, res.messages));

        // Preserve scroll position with zero jump
        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
          }
        });
      }
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setLoadingOlder(false);
    }
  };

  // Handle scroll container events
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (isNearBottom(container, 100)) {
      setHasNewMessagesBelow(false);
    }

    if (container.scrollTop < 60 && hasMore && !loadingOlder) {
      loadOlderMessages();
    }
  };

  // Copy message text
  const handleCopyMessage = async (msg: MessageItem) => {
    if (!msg.text) return;
    const ok = await copyTextToClipboard(msg.text);
    if (ok) {
      setCopiedMsgId(msg.id);
      setTimeout(() => setCopiedMsgId((prev) => (prev === msg.id ? null : prev)), 2000);
    }
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

        let conv: Conversation;
        if (conversationId) {
          try {
            conv = await api.getConversation(conversationId);
          } catch {
            conv = await api.findOrCreateConversation({
              userId: currentUser.uid,
              userName: profile?.name || currentUser.displayName || 'العميل',
              userEmail: currentUser.email || '',
              orderId: activeOrderContext.orderId || orderId,
            });
          }
        } else {
          conv = await api.findOrCreateConversation({
            userId: currentUser.uid,
            userName: profile?.name || currentUser.displayName || 'العميل',
            userEmail: currentUser.email || '',
            orderId: activeOrderContext.orderId || orderId,
          });
        }

        if (!isMounted) return;
        activeConvIdRef.current = conv.id;
        setConversation(conv);

        // Fetch existing messages with pagination
        const res = await api.getMessagesWithMeta(conv.id, { limit: 25 });
        if (isMounted) {
          setMessages(res.messages);
          setHasMore(res.hasMore);
          // Scroll to bottom on initial conversation open
          requestAnimationFrame(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
            }
          });
          const hasUnread = res.messages.some((m) => m.senderRole === 'admin' && !m.readAt);
          if (hasUnread && isOpen && !document.hidden) {
            scheduleMarkAsRead(conv.id, 800);
          }
        }

        // Fetch initial admin status
        api.getAdminPresenceStatus().then((st) => {
          if (isMounted) setAdminStatus(st);
        }).catch(() => {});

        // Send initial heartbeat
        api.sendPresenceHeartbeat(currentUser.uid, 'user').catch(() => {});

        // Realtime SSE Subscription
        unsubSSE = api.subscribeChat({
          conversationId: conv.id,
          onMessage: (newMsg, eventConvId) => {
            if (!isMounted) return;
            const targetConvId = eventConvId || newMsg.conversationId;
            // Strict isolation check: ignore events not belonging to this canonical conversation
            if (targetConvId && targetConvId !== conv.id) return;

            setMessages((prev) => mergeAndSortMessages(prev, [newMsg]));

            const container = scrollContainerRef.current;
            const nearBottom = container ? isNearBottom(container, 120) : true;

            if (nearBottom) {
              requestAnimationFrame(() => {
                if (container) {
                  container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
                }
              });
              if (newMsg.senderRole === 'admin') {
                if (isOpen && !document.hidden) {
                  scheduleMarkAsRead(conv.id, 1200);
                }
              }
            } else {
              setHasNewMessagesBelow(true);
            }
          },
          onMessageUpdated: (updatedMsg, eventConvId) => {
            if (!isMounted) return;
            const targetConvId = eventConvId || updatedMsg.conversationId;
            if (targetConvId && targetConvId !== conv.id) return;

            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
            );
          },
          onMessageDeleted: (delData) => {
            if (!isMounted) return;
            if (delData.conversationId && delData.conversationId !== conv.id) return;

            setMessages((prev) =>
              prev.map((m) =>
                m.id === delData.messageId
                  ? (delData.message || { ...m, isDeleted: true, text: 'تم حذف هذه الرسالة' })
                  : m
              )
            );
          },
          onMessagesRead: (readData) => {
            if (!isMounted) return;
            if (readData.conversationId && readData.conversationId !== conv.id) return;

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
            // Only react to typing in THIS conversation from support
            if (data.conversationId !== conv.id) return;
            if (data.userId === currentUser.uid) return;

            setIsAdminTyping(data.isTyping);
            if (adminTypingTimerRef.current) clearTimeout(adminTypingTimerRef.current);
            if (data.isTyping) {
              adminTypingTimerRef.current = setTimeout(() => {
                if (isMounted) setIsAdminTyping(false);
              }, 3500);
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
      if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    };
  }, [isOpen, currentUser, conversationId, orderId]);

  // Handle document visibility change to mark unread messages read only when user actually views
  useEffect(() => {
    const handleVisibility = () => {
      if (isOpen && !document.hidden && conversation) {
        const hasUnread = messages.some((m) => m.senderRole === 'admin' && !m.readAt);
        if (hasUnread) {
          scheduleMarkAsRead(conversation.id, 600);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    };
  }, [isOpen, conversation, messages]);

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

  // Handle typing debounce and throttle
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (conversation && currentUser) {
      const now = Date.now();
      // Throttle typing event to send at most once every 2.5s
      if (now - lastTypingSentRef.current > 2500) {
        lastTypingSentRef.current = now;
        api.sendTyping(conversation.id, true).catch(() => {});
      }

      if (userTypingTimerRef.current) clearTimeout(userTypingTimerRef.current);
      userTypingTimerRef.current = setTimeout(() => {
        if (conversation && currentUser) {
          lastTypingSentRef.current = 0;
          api.sendTyping(conversation.id, false).catch(() => {});
        }
      }, 2500);
    }
  };

  // Stage File or Image for Preview before sending with strict security validation
  const stageSelectedFile = (file: File) => {
    const validation = validateAttachmentFile(file);
    if (!validation.valid) {
      setError(validation.error || 'الملف المختار غير صالح');
      return;
    }

    if (stagedFile?.previewUrl) {
      URL.revokeObjectURL(stagedFile.previewUrl);
    }

    const previewUrl = validation.isImage ? URL.createObjectURL(file) : undefined;

    setStagedFile({
      file,
      name: file.name,
      size: file.size,
      isImage: validation.isImage,
      previewUrl,
    });
    setError(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stageSelectedFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveStagedFile = () => {
    if (stagedFile?.previewUrl) {
      URL.revokeObjectURL(stagedFile.previewUrl);
    }
    setStagedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Desktop Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingFile) setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      stageSelectedFile(file);
    }
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

    setSending(true);
    setError(null);

    if (userTypingTimerRef.current) clearTimeout(userTypingTimerRef.current);
    lastTypingSentRef.current = 0;
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
        orderId: activeOrderContext.orderId,
        orderNumber: activeOrderContext.orderNumber,
      });

      // Clear form only on successful delivery
      setInputText('');
      setStagedFile(null);
      setReplyingToMessage(null);

      setMessages((prev) => mergeAndSortMessages(prev, [msg]));

      // Scroll to bottom on user's own sent message
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    } catch (err: any) {
      setError(err.message || 'فشل في إرسال الرسالة، يرجى المحاولة مرة أخرى');
    } finally {
      setSending(false);
      setUploadStatusText(null);
    }
  };

  // Message Edit Handlers
  const handleStartEdit = (msg: MessageItem) => {
    setReplyingToMessage(null);
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
        orderId: activeOrderContext.orderId,
        orderNumber: activeOrderContext.orderNumber,
      });
      setMessages((prev) => mergeAndSortMessages(prev, [msg]));
      handleDiscardAudioPreview();
      requestAnimationFrame(() => {
        scrollToBottom();
      });
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
      {/* Mobile: Full screen. Computer/Desktop: Anchored drawer with responsive max-width */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl h-full bg-[#090d16] border-l md:border-r-0 border-white/[0.08] shadow-2xl flex flex-col overflow-hidden text-right"
      >
        {/* Desktop Drag & Drop Visual Overlay */}
        {isDraggingFile && (
          <div className="absolute inset-0 z-50 bg-[#090d16]/95 border-2 border-dashed border-emerald-500 flex flex-col items-center justify-center gap-3 backdrop-blur-sm pointer-events-none animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Upload className="w-8 h-8 animate-bounce" />
            </div>
            <p className="text-sm font-bold text-slate-100 font-cairo">أفلت الملف هنا للمعاينة قبل الإرسال</p>
            <p className="text-xs text-slate-400 font-cairo">يدعم الصور والمستندات بحد أقصى 15 ميجابايت</p>
          </div>
        )}

        {/* Header - Site logo & live presence indicator & close button */}
        <div className="px-4 py-3 bg-[#0d131f] border-b border-white/[0.07] flex items-center justify-between shrink-0 select-none">
          {/* Logo with Presence */}
          <div className="flex items-center gap-3 min-w-0">
            <Logo iconPosition="left" />
            <div className="h-4 w-px bg-white/[0.1] hidden sm:block shrink-0" />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-white/[0.08] text-[11px] text-slate-300">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  adminStatus.isOnline
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse'
                    : 'bg-slate-500'
                }`}
              />
              <span className="font-cairo text-[11px] font-medium truncate max-w-[120px] sm:max-w-none">
                {adminStatus.statusText}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Active order context badge in header */}
            {activeOrderContext.orderNumber && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-mono">
                <Package className="w-3.5 h-3.5 text-emerald-400" />
                <span>طلب #{activeOrderContext.orderNumber}</span>
                <button
                  type="button"
                  onClick={() => setActiveOrderContext({})}
                  className="text-slate-400 hover:text-white mr-1 p-0.5 rounded hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title="إلغاء تحديد الطلب والتحدث بشكل عام"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              id="close-chat-modal-btn"
              className="w-9 h-9 rounded-xl border border-white/[0.08] bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-sm"
              title="إغلاق المحادثة"
              aria-label="إغلاق المحادثة"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Active Order Context Sub-Banner */}
        {activeOrderContext.orderNumber && (
          <div className="px-4 py-1.5 bg-emerald-950/40 border-b border-emerald-500/20 flex items-center justify-between text-xs text-emerald-300 shrink-0">
            <div className="flex items-center gap-1.5 font-mono text-[11px] sm:text-xs">
              <Package className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>سياق المحادثة الحالي: طلب #{activeOrderContext.orderNumber}</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveOrderContext({})}
              className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
              title="إزالة ربط الطلب بالتحدث بشكل عام"
            >
              متابعة كدعم عام
            </button>
          </div>
        )}

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
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          id="chat-messages-scroll-area"
          className="flex-1 p-4 overflow-y-auto overflow-x-hidden space-y-3 bg-[#080b11] relative"
        >
          {/* Top Pagination Loading Indicator */}
          {loadingOlder && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-emerald-400 font-cairo bg-slate-900/60 rounded-xl border border-white/[0.05]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>جاري تحميل الرسائل السابقة...</span>
            </div>
          )}

          {!hasMore && messages.length >= 25 && (
            <div className="text-center py-2 text-[11px] text-slate-500 font-cairo border-b border-white/[0.04]">
              <span>بداية المحادثة</span>
            </div>
          )}

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
            messages.map((msg, index) => {
              const isMine = msg.senderId === currentUser?.uid;
              const isAdminMsg = msg.senderRole === 'admin';
              const isDeleted = msg.isDeleted || msg.text === 'تم حذف هذه الرسالة';
              // Strictly allow deletion and editing only on the user's OWN messages!
              const canDelete = isMine && !isDeleted;
              const canEdit = isMine && !isDeleted && msg.type === 'text';
              const canCopy = !isDeleted && Boolean(msg.text);
              const canReply = !isDeleted;

              // Message grouping check for visual elegance
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const isSameSender = prevMsg && prevMsg.senderId === msg.senderId;
              const isWithin2Mins =
                prevMsg &&
                Math.abs(new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()) < 120000;
              const showSenderHeader = !isSameSender || !isWithin2Mins;

              return (
                <div
                  key={msg.id}
                  id={`chat-msg-${msg.id}`}
                  className={`group flex flex-col ${isMine ? 'items-end' : 'items-start'} ${
                    showSenderHeader ? 'mt-3.5 first:mt-0' : 'mt-1'
                  }`}
                >
                  {showSenderHeader && (
                    <div className="flex items-center gap-1.5 mb-1 px-1 font-cairo select-none">
                      <span className="text-xs font-semibold text-slate-400">
                        {isMine ? 'أنت' : msg.senderName}
                      </span>
                      {isAdminMsg && !isMine && (
                        <span className="text-[10.5px] px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/25">
                          الدعم الفني
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 max-w-[88%] sm:max-w-[82%]">
                    {/* Actions Toolbar: Reply, Copy, Edit, Delete */}
                    {!isDeleted && (
                      <div
                        className={`opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-all flex items-center gap-0.5 bg-[#0d121c]/90 backdrop-blur-md border border-white/[0.08] shadow-sm rounded-xl p-0.5 shrink-0 ${
                          isMine ? 'order-first' : 'order-last'
                        }`}
                      >
                        {/* Reply Button */}
                        {canReply && (
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingToMessage(msg);
                              setEditingMessage(null);
                            }}
                            title="رد على الرسالة"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-white/[0.06] transition-colors cursor-pointer"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Copy Button */}
                        {canCopy && (
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg)}
                            title="نسخ نص الرسالة"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-white/[0.06] transition-colors relative cursor-pointer"
                          >
                            {copiedMsgId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}

                        {/* Edit Button (Text messages by author only) */}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(msg)}
                            title="تعديل الرسالة"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-white/[0.06] transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete Button (Author only) */}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setMsgToDelete(msg.id)}
                            title="حذف الرسالة"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Deleted Message Bubble */}
                    {isDeleted ? (
                      <div className="flex items-center gap-2 py-2 px-3.5 rounded-2xl bg-slate-900/50 border border-white/[0.06] text-slate-400 italic text-xs shadow-sm font-cairo">
                        <Ban className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>تم حذف هذه الرسالة</span>
                      </div>
                    ) : (
                      <div
                        className={`rounded-2xl p-3 sm:p-3.5 text-sm sm:text-[14.5px] leading-relaxed shadow-sm flex-1 font-cairo select-text break-words [overflow-wrap:anywhere] transition-colors ${
                          isMine
                            ? 'bg-gradient-to-br from-[#0e3025] to-[#0a2019] text-emerald-50 border border-emerald-500/35 rounded-tl-sm shadow-md shadow-emerald-950/20'
                            : 'bg-[#111726] text-slate-100 border border-white/[0.08] rounded-tr-sm shadow-sm'
                        }`}
                      >
                        {/* Order Context Tag if message is related to an order */}
                        {msg.orderNumber && (
                          <div
                            className={`inline-flex items-center gap-1.5 mb-2 px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-medium ${
                              isMine
                                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            <Package className="w-3 h-3 shrink-0" />
                            <span>طلب #{msg.orderNumber}</span>
                          </div>
                        )}

                        {/* Quoted Reply Preview */}
                        {msg.replyTo && (
                          <div
                            className={`mb-2 p-2 rounded-lg border-r-2 text-xs font-cairo leading-relaxed ${
                              isMine
                                ? 'bg-black/30 border-emerald-400 text-slate-200'
                                : 'bg-black/40 border-emerald-500 text-slate-300'
                            }`}
                          >
                            <div className="font-bold text-[11px] text-emerald-300 mb-0.5 flex items-center gap-1">
                              <Reply className="w-3 h-3 shrink-0" />
                              <span>{msg.replyTo.senderName}</span>
                            </div>
                            <div className="truncate text-[11px] text-slate-300">
                              {msg.replyTo.text === 'تم حذف هذه الرسالة' ||
                              messages.find((m) => m.id === msg.replyTo?.id)?.isDeleted ? (
                                <span className="italic opacity-70">تم حذف هذه الرسالة</span>
                              ) : (
                                msg.replyTo.text ||
                                (msg.replyTo.type === 'image'
                                  ? '📷 صورة'
                                  : msg.replyTo.type === 'audio'
                                  ? '🎙️ رسالة صوتية'
                                  : '📎 ملف مرفق')
                              )}
                            </div>
                          </div>
                        )}

                        {/* Text message or caption */}
                        {msg.text && (
                          <p
                            className="whitespace-pre-wrap font-cairo font-normal leading-[1.65] break-words [overflow-wrap:anywhere] [unicode-bidi:plaintext]"
                            dir="auto"
                          >
                            {msg.text}
                          </p>
                        )}

                        {/* Image message */}
                        {(msg.type === 'image' || msg.isImage) && msg.fileUrl && (
                          <div className="space-y-2 min-w-[200px] max-w-sm mt-2">
                            <div
                              onClick={() => setViewingImage({ url: msg.fileUrl!, name: msg.fileName })}
                              className="group relative rounded-xl overflow-hidden bg-black/50 border border-white/[0.08] max-h-64 sm:max-h-72 flex items-center justify-center cursor-pointer"
                              title="اضغط لعرض الصورة بالحجم الكامل"
                            >
                              <img
                                src={msg.fileUrl}
                                alt={msg.fileName || 'صورة'}
                                className="w-full max-h-64 sm:max-h-72 object-contain rounded-xl group-hover:scale-[1.02] transition-transform duration-200"
                                referrerPolicy="no-referrer"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-cairo backdrop-blur-[2px]">
                                <Eye className="w-4 h-4" />
                                <span>عرض بالحجم الكامل</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <ImageIcon className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                                <span className="text-[11px] truncate text-slate-200 font-medium">
                                  {msg.fileName || 'صورة'}
                                </span>
                                {Boolean(msg.fileSize) && (
                                  <span className="text-[10px] text-slate-400 font-payment-digits">
                                    ({formatFileSize(msg.fileSize)})
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => downloadAttachment(msg.fileUrl!, msg.fileName || 'image.jpg')}
                                className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg text-[11px] font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors cursor-pointer shadow-sm"
                              >
                                <Download className="w-3 h-3" />
                                <span>تنزيل</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Document / File */}
                        {msg.type === 'file' && !msg.isImage && msg.fileUrl && (
                          <div className="space-y-2 min-w-[210px] max-w-sm mt-2">
                            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/30 border border-white/[0.08]">
                              <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
                                {getFileCategory(msg.fileName) === 'sheet' ? (
                                  <FileSpreadsheet className="w-5 h-5" />
                                ) : getFileCategory(msg.fileName) === 'archive' ? (
                                  <FileArchive className="w-5 h-5" />
                                ) : (
                                  <FileText className="w-5 h-5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 text-right">
                                <p className="font-bold truncate text-xs text-slate-100">
                                  {msg.fileName || 'ملف مرفق'}
                                </p>
                                {Boolean(msg.fileSize) && (
                                  <p className="text-[10.5px] text-slate-400 font-payment-digits mt-0.5">
                                    الحجم: {formatFileSize(msg.fileSize)}
                                  </p>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => downloadAttachment(msg.fileUrl!, msg.fileName || 'document')}
                              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors cursor-pointer shadow-sm"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>تحميل الملف</span>
                            </button>
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
                          msg.readAt ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                        title={
                          msg.readAt
                            ? `تمت القراءة: ${new Date(msg.readAt).toLocaleTimeString('ar-EG')}`
                            : 'تم الإرسال'
                        }
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
              <span className="text-slate-400 text-[11px] mr-1 font-medium">الدعم الفني يكتب الآن...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Delete Confirmation Modal Overlay */}
        <ConfirmationModal
          isOpen={Boolean(msgToDelete)}
          onClose={() => setMsgToDelete(null)}
          onConfirm={confirmDelete}
          title="تأكيد حذف الرسالة"
          description="هل أنت متأكد من رغبتك في حذف هذه الرسالة نهائياً من المحادثة؟"
          confirmLabel="نعم، حذف الرسالة"
          cancelLabel="إلغاء"
          isDestructive={true}
          icon="trash"
          isLoading={deletingMsg}
        />

        {/* Floating New Messages Indicator */}
        {hasNewMessagesBelow && (
          <div className="relative flex justify-center w-full select-none">
            <button
              type="button"
              onClick={() => {
                scrollToBottom();
                setHasNewMessagesBelow(false);
                if (conversation) scheduleMarkAsRead(conversation.id, 400);
              }}
              className="absolute -top-11 z-20 px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 transition-all cursor-pointer animate-bounce font-cairo"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>رسائل جديدة</span>
            </button>
          </div>
        )}

        {/* Composer / Input Area */}
        <div className="p-3 bg-[#0d131f] border-t border-white/[0.07] shrink-0">
          {/* Edit Mode Composer Banner (Inline experience) */}
          {editingMessage ? (
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    <Pencil className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 text-right">
                    <span className="text-xs font-bold text-amber-300 font-cairo block">
                      أنت تقوم الآن بتعديل رسالة سابقة
                    </span>
                    <span className="text-[11px] text-slate-400 truncate block font-cairo mt-0.5 max-w-[220px] sm:max-w-md">
                      {editingMessage.text}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingMessage(null);
                    setEditText('');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-cairo text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0 cursor-pointer"
                  title="إلغاء التعديل"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>إلغاء</span>
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveEdit();
                }}
                className="flex items-end gap-2 w-full min-w-0"
              >
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveEdit();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setEditingMessage(null);
                      setEditText('');
                    }
                  }}
                  rows={1}
                  placeholder="اكتب التعديل..."
                  disabled={savingEdit}
                  className="flex-1 min-w-0 min-h-[44px] max-h-32 py-2.5 px-3.5 bg-[#080b11] border border-amber-500/40 focus:border-amber-400 rounded-xl text-sm sm:text-[14.5px] font-cairo leading-relaxed text-slate-100 outline-none resize-none transition-colors"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!editText.trim() || savingEdit}
                  className="h-11 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-40 text-slate-950 font-bold text-xs font-cairo transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-md shadow-amber-500/20"
                  title="حفظ التعديل"
                >
                  {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span className="hidden sm:inline">حفظ</span>
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Quoted Reply Preview Banner */}
              {replyingToMessage && (
                <div className="mb-2 p-2.5 rounded-xl bg-[#080c14] border border-emerald-500/30 flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-1 h-8 rounded-full bg-emerald-400 shrink-0" />
                    <div className="min-w-0 text-right">
                      <span className="text-[11px] font-bold text-emerald-400 block font-cairo">
                        الرد على {replyingToMessage.senderName}
                      </span>
                      <span className="text-xs text-slate-300 truncate block font-cairo mt-0.5">
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
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                    title="إلغاء الرد"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Staged Attachment Preview Banner (Before Sending) */}
              {stagedFile && (
                <div className="mb-2.5 p-2.5 rounded-xl bg-[#080c14] border border-emerald-500/40 flex items-center justify-between gap-3 animate-in fade-in">
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
                <div className="mb-2.5 p-2.5 rounded-xl bg-[#080c14] border border-emerald-500/40 flex items-center justify-between gap-3 animate-in fade-in">
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
                      className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 flex items-center justify-center shrink-0 cursor-pointer shadow-sm shadow-emerald-500/20"
                    >
                      {isPreviewAudioPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>
                    <div>
                      <span className="text-xs font-bold text-slate-200 font-cairo block">
                        تسجيل صوتي ({formatAudioDuration(recordedAudioPreview.duration)})
                      </span>
                      <span className="text-[10.5px] text-emerald-400 font-cairo">
                        جاهز للإرسال، استمع أو اضغط إرسال
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDiscardAudioPreview}
                      disabled={sending}
                      title="حذف التسجيل"
                      className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleSendAudioPreview}
                      disabled={sending}
                      title="إرسال التسجيل"
                      className="h-9 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-emerald-500/20"
                    >
                      {sending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5 -rotate-90" />
                      )}
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
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                    <span className="text-xs font-semibold truncate font-mono">
                      جاري التسجيل ({formatAudioDuration(recordingSeconds)})...
                    </span>
                  </div>
                  <button
                    onClick={stopRecording}
                    id="stop-recording-btn"
                    className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-red-500 hover:bg-red-600 active:scale-95 text-white font-semibold text-xs transition-all shrink-0 cursor-pointer shadow-sm shadow-red-500/25 font-cairo"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
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
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl transition-all border flex items-center justify-center shrink-0 cursor-pointer active:scale-95 ${
                      stagedFile
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                        : 'bg-[#121824] hover:bg-[#192233] text-slate-300 hover:text-emerald-400 border-white/[0.08]'
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
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#121824] hover:bg-[#192233] text-slate-300 hover:text-emerald-400 transition-all border border-white/[0.08] flex items-center justify-center shrink-0 cursor-pointer active:scale-95"
                  >
                    <Mic className="w-5 h-5" />
                  </button>

                  {/* Enhanced Textarea with Cairo font and comfortable line-height */}
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
                    className="flex-1 min-w-0 min-h-[42px] max-h-28 py-2.5 px-3.5 bg-[#080b11] border border-white/[0.1] focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 rounded-xl text-sm sm:text-[14.5px] font-normal font-cairo leading-relaxed text-slate-100 placeholder:text-slate-500 outline-none resize-none transition-colors"
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={(!inputText.trim() && !stagedFile) || sending}
                    id="send-chat-msg-btn"
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-35 disabled:hover:bg-emerald-500 text-slate-950 font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-sm shadow-emerald-500/20"
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
            </>
          )}
        </div>
      </div>

      {/* Fullscreen Lightbox Image Viewer */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-70 bg-black/92 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in select-none"
          onClick={() => setViewingImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 text-slate-200">
              <span className="text-sm font-bold truncate max-w-xs sm:max-w-md font-cairo">
                {viewingImage.name || 'معاينة الصورة'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadAttachment(viewingImage.url, viewingImage.name || 'image.jpg')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingImage(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-black/50 shadow-2xl flex items-center justify-center">
              <img
                src={viewingImage.url}
                alt={viewingImage.name || 'معاينة'}
                className="max-w-full max-h-[75vh] object-contain rounded-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

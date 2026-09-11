import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  OrderItem,
  ServiceItem,
  UserProfile,
  Conversation,
  MessageItem,
  NotificationItem,
  PlatformSettings,
  DashboardOverviewKPI,
  OrderStatus,
} from '../../types';
import { OrderTimeline } from '../../components/OrderTimeline';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  LayoutDashboard,
  Package,
  Grid,
  Users,
  MessageSquare,
  Bell,
  Settings,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Paperclip,
  Mic,
  Square,
  Send,
  FileText,
  Download,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  X,
  Clock,
  Shield,
  Search,
  Upload,
  ArrowRight,
  ArrowDown,
  RotateCw,
  Image as ImageIcon,
  Ban,
  Reply,
  Play,
  Pause,
  Eye,
  FileArchive,
  FileSpreadsheet,
} from 'lucide-react';
import { AudioMessagePlayer } from '../../components/ui/AudioMessagePlayer';
import {
  mergeAndSortMessages,
  copyTextToClipboard,
  isNearBottom,
  formatFileSize,
  validateAttachmentFile,
  downloadAttachment,
  getFileCategory,
} from '../../lib/chatUtils';

interface AdminDashboardProps {
  onBackToHome: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToHome }) => {
  const { isAdmin, profile, currentUser } = useAuth();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'services' | 'users' | 'conversations' | 'notifications' | 'settings'
  >('overview');

  // Overview Data
  const [kpi, setKpi] = useState<DashboardOverviewKPI>({
    totalUsers: 0,
    totalServices: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    rejectedOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Orders Management Data
  const [ordersList, setOrdersList] = useState<OrderItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [rejectionModalOrder, setRejectionModalOrder] = useState<OrderItem | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [orderFilter, setOrderFilter] = useState<string>('all');

  // Services Management Data
  const [servicesList, setServicesList] = useState<ServiceItem[]>([]);
  const [serviceModalMode, setServiceModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingService, setEditingService] = useState<Partial<ServiceItem>>({});
  const [serviceImageUploading, setServiceImageUploading] = useState(false);
  const serviceImageInputRef = React.useRef<HTMLInputElement>(null);
  const [deleteConfirmService, setDeleteConfirmService] = useState<ServiceItem | null>(null);

  // Users Data
  const [usersList, setUsersList] = useState<UserProfile[]>([]);

  // Conversations Data
  const [conversationsList, setConversationsList] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [activeMessages, setActiveMessages] = useState<MessageItem[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [adminChatUploadStatus, setAdminChatUploadStatus] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const adminRecordingStartTimeRef = React.useRef<number>(0);
  const adminMessagesEndRef = React.useRef<HTMLDivElement>(null);
  const adminScrollContainerRef = React.useRef<HTMLDivElement>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<any>(null);
  const chatFileRef = React.useRef<HTMLInputElement>(null);

  // Pagination & Smart Scroll Data for Admin Chat
  const [adminHasMore, setAdminHasMore] = useState(false);
  const [adminLoadingOlder, setAdminLoadingOlder] = useState(false);
  const [adminHasNewMessagesBelow, setAdminHasNewMessagesBelow] = useState(false);
  const [adminCopiedMsgId, setAdminCopiedMsgId] = useState<string | null>(null);

  // Realtime typing, reply and edit for Admin
  const [isClientTyping, setIsClientTyping] = useState(false);
  const clientTypingTimerRef = React.useRef<any>(null);
  const adminTypingTimerRef = React.useRef<any>(null);
  const adminLastTypingSentRef = React.useRef<number>(0);
  const [activeClientPresence, setActiveClientPresence] = useState<{ isOnline: boolean; lastSeenAt?: string }>({ isOnline: false });
  const [adminReplyingTo, setAdminReplyingTo] = useState<MessageItem | null>(null);
  const [adminEditingMsg, setAdminEditingMsg] = useState<MessageItem | null>(null);
  const [adminEditText, setAdminEditText] = useState('');
  const [savingAdminEdit, setSavingAdminEdit] = useState(false);

  // Admin Attachment Staging & Voice Preview States (Parity with Customer Chat)
  const [adminStagedFile, setAdminStagedFile] = useState<{
    file: File;
    name: string;
    size: number;
    isImage: boolean;
    previewUrl?: string;
  } | null>(null);
  const [adminRecordedAudioPreview, setAdminRecordedAudioPreview] = useState<{
    blob: Blob;
    url: string;
    duration: number;
  } | null>(null);
  const [adminIsPreviewAudioPlaying, setAdminIsPreviewAudioPlaying] = useState(false);
  const adminPreviewAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const [adminIsDraggingFile, setAdminIsDraggingFile] = useState(false);
  const [adminViewingImage, setAdminViewingImage] = useState<{ url: string; name?: string } | null>(null);
  const [adminChatError, setAdminChatError] = useState<string | null>(null);

  // Helper: Scroll admin chat to bottom
  const scrollAdminToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (adminScrollContainerRef.current) {
      adminScrollContainerRef.current.scrollTo({
        top: adminScrollContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  // Helper: Copy message text with feedback
  const handleCopyAdminMessage = async (msg: MessageItem) => {
    if (!msg.text) return;
    const ok = await copyTextToClipboard(msg.text);
    if (ok) {
      setAdminCopiedMsgId(msg.id);
      setTimeout(() => setAdminCopiedMsgId(null), 2000);
    }
  };

  // Helper: Load older messages for Admin Chat (Pagination)
  const loadOlderAdminMessages = async () => {
    if (!activeConversation || adminLoadingOlder || !adminHasMore || activeMessages.length === 0) return;
    const container = adminScrollContainerRef.current;
    if (!container) return;

    const oldestMsg = activeMessages[0];
    const prevScrollHeight = container.scrollHeight;
    const prevScrollTop = container.scrollTop;

    setAdminLoadingOlder(true);
    try {
      const res = await api.getMessagesWithMeta(activeConversation.id, {
        limit: 25,
        before: oldestMsg.createdAt,
      });

      if (res.messages.length > 0) {
        setActiveMessages((prev) => mergeAndSortMessages(res.messages, prev));
        setAdminHasMore(res.hasMore);

        requestAnimationFrame(() => {
          if (adminScrollContainerRef.current) {
            const newScrollHeight = adminScrollContainerRef.current.scrollHeight;
            adminScrollContainerRef.current.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
          }
        });
      } else {
        setAdminHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load older admin messages:', err);
    } finally {
      setAdminLoadingOlder(false);
    }
  };

  // Helper: Handle Admin chat scroll for top pagination and bottom detection
  const handleAdminScroll = () => {
    const container = adminScrollContainerRef.current;
    if (!container) return;

    if (container.scrollTop <= 40 && adminHasMore && !adminLoadingOlder) {
      loadOlderAdminMessages();
    }

    if (isNearBottom(container, 100)) {
      setAdminHasNewMessagesBelow(false);
    }
  };

  // Format seconds to mm:ss
  const formatAudioDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Notifications Data
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);

  // Settings Data
  const [settings, setSettings] = useState<PlatformSettings>({
    walletName: 'المحفظة الإلكترونية',
    walletNumber: '01098765432',
    adminEmail: 'ibraimbdo11@gmail.com',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  // Load Overview Data
  const loadOverview = async () => {
    try {
      setLoadingOverview(true);
      const res = await api.getAdminOverview();
      setKpi(res.kpi);
      setRecentOrders(res.recentOrders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOverview(false);
    }
  };

  // Load Orders
  const loadOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrdersList(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Load Services
  const loadServices = async () => {
    try {
      const data = await api.getServices();
      setServicesList(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Load Users
  const loadUsers = async () => {
    try {
      const data = await api.getAdminUsers();
      setUsersList(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Load Conversations
  const loadConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversationsList(data);
      if (data.length > 0 && !activeConversation) {
        setActiveConversation(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load Notifications
  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotificationsList(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Load Settings
  const loadSettings = async () => {
    try {
      const data = await api.getConfig();
      setSettings(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Switch tabs & fetch data
  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === 'overview') loadOverview();
    if (activeTab === 'orders') loadOrders();
    if (activeTab === 'services') loadServices();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'conversations') loadConversations();
    if (activeTab === 'notifications') loadNotifications();
    if (activeTab === 'settings') loadSettings();
  }, [activeTab, isAdmin]);

  // Load messages and subscribe to Realtime SSE & presence heartbeat
  useEffect(() => {
    if (!isAdmin || !currentUser) return;
    let isMounted = true;

    // Send admin presence heartbeat
    api.sendPresenceHeartbeat(currentUser.uid, 'admin').catch(() => {});
    const heartbeat = setInterval(() => {
      api.sendPresenceHeartbeat(currentUser.uid, 'admin').catch(() => {});
    }, 20000);

    const unsub = api.subscribeChat({
      userId: currentUser.uid,
      role: 'admin',
      conversationId: activeConversation?.id,
      onMessage: (msg, convId) => {
        if (!isMounted) return;
        const targetConvId = convId || msg.conversationId;
        if (activeConversation && targetConvId === activeConversation.id) {
          const container = adminScrollContainerRef.current;
          const userAtBottom = container ? isNearBottom(container, 100) : true;
          const isFromSelf = msg.senderRole === 'admin';

          setActiveMessages((prev) => mergeAndSortMessages(prev, [msg]));
          api.markConversationRead(activeConversation.id).catch(() => {});

          if (isFromSelf || userAtBottom) {
            requestAnimationFrame(() => {
              scrollAdminToBottom('smooth');
            });
          } else {
            setAdminHasNewMessagesBelow(true);
          }
        }
        loadConversations();
      },
      onMessageUpdated: (updatedMsg, convId) => {
        if (!isMounted) return;
        const targetConvId = convId || updatedMsg.conversationId;
        if (activeConversation && targetConvId === activeConversation.id) {
          setActiveMessages((prev) => prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)));
        }
        loadConversations();
      },
      onMessageDeleted: (delData) => {
        if (!isMounted) return;
        if (activeConversation && delData.conversationId === activeConversation.id) {
          setActiveMessages((prev) =>
            prev.map((m) =>
              m.id === delData.messageId
                ? (delData.message || { ...m, isDeleted: true, text: 'تم حذف هذه الرسالة' })
                : m
            )
          );
        }
        loadConversations();
      },
      onMessagesRead: (readData) => {
        if (!isMounted) return;
        if (activeConversation && readData.conversationId === activeConversation.id) {
          setActiveMessages((prev) =>
            prev.map((m) => (m.senderRole === 'admin' && !m.readAt ? { ...m, readAt: readData.readAt } : m))
          );
        }
      },
      onTyping: (data) => {
        if (!isMounted) return;
        if (activeConversation && data.conversationId === activeConversation.id && data.userId !== currentUser.uid) {
          setIsClientTyping(data.isTyping);
          if (clientTypingTimerRef.current) clearTimeout(clientTypingTimerRef.current);
          if (data.isTyping) {
            clientTypingTimerRef.current = setTimeout(() => {
              if (isMounted) setIsClientTyping(false);
            }, 3500);
          }
        }
      },
      onPresence: (pres) => {
        if (!isMounted) return;
        if (activeConversation && pres.userId === activeConversation.userId) {
          setActiveClientPresence({ isOnline: pres.isOnline, lastSeenAt: pres.lastSeenAt });
        }
      },
      onNotification: () => {
        if (!isMounted) return;
        loadNotifications();
        loadOrders();
      },
    });

    if (activeConversation) {
      // Fetch initial active client presence status
      api.getUserPresence(activeConversation.userId).then((pres) => {
        if (isMounted) {
          setActiveClientPresence({ isOnline: pres.isOnline, lastSeenAt: pres.lastSeenAt });
        }
      }).catch(() => {});

      api.getMessagesWithMeta(activeConversation.id, { limit: 25 }).then((res) => {
        if (isMounted) {
          setActiveMessages(res.messages);
          setAdminHasMore(res.hasMore);
          setAdminHasNewMessagesBelow(false);
          api.markConversationRead(activeConversation.id).catch(() => {});
          requestAnimationFrame(() => {
            scrollAdminToBottom('auto');
          });
        }
      }).catch(console.error);
    } else {
      setActiveClientPresence({ isOnline: false });
    }

    return () => {
      isMounted = false;
      clearInterval(heartbeat);
      unsub();
      if (clientTypingTimerRef.current) clearTimeout(clientTypingTimerRef.current);
      if (adminTypingTimerRef.current) clearTimeout(adminTypingTimerRef.current);
    };
  }, [activeConversation, isAdmin, currentUser]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center text-right space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-100">غير مصرح بالدخول</h2>
        <p className="text-xs text-slate-400">
          لوحة التحكم الإدارية مخصصة للمدير العام فقط، تم تقييد الوصول وفقاً لقواعد الحماية والأمان.
        </p>
        <button
          onClick={onBackToHome}
          className="px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  // Handle Order Status updates
  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    reason?: string
  ) => {
    try {
      const updated = await api.updateOrderStatus(orderId, newStatus, reason);
      setOrdersList((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updated);
      }
      setRejectionModalOrder(null);
      setRejectionReasonText('');
      loadOverview();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ في تحديث الحالة');
    }
  };

  // Handle Service Image Upload
  const handleServiceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setServiceImageUploading(true);
      const res = await api.uploadFile(file, file.name);
      setEditingService((prev) => ({ ...prev, image: res.url }));
    } catch (err: any) {
      alert(err.message || 'فشل رفع صورة الخدمة');
    } finally {
      setServiceImageUploading(false);
      if (serviceImageInputRef.current) serviceImageInputRef.current.value = '';
    }
  };

  // Handle Service Save (Add or Edit)
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService.title || !editingService.shortDescription || !editingService.basePrice) {
      alert('يرجى ملء الحقول المطلوبة');
      return;
    }

    const payload = {
      ...editingService,
      description: editingService.shortDescription,
      image:
        editingService.image ||
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    };

    try {
      if (serviceModalMode === 'add') {
        const created = await api.createService(payload);
        setServicesList((prev) => [created, ...prev]);
      } else if (serviceModalMode === 'edit' && editingService.id) {
        const updated = await api.updateService(editingService.id, payload);
        setServicesList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      }
      setServiceModalMode(null);
      setEditingService({});
      loadOverview();
    } catch (err: any) {
      alert(err.message || 'فشل حفظ الخدمة');
    }
  };

  // Handle Delete Service
  const handleDeleteService = async () => {
    if (!deleteConfirmService) return;
    try {
      await api.deleteService(deleteConfirmService.id);
      setServicesList((prev) => prev.filter((s) => s.id !== deleteConfirmService.id));
      setDeleteConfirmService(null);
      loadOverview();
    } catch (err: any) {
      alert(err.message || 'فشل حذف الخدمة');
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSavedMsg(false);
    try {
      await api.updateSettings(settings);
      setSettingsSavedMsg(true);
      setTimeout(() => setSettingsSavedMsg(false), 3000);
    } catch (err: any) {
      alert(err.message || 'فشل حفظ الإعدادات');
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle Admin typing in chat
  const handleAdminChatInputChange = (val: string) => {
    setChatInput(val);
    if (activeConversation && currentUser) {
      const now = Date.now();
      if (now - adminLastTypingSentRef.current > 2500) {
        adminLastTypingSentRef.current = now;
        api.sendTyping(activeConversation.id, true, {
          userId: currentUser.uid,
          userName: 'إدارة HEMA SERVICES',
          role: 'admin',
        }).catch(() => {});
      }

      if (adminTypingTimerRef.current) clearTimeout(adminTypingTimerRef.current);
      adminTypingTimerRef.current = setTimeout(() => {
        if (activeConversation && currentUser) {
          adminLastTypingSentRef.current = 0;
          api.sendTyping(activeConversation.id, false, {
            userId: currentUser.uid,
            userName: 'إدارة HEMA SERVICES',
            role: 'admin',
          }).catch(() => {});
        }
      }, 2500);
    }
  };

  // Stage Admin File or Image for Preview before sending with validation
  const stageAdminFile = (file: File) => {
    const validation = validateAttachmentFile(file);
    if (!validation.valid) {
      setAdminChatError(validation.error || 'الملف المختار غير صالح');
      return;
    }

    if (adminStagedFile?.previewUrl) {
      URL.revokeObjectURL(adminStagedFile.previewUrl);
    }

    const previewUrl = validation.isImage ? URL.createObjectURL(file) : undefined;
    setAdminStagedFile({
      file,
      name: file.name,
      size: file.size,
      isImage: validation.isImage,
      previewUrl,
    });
    setAdminChatError(null);
  };

  const handleAdminFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stageAdminFile(file);
    if (chatFileRef.current) chatFileRef.current.value = '';
  };

  const handleRemoveAdminStagedFile = () => {
    if (adminStagedFile?.previewUrl) {
      URL.revokeObjectURL(adminStagedFile.previewUrl);
    }
    setAdminStagedFile(null);
    if (chatFileRef.current) chatFileRef.current.value = '';
  };

  // Admin Desktop Drag & Drop handlers
  const handleAdminDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!adminIsDraggingFile) setAdminIsDraggingFile(true);
  };

  const handleAdminDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setAdminIsDraggingFile(false);
  };

  const handleAdminDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdminIsDraggingFile(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      stageAdminFile(file);
    }
  };

  // Send Admin Chat Message (Unified Text, Staged Attachment with Caption, or Quoted Reply)
  const handleSendAdminMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!chatInput.trim() && !adminStagedFile) || !activeConversation || !currentUser || sendingMsg) return;

    const textToSend = chatInput.trim();
    const fileToUpload = adminStagedFile;
    const replyRef = adminReplyingTo
      ? {
          id: adminReplyingTo.id,
          senderName: adminReplyingTo.senderName,
          type: adminReplyingTo.type,
          text: adminReplyingTo.text,
          fileName: adminReplyingTo.fileName,
          isImage: adminReplyingTo.isImage,
        }
      : undefined;

    setChatInput('');
    setAdminReplyingTo(null);
    setSendingMsg(true);

    if (adminTypingTimerRef.current) clearTimeout(adminTypingTimerRef.current);
    adminLastTypingSentRef.current = 0;
    api.sendTyping(activeConversation.id, false, {
      userId: currentUser.uid,
      userName: 'إدارة HEMA SERVICES',
      role: 'admin',
    }).catch(() => {});

    try {
      let uploadedUrl: string | undefined;
      let uploadedName: string | undefined;
      let uploadedSize: number | undefined;
      let isImg = false;

      if (fileToUpload) {
        setAdminChatUploadStatus(fileToUpload.isImage ? 'جاري رفع الصورة...' : 'جاري رفع الملف المرفق...');
        const uploadRes = await api.uploadFile(fileToUpload.file, fileToUpload.name);
        uploadedUrl = uploadRes.url;
        uploadedName = fileToUpload.name;
        uploadedSize = fileToUpload.size;
        isImg = fileToUpload.isImage;
      }

      const msg = await api.sendMessage(activeConversation.id, {
        senderId: currentUser.uid,
        senderName: 'إدارة HEMA SERVICES',
        senderRole: 'admin',
        type: fileToUpload ? (isImg ? 'image' : 'file') : 'text',
        text: textToSend || undefined,
        fileUrl: uploadedUrl,
        fileName: uploadedName,
        fileSize: uploadedSize,
        isImage: isImg,
        replyTo: replyRef,
        orderId: adminReplyingTo?.orderId || activeConversation.orderId,
        orderNumber: adminReplyingTo?.orderNumber || activeConversation.orderNumber,
      });

      setActiveMessages((prev) => mergeAndSortMessages(prev, [msg]));
      if (fileToUpload) {
        handleRemoveAdminStagedFile();
      }
      loadConversations();
      requestAnimationFrame(() => {
        scrollAdminToBottom('smooth');
      });
    } catch (err: any) {
      console.error(err);
      setAdminChatError(err.message || 'فشل في إرسال الرسالة');
    } finally {
      setSendingMsg(false);
      setAdminChatUploadStatus(null);
    }
  };

  // Save Admin Message Edit
  const handleSaveAdminEdit = async () => {
    if (!activeConversation || !adminEditingMsg || !adminEditText.trim() || savingAdminEdit) return;
    try {
      setSavingAdminEdit(true);
      const updated = await api.editMessage(activeConversation.id, adminEditingMsg.id, adminEditText.trim());
      setActiveMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setAdminEditingMsg(null);
      setAdminEditText('');
    } catch (err: any) {
      setAdminChatError(err.message || 'فشل في تعديل الرسالة');
    } finally {
      setSavingAdminEdit(false);
    }
  };

  // Admin Delete Message
  const handleDeleteAdminMessage = async (msgId: string) => {
    if (!activeConversation) return;
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه الرسالة؟')) return;
    try {
      await api.deleteMessage(activeConversation.id, msgId);
      setActiveMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
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
      loadConversations();
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  // Admin Voice recording with preview before sending
  const startAdminRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      const startTime = Date.now();
      adminRecordingStartTimeRef.current = startTime;

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());

        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - (adminRecordingStartTimeRef.current || startTime)) / 1000)
        );

        if (audioBlob.size > 100) {
          const previewUrl = URL.createObjectURL(audioBlob);
          setAdminRecordedAudioPreview({
            blob: audioBlob,
            url: previewUrl,
            duration: durationSeconds,
          });
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordSeconds(elapsed);
      }, 250);
    } catch (err) {
      console.error(err);
      setAdminChatError('يرجى السماح بالوصول إلى الميكروفون لتسجيل رسالة صوتية');
    }
  };

  const stopAdminRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleDiscardAdminAudioPreview = () => {
    if (adminRecordedAudioPreview?.url) {
      URL.revokeObjectURL(adminRecordedAudioPreview.url);
    }
    setAdminRecordedAudioPreview(null);
    setAdminIsPreviewAudioPlaying(false);
  };

  const handleSendAdminAudioPreview = async () => {
    if (!adminRecordedAudioPreview || !activeConversation || !currentUser || sendingMsg) return;

    const replyRef = adminReplyingTo
      ? {
          id: adminReplyingTo.id,
          senderName: adminReplyingTo.senderName,
          type: adminReplyingTo.type,
          text: adminReplyingTo.text,
          fileName: adminReplyingTo.fileName,
          isImage: adminReplyingTo.isImage,
        }
      : undefined;

    setAdminReplyingTo(null);
    setSendingMsg(true);
    setAdminChatUploadStatus('جاري إرسال التسجيل الصوتي...');

    try {
      const res = await api.uploadFile(
        adminRecordedAudioPreview.blob,
        `admin-voice-${Date.now()}.webm`
      );
      const msg = await api.sendMessage(activeConversation.id, {
        senderId: currentUser.uid,
        senderName: 'إدارة HEMA SERVICES',
        senderRole: 'admin',
        type: 'audio',
        audioUrl: res.url,
        audioDuration: adminRecordedAudioPreview.duration,
        replyTo: replyRef,
        orderId: adminReplyingTo?.orderId || activeConversation.orderId,
        orderNumber: adminReplyingTo?.orderNumber || activeConversation.orderNumber,
      });

      setActiveMessages((prev) => mergeAndSortMessages(prev, [msg]));
      handleDiscardAdminAudioPreview();
      loadConversations();
      requestAnimationFrame(() => {
        scrollAdminToBottom('smooth');
      });
    } catch (err: any) {
      console.error(err);
      setAdminChatError(err.message || 'فشل في إرسال التسجيل الصوتي');
    } finally {
      setSendingMsg(false);
      setAdminChatUploadStatus(null);
    }
  };

  const navItems = [
    { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
    { id: 'orders', label: 'الطلبات', icon: Package },
    { id: 'services', label: 'الخدمات', icon: Grid },
    { id: 'users', label: 'المستخدمون', icon: Users },
    { id: 'conversations', label: 'المحادثات', icon: MessageSquare },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'settings', label: 'إعدادات المنصة', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#06080e] text-right flex flex-col md:flex-row">
      {/* 35. ADMIN SIDEBAR (Desktop persistent, responsive mobile) */}
      <aside
        id="admin-sidebar"
        className="w-full md:w-64 bg-[#0a0e19] border-b md:border-b-0 md:border-l border-slate-800 shrink-0 flex flex-col justify-between"
      >
        <div>
          {/* Admin header identity */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-100">لوحة الإدارة</h2>
                <span className="text-[10px] text-amber-400 font-medium">HEMA SERVICES</span>
              </div>
            </div>
            <button
              onClick={onBackToHome}
              className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-800"
            >
              الرئيسية
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`admin-nav-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setSelectedOrder(null);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin profile footer in sidebar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="truncate text-slate-300 font-semibold">{currentUser?.email}</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">صلاحية المدير العام الكاملة</span>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* ==================================================== */}
        {/* 36. ADMIN OVERVIEW TAB */}
        {/* ==================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-100">نظرة عامة</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                ملخص لأهم بيانات المنصة والطلبات.
              </p>
            </div>

            {/* KPI Cards: 6 required metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-[#0d121c] border border-white/[0.07] space-y-1.5">
                <span className="text-xs text-slate-400 block font-medium">إجمالي المستخدمين</span>
                <span className="text-2xl font-bold text-slate-100 font-mono tracking-tight">
                  {kpi.totalUsers}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0d121c] border border-white/[0.07] space-y-1.5">
                <span className="text-xs text-slate-400 block font-medium">إجمالي الخدمات</span>
                <span className="text-2xl font-bold text-slate-100 font-mono tracking-tight">
                  {kpi.totalServices}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0d121c] border border-white/[0.07] space-y-1.5">
                <span className="text-xs text-slate-400 block font-medium">إجمالي الطلبات</span>
                <span className="text-2xl font-bold text-slate-100 font-mono tracking-tight">
                  {kpi.totalOrders}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0d121c] border border-amber-500/20 space-y-1.5">
                <span className="text-xs text-amber-400/90 block font-medium">طلبات قيد المراجعة</span>
                <span className="text-2xl font-bold text-amber-400 font-mono tracking-tight">
                  {kpi.pendingOrders}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0d121c] border border-emerald-500/20 space-y-1.5">
                <span className="text-xs text-emerald-400/90 block font-medium">طلبات مكتملة</span>
                <span className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">
                  {kpi.completedOrders}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0d121c] border border-red-500/20 space-y-1.5">
                <span className="text-xs text-red-400/90 block font-medium">طلبات مرفوضة</span>
                <span className="text-2xl font-bold text-red-400 font-mono tracking-tight">
                  {kpi.rejectedOrders}
                </span>
              </div>
            </div>

            {/* 37. ADMIN RECENT ORDERS TABLE */}
            <div className="p-6 rounded-2xl bg-[#0d121c] border border-white/[0.07] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-100">أحدث الطلبات</h2>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                >
                  عرض كافة الطلبات ({kpi.totalOrders})
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#121824] border-b border-white/[0.06] text-slate-400">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">رقم الطلب</th>
                      <th className="py-3.5 px-4 font-semibold">العميل</th>
                      <th className="py-3.5 px-4 font-semibold">الخدمة</th>
                      <th className="py-3.5 px-4 font-semibold">السعر</th>
                      <th className="py-3.5 px-4 font-semibold">التاريخ</th>
                      <th className="py-3.5 px-4 font-semibold">الحالة</th>
                      <th className="py-3.5 px-4 font-semibold text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-slate-300">
                    {recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          لا توجد طلبات مسجلة حتى الآن.
                        </td>
                      </tr>
                    ) : (
                      recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-[#121824]/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">
                            {order.orderNumber}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-200">{order.userName}</td>
                          <td className="py-3.5 px-4 max-w-[200px] truncate text-slate-300">{order.serviceNameSnapshot}</td>
                          <td className="py-3.5 px-4 font-mono text-emerald-400 font-semibold">
                            {order.price.toLocaleString()} ج.م
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={order.status} size="sm" />
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setActiveTab('orders');
                              }}
                              className="h-8 px-3.5 rounded-lg bg-[#121824] hover:bg-emerald-500 hover:text-slate-950 text-slate-200 text-xs font-semibold transition-all border border-white/[0.08]"
                            >
                              عرض الطلب
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 38. ADMIN ORDERS MANAGEMENT TAB */}
        {/* ==================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-100">إدارة الطلبات</h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  مراجعة إثباتات الدفع واعتماد وتحديث مسار تنفيذ الطلبات.
                </p>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                {['all', 'pending_review', 'accepted', 'in_progress', 'completed', 'rejected'].map(
                  (f) => (
                    <button
                      key={f}
                      onClick={() => setOrderFilter(f)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        orderFilter === f
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {f === 'all' && 'الكل'}
                      {f === 'pending_review' && 'قيد المراجعة'}
                      {f === 'accepted' && 'مقبول'}
                      {f === 'in_progress' && 'جاري التنفيذ'}
                      {f === 'completed' && 'مكتمل'}
                      {f === 'rejected' && 'مرفوض'}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Selected Order Detail Modal or In-page view */}
            {selectedOrder && (
              <div className="p-6 rounded-2xl bg-[#0d121f] border border-emerald-500/30 space-y-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {selectedOrder.orderNumber}
                    </span>
                    <h2 className="text-base font-bold text-slate-100 mt-0.5">
                      {selectedOrder.serviceNameSnapshot}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Status Timeline */}
                <OrderTimeline
                  status={selectedOrder.status}
                  rejectionReason={selectedOrder.rejectionReason}
                />

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Customer Info */}
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                    <h4 className="font-bold text-slate-200">بيانات العميل</h4>
                    <p className="text-slate-300">الاسم: {selectedOrder.userName}</p>
                    <p className="text-slate-400">البريد: {selectedOrder.userEmail}</p>
                    <p className="text-slate-400">
                      تاريخ الطلب: {new Date(selectedOrder.createdAt).toLocaleString('ar-EG')}
                    </p>
                  </div>

                  {/* Payment Info */}
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                    <h4 className="font-bold text-slate-200">طريقة الدفع وإثبات التحويل</h4>
                    <p className="text-slate-300">الطريقة: {selectedOrder.paymentMethod}</p>
                    {selectedOrder.senderWalletNumber && (
                      <p className="text-slate-200">
                        المحفظة المُحول منها: <span className="text-emerald-400 font-mono font-bold">{selectedOrder.senderWalletNumber}</span>
                      </p>
                    )}
                    <p className="text-emerald-400 font-bold text-sm">
                      المبلغ: {selectedOrder.price.toLocaleString()} ج.م
                    </p>
                    <div className="flex items-center gap-3 pt-2">
                      <img
                        src={selectedOrder.paymentProof}
                        alt="إثبات التحويل"
                        className="w-16 h-16 rounded-lg object-cover border border-slate-700 bg-slate-950 cursor-pointer"
                        onClick={() => window.open(selectedOrder.paymentProof, '_blank')}
                      />
                      <div>
                        <span className="text-[11px] text-slate-300 block">صورة الإيصال المرفق</span>
                        <a
                          href={selectedOrder.paymentProof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-emerald-400 underline inline-flex items-center gap-1 mt-0.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>فتح الصورة بحجم كامل</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer requirements */}
                <div className="space-y-1.5 text-xs">
                  <h4 className="font-bold text-slate-200">وصف ومتطلبات العميل:</h4>
                  <p className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 leading-relaxed whitespace-pre-line">
                    {selectedOrder.customerRequirements}
                  </p>
                </div>

                {/* Status Progression Actions */}
                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedOrder.status === 'pending_review' && (
                      <>
                        <button
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'accepted')}
                          id="accept-order-btn"
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>قبول الطلب</span>
                        </button>

                        <button
                          onClick={() => setRejectionModalOrder(selectedOrder)}
                          id="reject-order-btn"
                          className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>رفض الطلب</span>
                        </button>
                      </>
                    )}

                    {selectedOrder.status === 'accepted' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'in_progress')}
                        id="start-progress-order-btn"
                        className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>تحويل إلى جاري التنفيذ</span>
                      </button>
                    )}

                    {selectedOrder.status === 'in_progress' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'completed')}
                        id="complete-order-btn"
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تعيين الطلب كمكتمل</span>
                      </button>
                    )}
                  </div>

                  {/* Open customer chat for this order */}
                  <button
                    onClick={async () => {
                      let conv = conversationsList.find((c) => c.userId === selectedOrder.userId);
                      if (!conv) {
                        try {
                          conv = await api.findOrCreateConversation({
                            userId: selectedOrder.userId,
                            orderId: selectedOrder.id,
                          });
                          await loadConversations();
                        } catch (e) {
                          console.error('Error finding/creating conversation', e);
                        }
                      }
                      if (conv) setActiveConversation(conv);
                      setActiveTab('conversations');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>فتح محادثة العميل</span>
                  </button>
                </div>
              </div>
            )}

            {/* Orders Table */}
            <div className="p-6 rounded-2xl bg-[#0d121c] border border-white/[0.07] overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#121824] border-b border-white/[0.06] text-slate-400">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">رقم الطلب</th>
                    <th className="py-3.5 px-4 font-semibold">العميل</th>
                    <th className="py-3.5 px-4 font-semibold">الخدمة</th>
                    <th className="py-3.5 px-4 font-semibold">السعر</th>
                    <th className="py-3.5 px-4 font-semibold">التاريخ</th>
                    <th className="py-3.5 px-4 font-semibold">الحالة</th>
                    <th className="py-3.5 px-4 font-semibold text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-slate-300">
                  {ordersList
                    .filter((o) => (orderFilter === 'all' ? true : o.status === orderFilter))
                    .map((order) => (
                      <tr key={order.id} className="hover:bg-[#121824]/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">
                          {order.orderNumber}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-200">{order.userName}</td>
                        <td className="py-3.5 px-4 max-w-[200px] truncate text-slate-300">{order.serviceNameSnapshot}</td>
                        <td className="py-3.5 px-4 font-mono text-emerald-400 font-semibold">
                          {order.price.toLocaleString()} ج.م
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={order.status} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="h-8 px-3.5 rounded-lg bg-[#121824] hover:bg-emerald-500 hover:text-slate-950 text-slate-200 text-xs font-semibold transition-all border border-white/[0.08]"
                          >
                            عرض الطلب
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 39. ADMIN SERVICES MANAGEMENT TAB */}
        {/* ==================================================== */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-100">الخدمات</h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  إضافة وتعديل وحذف الخدمات البرمجية والتحكم في الأسعار والخصومات.
                </p>
              </div>

              {/* 40. Top Action: إضافة خدمة */}
              <button
                onClick={() => {
                  setEditingService({
                    title: '',
                    shortDescription: '',
                    description: '',
                    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
                    basePrice: 5000,
                    discountedPrice: 4000,
                    isDiscounted: false,
                    deliverables: ['تسليم ملفات المشروع كاملة', 'دعم فني وصيانة'],
                    additionalInfo: '',
                  });
                  setServiceModalMode('add');
                }}
                id="admin-add-service-btn"
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة خدمة</span>
              </button>
            </div>

            {/* Services Grid/List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {servicesList.map((srv) => (
                <div
                  key={srv.id}
                  className="bg-[#0d121f] border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <img
                      src={srv.image}
                      alt={srv.title}
                      className="w-full h-40 object-cover bg-slate-900"
                      referrerPolicy="no-referrer"
                    />
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-slate-100 truncate">{srv.title}</h3>
                        {srv.isDiscounted && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold shrink-0">
                            خصم مفعل
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{srv.shortDescription}</p>
                      <div className="pt-2 flex items-baseline gap-2 text-xs">
                        <span className="font-bold text-emerald-400 text-sm">
                          {(srv.isDiscounted ? srv.discountedPrice : srv.basePrice).toLocaleString()} ج.م
                        </span>
                        {srv.isDiscounted && (
                          <span className="text-slate-500 line-through">
                            {srv.basePrice.toLocaleString()} ج.م
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: تعديل / حذف */}
                  <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setEditingService(srv);
                        setServiceModalMode('edit');
                      }}
                      id={`edit-service-btn-${srv.id}`}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirmService(srv)}
                      id={`delete-service-btn-${srv.id}`}
                      className="py-1.5 px-3 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 42. ADMIN USERS TAB */}
        {/* ==================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-100">المستخدمون</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                سجل العملاء والمستخدمين وتفاصيل التسجيل والطلبات.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0d121f] border border-slate-800 overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="py-3 px-4 font-semibold">اسم المستخدم</th>
                    <th className="py-3 px-4 font-semibold">البريد الإلكتروني</th>
                    <th className="py-3 px-4 font-semibold">تاريخ أول تسجيل</th>
                    <th className="py-3 px-4 font-semibold">وقت أول تسجيل</th>
                    <th className="py-3 px-4 font-semibold">تاريخ آخر تسجيل</th>
                    <th className="py-3 px-4 font-semibold">وقت آخر تسجيل</th>
                    <th className="py-3 px-4 font-semibold text-center">عدد الطلبات</th>
                    <th className="py-3 px-4 font-semibold text-center">التواصل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        لا يوجد مستخدمون مسجلون بعد.
                      </td>
                    </tr>
                  ) : (
                    usersList.map((user) => {
                      const createdDate = new Date(user.createdAt);
                      const lastLoginDate = new Date(user.lastLoginAt);

                      return (
                        <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-200">
                            {user.name}
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {user.email}
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {createdDate.toLocaleDateString('ar-EG')}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono">
                            {createdDate.toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {lastLoginDate.toLocaleDateString('ar-EG')}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono">
                            {lastLoginDate.toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-emerald-400 font-mono">
                            {user.orderCount || 0}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={async () => {
                                const conv = await api.findOrCreateConversation({
                                  userId: user.id,
                                  userName: user.name,
                                  userEmail: user.email,
                                });
                                setActiveConversation(conv);
                                setActiveTab('conversations');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
                            >
                              تواصل
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 43. ADMIN CONVERSATIONS TAB */}
        {/* ==================================================== */}
        {activeTab === 'conversations' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-100">المحادثات</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                مركز المراسلة الفورية مع العملاء ومتابعة الاستفسارات.
              </p>
            </div>

            <div className="flex flex-col md:flex-row h-[660px] max-h-[85vh] bg-[#0d121f] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              {/* Left/Side List: Conversation list */}
              <div
                className={`w-full md:w-80 lg:w-96 flex flex-col shrink-0 border-b md:border-b-0 md:border-l border-slate-800 bg-[#0a0e19] min-h-0 ${
                  activeConversation ? 'hidden md:flex h-full' : 'flex h-full'
                }`}
              >
                <div className="p-3.5 border-b border-slate-800 text-xs font-bold text-slate-300 flex items-center justify-between shrink-0">
                  <span>المحادثات المفتوحة ({conversationsList.length})</span>
                  <button
                    type="button"
                    onClick={loadConversations}
                    title="تحديث المحادثات"
                    className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-800/60">
                  {conversationsList.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      لا توجد محادثات حتى الآن.
                    </div>
                  ) : (
                    conversationsList.map((conv) => {
                      const isSelected = activeConversation?.id === conv.id;
                      return (
                        <div
                          key={conv.id}
                          onClick={() => setActiveConversation(conv)}
                          className={`p-3.5 cursor-pointer transition-colors ${
                            isSelected ? 'bg-emerald-950/30 border-r-2 border-emerald-400' : 'hover:bg-slate-900/40'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-xs font-bold text-slate-200 truncate">{conv.userName}</h4>
                            <span className="text-[10px] text-slate-500">
                              {conv.lastMessageAt &&
                                new Date(conv.lastMessageAt).toLocaleTimeString('ar-EG', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate leading-relaxed">
                            {conv.lastMessage || 'محادثة جديدة'}
                          </p>
                          {conv.orderNumber && (
                            <span className="text-[9px] text-emerald-400 font-mono block mt-1">
                              طلب: {conv.orderNumber}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Area: Active conversation view with drag & drop */}
              <div
                onDragOver={handleAdminDragOver}
                onDragLeave={handleAdminDragLeave}
                onDrop={handleAdminDrop}
                className={`relative flex-1 flex flex-col h-full min-h-0 min-w-0 bg-[#080b11] ${
                  !activeConversation ? 'hidden md:flex' : 'flex'
                }`}
              >
                {/* Desktop Drag & Drop Visual Overlay */}
                {adminIsDraggingFile && (
                  <div className="absolute inset-0 z-50 bg-[#080b11]/92 border-2 border-dashed border-emerald-500 flex flex-col items-center justify-center gap-3 backdrop-blur-sm pointer-events-none animate-in fade-in">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <Upload className="w-8 h-8 animate-bounce" />
                    </div>
                    <p className="text-sm font-bold text-slate-100 font-cairo">أفلت الملف هنا للمعاينة قبل الإرسال</p>
                    <p className="text-xs text-slate-400 font-cairo">يدعم الصور والمستندات بحد أقصى 15 ميجابايت</p>
                  </div>
                )}
                {activeConversation ? (
                  <>
                    {/* Header with customer identity & mobile back button */}
                    <div className="p-3 sm:p-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => setActiveConversation(null)}
                          className="md:hidden p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white shrink-0"
                          title="العودة للمحادثات"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                              {activeConversation.userName}
                            </h3>
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
                                activeClientPresence.isOnline
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
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
                          <p className="text-[10px] text-slate-400 truncate">{activeConversation.userEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {activeConversation.orderNumber && (
                          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                            {activeConversation.orderNumber}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setAdminHasNewMessagesBelow(false);
                            scrollAdminToBottom('smooth');
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors text-xs flex items-center gap-1 border border-slate-700"
                          title="النزول لأسفل الرسائل"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                          <span className="text-[10px] hidden sm:inline">للأسفل</span>
                        </button>
                      </div>
                    </div>

                    {/* Message history with min-h-0 and auto-scroll */}
                    <div
                      id="admin-messages-scroll-area"
                      ref={adminScrollContainerRef}
                      onScroll={handleAdminScroll}
                      className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto space-y-3 relative"
                    >
                      {/* Loading older messages indicator */}
                      {adminLoadingOlder && (
                        <div className="flex justify-center items-center py-2 text-xs text-slate-400 gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                          <span>جاري تحميل الرسائل السابقة...</span>
                        </div>
                      )}
                      {!adminHasMore && activeMessages.length > 15 && (
                        <div className="text-center py-2 text-[10px] text-slate-500 font-medium">
                          — بداية المحادثة —
                        </div>
                      )}

                      {activeMessages.map((msg) => {
                        const isFromAdmin = msg.senderRole === 'admin';
                        const isDeleted = msg.isDeleted || msg.text === 'تم حذف هذه الرسالة';

                        return (
                          <div
                            key={msg.id}
                            className={`group flex flex-col ${isFromAdmin ? 'items-end' : 'items-start'}`}
                          >
                            <span className="text-[10px] text-slate-400 mb-1 px-1">
                              {isFromAdmin ? 'الإدارة' : activeConversation.userName}
                            </span>

                            <div className="flex items-center gap-1.5 max-w-[85%]">
                              {/* Message actions (reply, copy, edit, delete) */}
                              {!isDeleted && (
                                <div
                                  className={`flex items-center gap-0.5 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0 ${
                                    isFromAdmin ? 'order-first' : 'order-last'
                                  }`}
                                >
                                  {msg.type === 'text' && msg.text && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopyAdminMessage(msg)}
                                      title="نسخ النص"
                                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-emerald-400 transition-colors"
                                    >
                                      {adminCopiedMsgId === msg.id ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setAdminReplyingTo(msg)}
                                    title="رد على الرسالة"
                                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-emerald-400 transition-colors"
                                  >
                                    <Reply className="w-3.5 h-3.5" />
                                  </button>
                                  {isFromAdmin && msg.type === 'text' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAdminEditingMsg(msg);
                                        setAdminEditText(msg.text || '');
                                      }}
                                      title="تعديل الرسالة"
                                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-emerald-400 transition-colors"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {isFromAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAdminMessage(msg.id)}
                                      title="حذف الرسالة"
                                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              )}

                              {isDeleted ? (
                                <div className="flex items-center gap-2 py-2 px-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 italic text-xs shadow-sm">
                                  <Ban className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span>تم حذف هذه الرسالة</span>
                                </div>
                              ) : (
                                <div
                                  className={`rounded-2xl p-3 text-xs flex-1 ${
                                    isFromAdmin
                                      ? 'bg-emerald-600 text-slate-950 font-medium rounded-tl-sm'
                                      : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tr-sm'
                                  }`}
                                >
                                  {/* Order context tag if message was sent regarding an order */}
                                  {msg.orderNumber && (
                                    <div
                                      className={`inline-flex items-center gap-1 mb-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                                        isFromAdmin
                                          ? 'bg-slate-950/20 text-slate-900 border border-slate-950/15'
                                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      }`}
                                    >
                                      <Package className="w-2.5 h-2.5 shrink-0" />
                                      <span>طلب: #{msg.orderNumber}</span>
                                    </div>
                                  )}

                                  {/* Quoted reply snippet */}
                                  {msg.replyTo && (
                                    <div
                                      className={`mb-2 p-2 rounded-lg text-[11px] border-r-2 ${
                                        isFromAdmin
                                          ? 'bg-black/10 border-slate-900 text-slate-900'
                                          : 'bg-black/30 border-emerald-500 text-slate-300'
                                      }`}
                                    >
                                      <div className="font-bold flex items-center gap-1 opacity-90">
                                        <Reply className="w-3 h-3" />
                                        <span>{msg.replyTo.senderName}</span>
                                      </div>
                                      <div className="truncate opacity-80 mt-0.5">
                                        {msg.replyTo.type === 'text' && (msg.replyTo.text || '')}
                                        {msg.replyTo.type === 'image' && '📷 صورة'}
                                        {msg.replyTo.type === 'audio' && '🎤 رسالة صوتية'}
                                        {msg.replyTo.type === 'file' && `📎 ${msg.replyTo.fileName || 'ملف مرفق'}`}
                                      </div>
                                    </div>
                                  )}

                                  {/* Text */}
                                  {msg.type === 'text' && (
                                    <div>
                                      <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] select-text">{msg.text}</p>
                                      {msg.isEdited && (
                                        <span
                                          className={`text-[9px] block mt-1 opacity-70 ${
                                            isFromAdmin ? 'text-slate-900 font-bold' : 'text-slate-400'
                                          }`}
                                        >
                                          (تم التعديل)
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Image message with preview and download button */}
                                  {(msg.type === 'image' || msg.isImage) && msg.fileUrl && (
                                    <div className="space-y-2 min-w-[190px] max-w-sm">
                                      <div
                                        onClick={() => setAdminViewingImage({ url: msg.fileUrl!, name: msg.fileName })}
                                        className="group relative rounded-xl overflow-hidden bg-black/40 border border-white/[0.08] max-h-56 flex items-center justify-center cursor-pointer"
                                        title="اضغط لعرض الصورة بالحجم الكامل"
                                      >
                                        <img
                                          src={msg.fileUrl}
                                          alt={msg.fileName || 'صورة'}
                                          className="w-full max-h-56 object-contain rounded-xl group-hover:scale-[1.02] transition-transform duration-200"
                                          referrerPolicy="no-referrer"
                                          loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-cairo backdrop-blur-[2px]">
                                          <Eye className="w-4 h-4" />
                                          <span>عرض بالحجم الكامل</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-between gap-2 pt-1">
                                        <span className={`text-[11px] truncate ${isFromAdmin ? 'text-slate-950 font-bold' : 'text-slate-300'}`}>
                                          {msg.fileName || 'صورة'}
                                          {Boolean(msg.fileSize) && ` (${formatFileSize(msg.fileSize)})`}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => downloadAttachment(msg.fileUrl!, msg.fileName || 'image.jpg')}
                                          className={`inline-flex items-center gap-1 py-1 px-2.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                            isFromAdmin
                                              ? 'bg-slate-950 text-emerald-400 hover:bg-slate-900'
                                              : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                                          }`}
                                        >
                                          <Download className="w-3 h-3" />
                                          <span>تنزيل</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* File message with category icon, name, size and download button */}
                                  {msg.type === 'file' && !msg.isImage && msg.fileUrl && (
                                    <div className="space-y-1.5 min-w-[190px]">
                                      <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded-lg ${isFromAdmin ? 'bg-emerald-700 text-slate-950' : 'bg-slate-800 text-emerald-400'}`}>
                                          {getFileCategory(msg.fileName) === 'sheet' ? (
                                            <FileSpreadsheet className="w-4 h-4 shrink-0" />
                                          ) : getFileCategory(msg.fileName) === 'archive' ? (
                                            <FileArchive className="w-4 h-4 shrink-0" />
                                          ) : (
                                            <FileText className="w-4 h-4 shrink-0" />
                                          )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className={`truncate font-semibold text-xs ${isFromAdmin ? 'text-slate-950' : 'text-slate-100'}`}>
                                            {msg.fileName || 'ملف مرفق'}
                                          </p>
                                          {Boolean(msg.fileSize) && (
                                            <p className={`text-[10px] ${isFromAdmin ? 'text-slate-800' : 'text-slate-400'}`}>
                                              {formatFileSize(msg.fileSize)}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => downloadAttachment(msg.fileUrl!, msg.fileName || 'document')}
                                        className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                          isFromAdmin
                                            ? 'bg-slate-950 text-emerald-400 hover:bg-slate-900'
                                            : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                                        }`}
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>تحميل الملف</span>
                                      </button>
                                    </div>
                                  )}

                                  {/* Audio message with AudioMessagePlayer */}
                                  {msg.type === 'audio' && msg.audioUrl && (
                                    <AudioMessagePlayer
                                      src={msg.audioUrl}
                                      duration={msg.audioDuration}
                                      isMine={isFromAdmin}
                                    />
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 px-1 mt-1 font-mono">
                              <span className="text-[9px] text-slate-500 font-payment-digits">
                                {new Date(msg.createdAt).toLocaleTimeString('ar-EG', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {isFromAdmin && !isDeleted && (
                                <span
                                  className={`inline-flex items-center text-[11px] font-bold transition-colors ${
                                    msg.readAt ? 'text-emerald-400' : 'text-slate-500'
                                  }`}
                                  title={msg.readAt ? `تمت القراءة: ${new Date(msg.readAt).toLocaleTimeString('ar-EG')}` : 'تم الإرسال'}
                                >
                                  {msg.readAt ? '✓✓' : '✓'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {/* Client typing indicator */}
                      {isClientTyping && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs w-fit animate-pulse">
                          <span className="flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce delay-100"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce delay-200"></span>
                          </span>
                          <span>{activeConversation.userName} يكتب الآن...</span>
                        </div>
                      )}

                      {/* Floating New Messages Indicator */}
                      {adminHasNewMessagesBelow && (
                        <div className="sticky bottom-2 flex justify-center z-10 pointer-events-none">
                          <button
                            type="button"
                            onClick={() => {
                              setAdminHasNewMessagesBelow(false);
                              scrollAdminToBottom('smooth');
                            }}
                            className="pointer-events-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-1.5 rounded-full shadow-lg text-xs font-bold flex items-center gap-1.5 transition-all transform hover:scale-105 active:scale-95 animate-bounce"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                            <span>رسائل جديدة بالأسفل</span>
                          </button>
                        </div>
                      )}

                      <div ref={adminMessagesEndRef} />
                    </div>

                    {/* Input Bar */}
                    <div className="p-2.5 sm:p-3 bg-slate-900 border-t border-slate-800 shrink-0">
                      {/* Chat error banner */}
                      {adminChatError && (
                        <div className="mb-2 p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span className="truncate">{adminChatError}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAdminChatError(null)}
                            className="p-1 hover:bg-red-500/20 rounded-md shrink-0 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Upload status banner */}
                      {adminChatUploadStatus && (
                        <div className="mb-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                          <span className="font-semibold">{adminChatUploadStatus}</span>
                        </div>
                      )}

                      {/* Replying banner */}
                      {adminReplyingTo && (
                        <div className="mb-2 p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <Reply className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-200 text-[11px] truncate">
                                الرد على: {adminReplyingTo.senderName}
                              </p>
                              <p className="text-slate-400 text-[10px] truncate">
                                {adminReplyingTo.type === 'text' && (adminReplyingTo.text || '')}
                                {adminReplyingTo.type === 'image' && '📷 صورة'}
                                {adminReplyingTo.type === 'audio' && '🎤 رسالة صوتية'}
                                {adminReplyingTo.type === 'file' && `📎 ${adminReplyingTo.fileName || 'ملف مرفق'}`}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAdminReplyingTo(null)}
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Staged File / Image Preview Banner */}
                      {adminStagedFile && (
                        <div className="mb-2 p-2.5 rounded-xl bg-slate-950 border border-emerald-500/40 flex items-center justify-between gap-3 shadow-lg">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {adminStagedFile.isImage && adminStagedFile.previewUrl ? (
                              <img
                                src={adminStagedFile.previewUrl}
                                alt="معاينة"
                                className="w-12 h-12 rounded-lg object-cover border border-white/[0.1] shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                                {getFileCategory(adminStagedFile.name) === 'sheet' ? (
                                  <FileSpreadsheet className="w-5 h-5" />
                                ) : getFileCategory(adminStagedFile.name) === 'archive' ? (
                                  <FileArchive className="w-5 h-5" />
                                ) : (
                                  <FileText className="w-5 h-5" />
                                )}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-100 truncate">
                                {adminStagedFile.name}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {formatFileSize(adminStagedFile.size)} • جاهز للإرسال
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveAdminStagedFile}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
                            title="إلغاء المرفق"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Recorded Audio Staged Preview Banner */}
                      {adminRecordedAudioPreview && (
                        <div className="mb-2 flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (!adminPreviewAudioRef.current) return;
                                if (adminIsPreviewAudioPlaying) {
                                  adminPreviewAudioRef.current.pause();
                                  setAdminIsPreviewAudioPlaying(false);
                                } else {
                                  adminPreviewAudioRef.current.play();
                                  setAdminIsPreviewAudioPlaying(true);
                                }
                              }}
                              className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-bold transition-transform active:scale-95 cursor-pointer shadow-md shadow-emerald-500/20 shrink-0"
                            >
                              {adminIsPreviewAudioPlaying ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4 ml-0.5" />
                              )}
                            </button>
                            <audio
                              ref={adminPreviewAudioRef}
                              src={adminRecordedAudioPreview.url}
                              onEnded={() => setAdminIsPreviewAudioPlaying(false)}
                              className="hidden"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-emerald-300 font-cairo">
                                  معاينة التسجيل الصوتي
                                </span>
                                <span className="text-[11px] font-mono text-emerald-400/90 font-payment-digits">
                                  ({formatAudioDuration(adminRecordedAudioPreview.duration)})
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-cairo block truncate">
                                استمع لتسجيلك قبل إرساله للعميل
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={handleDiscardAdminAudioPreview}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="حذف التسجيل"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={handleSendAdminAudioPreview}
                              disabled={sendingMsg}
                              className="flex items-center gap-1.5 py-1 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/20"
                            >
                              {sendingMsg ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5 -rotate-90" />
                              )}
                              <span>إرسال</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {isRecording ? (
                        <div className="flex items-center justify-between p-2 rounded-xl bg-red-950/40 border border-red-500/40">
                          <div className="flex items-center gap-2 text-red-400 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0"></span>
                            <span className="text-xs font-semibold truncate font-mono">
                              جاري التسجيل ({formatAudioDuration(recordSeconds)})...
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={stopAdminRecording}
                            className="h-8 px-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-red-500/20"
                          >
                            <Square className="w-3.5 h-3.5 fill-current" />
                            <span>إيقاف والمعاينة</span>
                          </button>
                        </div>
                      ) : !adminRecordedAudioPreview ? (
                        <form onSubmit={handleSendAdminMessage} className="flex items-center gap-1.5 sm:gap-2 w-full min-w-0">
                          <input
                            type="file"
                            ref={chatFileRef}
                            onChange={handleAdminFileSelect}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => chatFileRef.current?.click()}
                            disabled={sendingMsg}
                            title="إرفاق ملف أو صورة"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors shrink-0 flex items-center justify-center border border-white/[0.06] cursor-pointer"
                          >
                            <Paperclip className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={startAdminRecording}
                            disabled={sendingMsg}
                            title="تسجيل صوتي"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors shrink-0 flex items-center justify-center border border-white/[0.06] cursor-pointer"
                          >
                            <Mic className="w-4 h-4" />
                          </button>
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => handleAdminChatInputChange(e.target.value)}
                            placeholder={adminStagedFile ? 'اكتب تعليقًا على الملف المرفق...' : 'اكتب ردك للعميل...'}
                            disabled={sendingMsg}
                            className="flex-1 min-w-0 h-9 sm:h-10 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 text-xs text-slate-100 placeholder-slate-500 outline-none"
                          />
                          <button
                            type="submit"
                            disabled={(!chatInput.trim() && !adminStagedFile) || sendingMsg}
                            id="admin-send-chat-btn"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold transition-all shrink-0 flex items-center justify-center cursor-pointer shadow-md shadow-emerald-500/20"
                            title="إرسال"
                          >
                            {sendingMsg ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4 -rotate-90" />
                            )}
                          </button>
                        </form>
                      ) : null}
                    </div>

                    {/* Admin Message Edit Modal */}
                    {adminEditingMsg && (
                      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                              <Pencil className="w-4 h-4 text-emerald-400" />
                              تعديل الرسالة
                            </h4>
                            <button
                              onClick={() => {
                                setAdminEditingMsg(null);
                                setAdminEditText('');
                              }}
                              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <textarea
                            value={adminEditText}
                            onChange={(e) => setAdminEditText(e.target.value)}
                            className="w-full h-28 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 outline-none focus:border-emerald-500 resize-none"
                            placeholder="نص الرسالة المعدل..."
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setAdminEditingMsg(null);
                                setAdminEditText('');
                              }}
                              disabled={savingAdminEdit}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                            >
                              إلغاء
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveAdminEdit}
                              disabled={!adminEditText.trim() || savingAdminEdit}
                              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5"
                            >
                              {savingAdminEdit && <Loader2 className="w-3 h-3 animate-spin" />}
                              حفظ التعديل
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
                    اختر محادثة من القائمة لعرض الرسائل.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 44. ADMIN NOTIFICATIONS TAB */}
        {/* ==================================================== */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-100">الإشعارات</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                سجل إشعارات المنصة، والطلبات الجديدة ورسائل العملاء.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0d121f] border border-slate-800 divide-y divide-slate-800/60">
              {notificationsList.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  لا توجد إشعارات جديدة.
                </div>
              ) : (
                notificationsList.map((notif) => (
                  <div key={notif.id} className="py-4 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-200">{notif.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{notif.body}</p>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {new Date(notif.createdAt).toLocaleString('ar-EG')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 45. ADMIN SETTINGS TAB */}
        {/* ==================================================== */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-100">إعدادات المنصة</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                التحكم برقم المحفظة الإلكترونية المعتمد لاستلام مدفوعات العملاء.
              </p>
            </div>

            {settingsSavedMsg && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>تم حفظ إعدادات المنصة بنجاح في الخادم.</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl bg-[#0d121f] border border-slate-800 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  اسم وسيلة الدفع
                </label>
                <input
                  type="text"
                  required
                  value={settings.walletName}
                  onChange={(e) => setSettings({ ...settings, walletName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  رقم المحفظة الإلكترونية (فودافون كاش / اتصالات كاش وغيرها)
                </label>
                <input
                  type="text"
                  required
                  value={settings.walletNumber}
                  onChange={(e) => setSettings({ ...settings, walletNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-100 outline-none font-mono"
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  سيظهر هذا الرقم للعملاء في صفحة الدفع مباشرة.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  البريد الإلكتروني للأدمن
                </label>
                <input
                  type="email"
                  required
                  value={settings.adminEmail}
                  onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-100 outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                id="save-settings-btn"
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2"
              >
                {savingSettings && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>حفظ الإعدادات</span>
              </button>
            </form>
          </div>
        )}
      </main>

      {/* ==================================================== */}
      {/* 40 & 41. ADD / EDIT SERVICE MODAL */}
      {/* ==================================================== */}
      {serviceModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm text-right">
          <div className="w-full max-w-2xl bg-[#0d121f] border border-slate-800 rounded-2xl p-6 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">
                {serviceModalMode === 'add' ? 'إضافة خدمة' : 'تعديل الخدمة'}
              </h3>
              <button
                onClick={() => setServiceModalMode(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              {/* Image attachment instead of link */}
              <div>
                <label className="block font-semibold text-slate-200 mb-1.5">صورة الخدمة</label>
                <input
                  type="file"
                  ref={serviceImageInputRef}
                  accept="image/*"
                  onChange={handleServiceImageUpload}
                  className="hidden"
                  id="service-image-file-input"
                />

                {serviceImageUploading ? (
                  <div className="w-full h-32 rounded-xl border border-dashed border-emerald-500/50 bg-emerald-500/10 flex flex-col items-center justify-center gap-2 text-emerald-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="font-semibold text-xs">جاري تحميل صورة الخدمة...</span>
                  </div>
                ) : editingService.image ? (
                  <div className="space-y-2.5">
                    <div className="w-full h-48 rounded-xl border border-slate-700 bg-slate-950 flex items-center justify-center overflow-hidden p-2">
                      <img
                        src={editingService.image}
                        alt="معاينة صورة الخدمة"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => serviceImageInputRef.current?.click()}
                        className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>تغيير الصورة</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingService({ ...editingService, image: '' })}
                        className="py-2 px-3 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-red-500/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف الصورة</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => serviceImageInputRef.current?.click()}
                    className="w-full h-32 rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/60 hover:bg-slate-900/60 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-emerald-400 p-4"
                  >
                    <div className="p-2.5 rounded-full bg-slate-800 text-emerald-400">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-xs text-slate-200">
                        اضغط لرفع صورة الخدمة من جهازك
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        يدعم ملفات JPG و PNG و WebP
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">عنوان الخدمة</label>
                <input
                  type="text"
                  required
                  value={editingService.title || ''}
                  onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                  placeholder="عنوان الخدمة البرمجية"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">وصف مختصر للخدمة</label>
                <input
                  type="text"
                  required
                  value={editingService.shortDescription || ''}
                  onChange={(e) =>
                    setEditingService({ ...editingService, shortDescription: e.target.value })
                  }
                  placeholder="نبذة موجزة تظهر في بطاقة الخدمة"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">السعر الأساسي (ج.م)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingService.basePrice || 0}
                    onChange={(e) =>
                      setEditingService({ ...editingService, basePrice: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-200 mb-1">السعر بعد الخصم (ج.م)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingService.discountedPrice || 0}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        discountedPrice: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="service-discount-active"
                  checked={Boolean(editingService.isDiscounted)}
                  onChange={(e) =>
                    setEditingService({ ...editingService, isDiscounted: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-800"
                />
                <label htmlFor="service-discount-active" className="text-slate-300 font-medium">
                  تفعيل الخصم على هذه الخدمة
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setServiceModalMode(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  id="save-service-modal-submit-btn"
                  className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                >
                  {serviceModalMode === 'add' ? 'حفظ الخدمة' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 39. DELETE SERVICE CONFIRMATION DIALOG */}
      {/* ==================================================== */}
      {deleteConfirmService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm text-right">
          <div className="w-full max-w-md bg-[#0d121f] border border-red-500/30 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100">هل أنت متأكد من حذف هذه الخدمة؟</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              سيتم إزالة خدمة "{deleteConfirmService.title}" نهائياً من قائمة الخدمات المتاحة للعملاء.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmService(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteService}
                id="confirm-delete-service-btn"
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
              >
                حذف الخدمة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 38. REJECT ORDER REASON DIALOG */}
      {/* ==================================================== */}
      {rejectionModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm text-right">
          <div className="w-full max-w-md bg-[#0d121f] border border-red-500/30 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100">
              رفض الطلب {rejectionModalOrder.orderNumber}
            </h3>
            <p className="text-xs text-slate-400">
              يرجى توضيح سبب الرفض (سيتم إرسال إشعار فوري للعميل بالسبب):
            </p>
            <textarea
              rows={3}
              value={rejectionReasonText}
              onChange={(e) => setRejectionReasonText(e.target.value)}
              placeholder="مثال: لم يتم استلام التحويل، أو المتطلبات غير واضحة..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 outline-none"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setRejectionModalOrder(null);
                  setRejectionReasonText('');
                }}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={() =>
                  handleUpdateOrderStatus(
                    rejectionModalOrder.id,
                    'rejected',
                    rejectionReasonText.trim()
                  )
                }
                id="confirm-reject-order-btn"
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Image Viewer for Admin Chat */}
      {adminViewingImage && (
        <div
          onClick={() => setAdminViewingImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in"
        >
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                downloadAttachment(adminViewingImage.url, adminViewingImage.name || 'image.jpg');
              }}
              className="p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer border border-white/[0.1] shadow-lg"
              title="تنزيل الصورة"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setAdminViewingImage(null)}
              className="p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer border border-white/[0.1] shadow-lg"
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
              src={adminViewingImage.url}
              alt={adminViewingImage.name || 'صورة مكبرة'}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/[0.1]"
              referrerPolicy="no-referrer"
            />
            {adminViewingImage.name && (
              <p className="text-xs text-slate-300 font-mono truncate max-w-md">
                {adminViewingImage.name}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

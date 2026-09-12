import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  DashboardOverviewKPI,
  OrderItem,
  OrderStatus,
  ServiceItem,
  UserProfile,
  Conversation,
  MessageItem,
  NotificationItem,
  PlatformSettings,
} from '../../types';
import {
  mergeAndSortMessages,
  isNearBottom,
  validateAttachmentFile,
  copyTextToClipboard,
} from '../../lib/chatUtils';
import { AlertCircle } from 'lucide-react';

// Standard Confirmation Modal
import { ConfirmationModal } from '../../components/ConfirmationModal';

// Admin Subcomponents
import { AdminSidebar, AdminTabId } from './components/AdminSidebar';
import { AdminTopBar } from './components/AdminTopBar';
import { AdminOverviewTab } from './components/AdminOverviewTab';
import { AdminOrdersTab } from './components/AdminOrdersTab';
import { AdminServicesTab } from './components/AdminServicesTab';
import { AdminUsersTab } from './components/AdminUsersTab';
import { AdminSupportTab } from './components/AdminSupportTab';
import { AdminNotificationsTab } from './components/AdminNotificationsTab';
import { AdminSettingsTab } from './components/AdminSettingsTab';
import {
  ServiceModal,
  RejectionModal,
  EditMessageModal,
  ImageLightboxModal,
} from './components/AdminModals';

interface AdminDashboardProps {
  onBackToHome: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToHome }) => {
  const { isAdmin, currentUser } = useAuth();

  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<AdminTabId>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
  const serviceImageInputRef = useRef<HTMLInputElement>(null);
  const [deleteConfirmService, setDeleteConfirmService] = useState<ServiceItem | null>(null);

  // Users Data
  const [usersList, setUsersList] = useState<UserProfile[]>([]);

  // Customer Support (Conversations) Data
  const [conversationsList, setConversationsList] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [activeMessages, setActiveMessages] = useState<MessageItem[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [adminChatUploadStatus, setAdminChatUploadStatus] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const adminRecordingStartTimeRef = useRef<number>(0);
  const adminScrollContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const chatFileRef = useRef<HTMLInputElement>(null);

  // Pagination & Smart Scroll Data for Admin Chat
  const [adminHasMore, setAdminHasMore] = useState(false);
  const [adminLoadingOlder, setAdminLoadingOlder] = useState(false);
  const [adminHasNewMessagesBelow, setAdminHasNewMessagesBelow] = useState(false);
  const [adminCopiedMsgId, setAdminCopiedMsgId] = useState<string | null>(null);

  // Realtime typing, presence and edit for Admin
  const [isClientTyping, setIsClientTyping] = useState(false);
  const clientTypingTimerRef = useRef<any>(null);
  const adminTypingTimerRef = useRef<any>(null);
  const adminLastTypingSentRef = useRef<number>(0);
  const [activeClientPresence, setActiveClientPresence] = useState<{
    isOnline: boolean;
    lastSeenAt?: string;
  }>({ isOnline: false });
  const [adminReplyingTo, setAdminReplyingTo] = useState<MessageItem | null>(null);
  const [adminEditingMsg, setAdminEditingMsg] = useState<MessageItem | null>(null);
  const [adminEditText, setAdminEditText] = useState('');
  const [savingAdminEdit, setSavingAdminEdit] = useState(false);
  const [adminMsgToDelete, setAdminMsgToDelete] = useState<string | null>(null);
  const [adminDeletingMsg, setAdminDeletingMsg] = useState(false);

  // Admin Attachment Staging & Voice Preview States
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
  const [adminIsDraggingFile, setAdminIsDraggingFile] = useState(false);
  const [adminViewingImage, setAdminViewingImage] = useState<{ url: string; name?: string } | null>(null);
  const [adminChatError, setAdminChatError] = useState<string | null>(null);

  // Notifications Data
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);

  // Settings Data
  const [settings, setSettings] = useState<PlatformSettings>({
    walletName: 'فودافون كاش',
    walletNumber: '01012345678',
    adminEmail: 'admin@hema-services.com',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

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
            adminScrollContainerRef.current.scrollTop =
              newScrollHeight - prevScrollHeight + prevScrollTop;
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

  // Handle Admin Chat Container Scroll
  const handleAdminChatScroll = () => {
    const container = adminScrollContainerRef.current;
    if (!container) return;

    if (container.scrollTop <= 40 && adminHasMore && !adminLoadingOlder) {
      loadOlderAdminMessages();
    }

    if (isNearBottom(container, 100)) {
      setAdminHasNewMessagesBelow(false);
    }
  };

  // ==========================================
  // DATA LOADERS
  // ==========================================

  // Load Overview Data
  const loadOverview = async () => {
    setLoadingOverview(true);
    try {
      const data = await api.getAdminOverview();
      setKpi(data.kpi);
      setRecentOrders(data.recentOrders);
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

  // Global Refresh Handler
  const handleRefreshCurrentTab = async () => {
    setIsRefreshing(true);
    try {
      if (activeTab === 'overview') await loadOverview();
      else if (activeTab === 'orders') await loadOrders();
      else if (activeTab === 'services') await loadServices();
      else if (activeTab === 'users') await loadUsers();
      else if (activeTab === 'conversations') await loadConversations();
      else if (activeTab === 'notifications') await loadNotifications();
      else if (activeTab === 'settings') await loadSettings();
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  // Realtime SSE & Heartbeat Subscriptions
  useEffect(() => {
    if (!isAdmin || !currentUser) return;
    let isMounted = true;

    // Presence heartbeat
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

  // Unauthorized screen
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-100">غير مصرح بالدخول</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          لوحة التحكم الإدارية مخصصة للمدير العام فقط، تم تقييد الوصول وفقاً لقواعد الحماية والأمان.
        </p>
        <button
          onClick={onBackToHome}
          className="px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  // ==========================================
  // ACTION HANDLERS
  // ==========================================

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

  // Handle Service Save
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

  // Stage Admin File or Image
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

  // Drag & Drop
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

  // Send Admin Chat Message
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

  // Confirm Delete Message
  const handleConfirmDeleteAdminMessage = async () => {
    if (!activeConversation || !adminMsgToDelete || adminDeletingMsg) return;
    try {
      setAdminDeletingMsg(true);
      await api.deleteMessage(activeConversation.id, adminMsgToDelete);
      setActiveMessages((prev) =>
        prev.map((m) =>
          m.id === adminMsgToDelete
            ? {
                ...m,
                isDeleted: true,
                text: 'تم حذف هذه الرسالة',
                fileUrl: undefined,
                audioUrl: undefined,
                audioDuration: undefined,
              }
            : m
        )
      );
      setAdminMsgToDelete(null);
      loadConversations();
    } catch (err) {
      console.error('Failed to delete message:', err);
    } finally {
      setAdminDeletingMsg(false);
    }
  };

  // Voice recording
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
    setAdminChatUploadStatus('جاري رفع الرسالة الصوتية...');

    try {
      const audioFile = new File(
        [adminRecordedAudioPreview.blob],
        `voice-admin-${Date.now()}.webm`,
        { type: 'audio/webm' }
      );
      const uploadRes = await api.uploadFile(audioFile, audioFile.name);

      const msg = await api.sendMessage(activeConversation.id, {
        senderId: currentUser.uid,
        senderName: 'إدارة HEMA SERVICES',
        senderRole: 'admin',
        type: 'audio',
        audioUrl: uploadRes.url,
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
      setAdminChatError(err.message || 'فشل رفع أو إرسال الرسالة الصوتية');
    } finally {
      setSendingMsg(false);
      setAdminChatUploadStatus(null);
    }
  };

  // Open Chat directly for an Order or User
  const handleOpenCustomerChat = (order: OrderItem) => {
    const existing = conversationsList.find(
      (c) => c.userId === order.userId || c.orderId === order.id
    );
    if (existing) {
      setActiveConversation(existing);
    } else {
      setActiveConversation({
        id: order.id,
        userId: order.userId,
        userName: order.userName,
        userEmail: order.userEmail || '',
        orderId: order.id,
        orderNumber: order.orderNumber,
        unreadCount: 0,
        createdAt: new Date().toISOString(),
      });
    }
    setActiveTab('conversations');
  };

  const handleContactUser = (user: UserProfile) => {
    const existing = conversationsList.find((c) => c.userId === user.id);
    if (existing) {
      setActiveConversation(existing);
    } else {
      setActiveConversation({
        id: user.id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        unreadCount: 0,
        createdAt: new Date().toISOString(),
      });
    }
    setActiveTab('conversations');
  };

  return (
    <div className="min-h-screen bg-[#06080e] text-slate-100 flex flex-col md:flex-row antialiased overflow-x-hidden font-cairo">
      {/* SaaS Sidebar (Desktop & Mobile Drawer) */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'orders') setSelectedOrder(null);
        }}
        onBackToHome={onBackToHome}
        adminEmail={currentUser?.email || settings.adminEmail}
        stats={{
          pendingOrders: kpi.pendingOrders,
          totalOrders: kpi.totalOrders,
          totalServices: kpi.totalServices,
          totalUsers: kpi.totalUsers,
          unreadCount: conversationsList.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
        }}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <AdminTopBar
          activeTab={activeTab}
          onOpenMobile={() => setIsMobileMenuOpen(true)}
          onRefresh={handleRefreshCurrentTab}
          isRefreshing={isRefreshing}
          pendingOrdersCount={kpi.pendingOrders}
          unreadMessagesCount={conversationsList.reduce((sum, c) => sum + (c.unreadCount || 0), 0)}
          onNavigateToOrders={() => {
            setOrderFilter('pending_review');
            setSelectedOrder(null);
            setActiveTab('orders');
          }}
          onNavigateToSupport={() => setActiveTab('conversations')}
          onBackToHome={onBackToHome}
        />

        {/* Tab View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <AdminOverviewTab
              kpi={kpi}
              recentOrders={recentOrders}
              isLoading={loadingOverview}
              onSelectOrder={(order) => {
                setSelectedOrder(order);
                setActiveTab('orders');
              }}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onAddNewService={() => {
                setServiceModalMode('add');
                setEditingService({
                  basePrice: 100,
                  deliverables: ['كود نظيف وموثق', 'دعم فني وضمان'],
                });
              }}
            />
          )}

          {activeTab === 'orders' && (
            <AdminOrdersTab
              ordersList={ordersList}
              selectedOrder={selectedOrder}
              onSelectOrder={setSelectedOrder}
              orderFilter={orderFilter}
              onSetFilter={setOrderFilter}
              onUpdateStatus={handleUpdateOrderStatus}
              onRequestRejectOrder={(order) => {
                setRejectionModalOrder(order);
                setRejectionReasonText('');
              }}
              onOpenCustomerChat={handleOpenCustomerChat}
              onViewImageLightbox={setAdminViewingImage}
            />
          )}

          {activeTab === 'services' && (
            <AdminServicesTab
              servicesList={servicesList}
              onAddNewService={() => {
                setServiceModalMode('add');
                setEditingService({
                  basePrice: 100,
                  deliverables: ['كود نظيف وموثق', 'دعم فني وضمان'],
                });
              }}
              onEditService={(service) => {
                setServiceModalMode('edit');
                setEditingService(service);
              }}
              onDeleteService={setDeleteConfirmService}
            />
          )}

          {activeTab === 'users' && (
            <AdminUsersTab
              usersList={usersList}
              onContactUser={handleContactUser}
            />
          )}

          {activeTab === 'conversations' && (
            <AdminSupportTab
              conversationsList={conversationsList}
              activeConversation={activeConversation}
              onSelectConversation={setActiveConversation}
              onRefreshConversations={loadConversations}
              activeMessages={activeMessages}
              chatInput={chatInput}
              onChatInputChange={handleAdminChatInputChange}
              onSendAdminMessage={handleSendAdminMessage}
              sendingMsg={sendingMsg}
              adminChatUploadStatus={adminChatUploadStatus}
              adminChatError={adminChatError}
              onClearChatError={() => setAdminChatError(null)}
              isClientTyping={isClientTyping}
              activeClientPresence={activeClientPresence}
              adminReplyingTo={adminReplyingTo}
              onSetReplyingTo={setAdminReplyingTo}
              onStartEditMessage={(msg) => {
                setAdminEditingMsg(msg);
                setAdminEditText(msg.text || '');
              }}
              onRequestDeleteMessage={setAdminMsgToDelete}
              adminCopiedMsgId={adminCopiedMsgId}
              onCopyMessage={handleCopyAdminMessage}
              adminHasMore={adminHasMore}
              adminLoadingOlder={adminLoadingOlder}
              adminHasNewMessagesBelow={adminHasNewMessagesBelow}
              onScrollToBottom={() => scrollAdminToBottom('smooth')}
              scrollContainerRef={adminScrollContainerRef}
              onScroll={handleAdminChatScroll}
              chatFileRef={chatFileRef}
              onFileSelect={handleAdminFileSelect}
              adminStagedFile={adminStagedFile}
              onRemoveStagedFile={handleRemoveAdminStagedFile}
              isRecording={isRecording}
              recordSeconds={recordSeconds}
              onStartRecording={startAdminRecording}
              onStopRecording={stopAdminRecording}
              adminRecordedAudioPreview={adminRecordedAudioPreview}
              onSendAudioPreview={handleSendAdminAudioPreview}
              onDiscardAudioPreview={handleDiscardAdminAudioPreview}
              adminIsDraggingFile={adminIsDraggingFile}
              onDragOver={handleAdminDragOver}
              onDragLeave={handleAdminDragLeave}
              onDrop={handleAdminDrop}
              onViewImageLightbox={setAdminViewingImage}
            />
          )}

          {activeTab === 'notifications' && (
            <AdminNotificationsTab
              notificationsList={notificationsList}
              onSelectNotification={(notif) => {
                if (notif.orderNumber) {
                  setOrderFilter('all');
                  setActiveTab('orders');
                }
              }}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettingsTab
              settings={settings}
              onUpdateSettings={setSettings}
              onSaveSettings={handleSaveSettings}
              isSaving={savingSettings}
              isSavedMsg={settingsSavedMsg}
            />
          )}
        </main>
      </div>

      {/* Global Modals & Dialogs */}
      {/* 1. Add / Edit Service Modal */}
      <ServiceModal
        isOpen={Boolean(serviceModalMode)}
        mode={serviceModalMode}
        editingService={editingService}
        onClose={() => {
          setServiceModalMode(null);
          setEditingService({});
        }}
        onSave={handleSaveService}
        onChangeService={setEditingService}
        imageInputRef={serviceImageInputRef}
        onImageUpload={handleServiceImageUpload}
        isUploadingImage={serviceImageUploading}
      />

      {/* 2. Reject Order Reason Dialog */}
      <RejectionModal
        order={rejectionModalOrder}
        reasonText={rejectionReasonText}
        onChangeReason={setRejectionReasonText}
        onClose={() => {
          setRejectionModalOrder(null);
          setRejectionReasonText('');
        }}
        onConfirm={() => {
          if (rejectionModalOrder) {
            handleUpdateOrderStatus(
              rejectionModalOrder.id,
              'rejected',
              rejectionReasonText.trim()
            );
          }
        }}
      />

      {/* 3. Delete Service Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deleteConfirmService)}
        onClose={() => setDeleteConfirmService(null)}
        onConfirm={handleDeleteService}
        title="حذف الخدمة"
        description="هل أنت متأكد من حذف هذه الخدمة؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        destructive={true}
        icon="trash"
      />

      {/* 4. Delete Message Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(adminMsgToDelete)}
        onClose={() => setAdminMsgToDelete(null)}
        onConfirm={handleConfirmDeleteAdminMessage}
        title="حذف الرسالة"
        description="هل أنت متأكد من حذف هذه الرسالة؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        destructive={true}
        icon="trash"
        loading={adminDeletingMsg}
      />

      {/* 5. Edit Message Modal */}
      <EditMessageModal
        message={adminEditingMsg}
        editText={adminEditText}
        onChangeText={setAdminEditText}
        onClose={() => {
          setAdminEditingMsg(null);
          setAdminEditText('');
        }}
        onSave={handleSaveAdminEdit}
        isSaving={savingAdminEdit}
      />

      {/* 6. Fullscreen Image Lightbox Modal */}
      <ImageLightboxModal
        image={adminViewingImage}
        onClose={() => setAdminViewingImage(null)}
      />
    </div>
  );
};

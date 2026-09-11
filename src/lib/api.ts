import {
  ServiceItem,
  OrderItem,
  OrderStatus,
  Conversation,
  MessageItem,
  NotificationItem,
  PlatformSettings,
  DashboardOverviewKPI,
  UserProfile,
} from '../types';
import { auth } from './firebase';

let cachedToken: string | null = null;
let currentUserId = '';
let currentUserEmail = '';

export function setApiAuth(userId: string, email: string, token?: string) {
  currentUserId = userId;
  currentUserEmail = email;
  if (token !== undefined) {
    cachedToken = token;
  }
}

export async function getFreshToken(): Promise<string | null> {
  try {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      cachedToken = token;
      return token;
    }
  } catch (err) {
    console.error('Failed to get fresh Firebase ID token:', err);
  }
  return cachedToken;
}

async function getAuthHeaders(extraHeaders?: Record<string, string>): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  const token = await getFreshToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

export const api = {
  // Session & Auth
  async logoutSession(): Promise<void> {
    cachedToken = null;
    currentUserId = '';
    currentUserEmail = '';
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
  },

  // Config
  async getConfig(): Promise<PlatformSettings> {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('فشل في جلب إعدادات المنصة');
    return res.json();
  },

  async updateSettings(settings: Partial<PlatformSettings>): Promise<{ success: boolean; settings: PlatformSettings }> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers,
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل في حفظ الإعدادات');
    }
    return res.json();
  },

  // Services
  async getServices(): Promise<ServiceItem[]> {
    const res = await fetch('/api/services');
    if (!res.ok) throw new Error('فشل في جلب قائمة الخدمات');
    return res.json();
  },

  async getService(id: string): Promise<ServiceItem> {
    const res = await fetch(`/api/services/${id}`);
    if (!res.ok) throw new Error('الخدمة المطلوبة غير متوفرة');
    return res.json();
  },

  async createService(serviceData: Omit<ServiceItem, 'id'>): Promise<ServiceItem> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/services', {
      method: 'POST',
      headers,
      body: JSON.stringify(serviceData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل في إضافة الخدمة');
    }
    return res.json();
  },

  async updateService(id: string, serviceData: Partial<ServiceItem>): Promise<ServiceItem> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/services/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(serviceData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل في تحديث الخدمة');
    }
    return res.json();
  },

  async deleteService(id: string): Promise<{ success: boolean }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/services/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل في حذف الخدمة');
    }
    return res.json();
  },

  // Orders
  async getOrders(adminFilterUserId?: string): Promise<OrderItem[]> {
    const headers = await getAuthHeaders();
    const url = adminFilterUserId ? `/api/orders?userId=${encodeURIComponent(adminFilterUserId)}` : '/api/orders';
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('فشل في جلب الطلبات');
    return res.json();
  },

  async getOrder(id: string): Promise<OrderItem> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/orders/${id}`, { headers });
    if (!res.ok) throw new Error('فشل في جلب بيانات الطلب');
    return res.json();
  },

  async createOrder(orderData: {
    userId?: string;
    userName?: string;
    userEmail?: string;
    serviceId: string;
    customerRequirements?: string;
    paymentProof: string;
    paymentProofFilename?: string;
    paymentMethod?: string;
    senderWalletNumber?: string;
  }): Promise<OrderItem> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل في إرسال الطلب');
    }
    return res.json();
  },

  async updateOrderStatus(id: string, status: OrderStatus, rejectionReason?: string): Promise<OrderItem> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status, rejectionReason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل في تحديث حالة الطلب');
    }
    return res.json();
  },

  async cancelOrder(id: string): Promise<{ success: boolean; order: OrderItem }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/orders/${id}/cancel`, {
      method: 'POST',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل في إلغاء الطلب');
    }
    return res.json();
  },

  // File Upload (Via backend, authenticated)
  async uploadFile(file: File | Blob, originalName?: string): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    const name = originalName || (file instanceof File ? file.name : 'upload.bin');
    formData.append('file', file, name);

    const headers: Record<string, string> = {};
    const token = await getFreshToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل في رفع الملف');
    }
    return res.json();
  },

  // Conversations & Chat
  async getConversations(): Promise<Conversation[]> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/conversations', { headers });
    if (!res.ok) throw new Error('فشل في جلب المحادثات');
    return res.json();
  },

  async getConversation(id: string): Promise<Conversation> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/conversations/${encodeURIComponent(id)}`, { headers });
    if (!res.ok) throw new Error('فشل في جلب المحادثة');
    return res.json();
  },

  async findOrCreateConversation(data: {
    userId?: string;
    userName?: string;
    userEmail?: string;
    orderId?: string;
  }): Promise<Conversation> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/conversations/find-or-create', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('فشل في إنشاء أو العثور على المحادثة');
    return res.json();
  },

  async getMessages(
    conversationId: string,
    params?: { limit?: number; before?: string }
  ): Promise<MessageItem[]> {
    let url = `/api/conversations/${conversationId}/messages`;
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.before) query.set('before', params.before);
    const queryString = query.toString();
    if (queryString) url += `?${queryString}`;

    const headers = await getAuthHeaders();
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('فشل في جلب الرسائل');
    const data = await res.json();
    if (Array.isArray(data)) return data;
    return data.messages || [];
  },

  async getMessagesWithMeta(
    conversationId: string,
    params?: { limit?: number; before?: string }
  ): Promise<{ messages: MessageItem[]; totalCount: number; hasMore: boolean }> {
    let url = `/api/conversations/${conversationId}/messages`;
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.before) query.set('before', params.before);
    const queryString = query.toString();
    if (queryString) url += `?${queryString}`;

    const headers = await getAuthHeaders();
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('فشل في جلب الرسائل');
    const data = await res.json();
    if (Array.isArray(data)) {
      return { messages: data, totalCount: data.length, hasMore: false };
    }
    return data;
  },

  async sendMessage(
    conversationId: string,
    messageData: {
      senderId?: string;
      senderName?: string;
      senderRole?: 'user' | 'admin';
      type: 'text' | 'file' | 'audio' | 'image';
      text?: string;
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      isImage?: boolean;
      audioUrl?: string;
      audioDuration?: number;
      replyTo?: {
        id: string;
        senderName: string;
        type: 'text' | 'file' | 'audio' | 'image';
        text?: string;
        fileName?: string;
        isImage?: boolean;
      };
      orderId?: string;
      orderNumber?: string;
    }
  ): Promise<MessageItem> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(messageData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل في إرسال الرسالة');
    }
    return res.json();
  },

  async editMessage(conversationId: string, messageId: string, text: string): Promise<MessageItem> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/conversations/${conversationId}/messages/${messageId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل في تعديل الرسالة');
    }
    const data = await res.json();
    return data.updatedMessage;
  },

  async deleteMessage(conversationId: string, messageId: string): Promise<{ success: boolean }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/conversations/${conversationId}/messages/${messageId}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل في حذف الرسالة');
    }
    return res.json();
  },

  async markConversationRead(conversationId: string): Promise<void> {
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'POST',
        headers,
      });
    } catch {
      // silent
    }
  },

  async sendTyping(
    conversationId: string,
    isTyping: boolean,
    data?: { userId?: string; userName?: string; role?: 'admin' | 'user' }
  ): Promise<void> {
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/conversations/${conversationId}/typing`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...data, isTyping }),
      });
    } catch {
      // silent
    }
  },

  async getUserPresence(userId: string): Promise<{ userId: string; isOnline: boolean; lastSeenAt: string }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/chat/presence/${encodeURIComponent(userId)}`, {
      headers,
    });
    if (!res.ok) return { userId, isOnline: false, lastSeenAt: new Date().toISOString() };
    return res.json();
  },

  async getAdminPresenceStatus(): Promise<{ isOnline: boolean; statusText: string }> {
    const res = await fetch('/api/chat/presence-admin/status');
    if (!res.ok) return { isOnline: false, statusText: 'خدمة العملاء متاحة للرد' };
    return res.json();
  },

  async sendPresenceHeartbeat(userId: string, role: 'admin' | 'user'): Promise<void> {
    try {
      const headers = await getAuthHeaders();
      await fetch('/api/chat/presence', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, role, isOnline: true }),
      });
    } catch {
      // silent
    }
  },

  // Realtime Server-Sent Events Chat Subscription (Authenticated & Account-Safe)
  subscribeChat(params: {
    conversationId?: string;
    onMessage?: (msg: MessageItem, conversationId?: string) => void;
    onMessageUpdated?: (msg: MessageItem, conversationId?: string) => void;
    onMessageDeleted?: (data: { conversationId: string; messageId: string; message?: MessageItem }) => void;
    onMessagesRead?: (data: { conversationId: string; readAt: string; readByRole: string }) => void;
    onTyping?: (data: { conversationId: string; userId: string; userName: string; role?: string; isTyping: boolean }) => void;
    onPresence?: (data: { userId: string; role: string; isOnline: boolean; lastSeenAt: string }) => void;
    onNotification?: (data: { userId: string; notification?: NotificationItem }) => void;
    onNotificationRead?: (data: { userId: string; notificationId: string }) => void;
    onNotificationsRead?: (data: { userId: string }) => void;
    onConversationUnreadUpdated?: (data: { conversationId: string; userId: string; unreadByUser: number; unreadByAdmin: number }) => void;
    // Backward compatibility optional fields (ignored for auth security)
    userId?: string;
    role?: 'admin' | 'user';
  }): () => void {
    let eventSource: EventSource | null = null;
    let isCancelled = false;
    let retryTimeout: any = null;
    let retryAttempt = 0;

    const connect = async () => {
      if (isCancelled) return;

      try {
        // Re-authenticate and obtain a fresh token on each connection / reconnection
        const token = await getFreshToken();
        if (isCancelled) return;
        if (!token) {
          // If no token exists (e.g. logged out), do not establish connection
          return;
        }

        // Close any prior lingering connection before creating a new one
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }

        const query = new URLSearchParams({ token });
        if (params.conversationId) query.set('convId', params.conversationId);

        const es = new EventSource(`/api/chat/stream?${query.toString()}`);
        eventSource = es;

        es.onopen = () => {
          // Reset retry backoff upon successful connection
          retryAttempt = 0;
        };

        if (params.onMessage) {
          es.addEventListener('message_created', (e) => {
            try {
              const data = JSON.parse(e.data);
              if (data.message) params.onMessage!(data.message, data.conversationId);
            } catch (err) {
              console.error('Failed to parse SSE message_created', err);
            }
          });
        }

        if (params.onMessageUpdated) {
          es.addEventListener('message_updated', (e) => {
            try {
              const data = JSON.parse(e.data);
              if (data.message) params.onMessageUpdated!(data.message, data.conversationId);
            } catch (err) {
              console.error('Failed to parse SSE message_updated', err);
            }
          });
        }

        if (params.onMessageDeleted) {
          es.addEventListener('message_deleted', (e) => {
            try {
              const data = JSON.parse(e.data);
              params.onMessageDeleted!(data);
            } catch (err) {
              console.error('Failed to parse SSE message_deleted', err);
            }
          });
        }

        if (params.onMessagesRead) {
          es.addEventListener('messages_read', (e) => {
            try {
              const data = JSON.parse(e.data);
              params.onMessagesRead!(data);
            } catch (err) {
              console.error('Failed to parse SSE messages_read', err);
            }
          });
        }

        if (params.onTyping) {
          es.addEventListener('typing', (e) => {
            try {
              const data = JSON.parse(e.data);
              params.onTyping!(data);
            } catch (err) {
              console.error('Failed to parse SSE typing', err);
            }
          });
        }

        if (params.onPresence) {
          es.addEventListener('presence', (e) => {
            try {
              const data = JSON.parse(e.data);
              params.onPresence!(data);
            } catch (err) {
              console.error('Failed to parse SSE presence', err);
            }
          });
        }

        if (params.onNotification) {
          es.addEventListener('new_notification', (e) => {
            try {
              const data = JSON.parse(e.data);
              params.onNotification!(data);
            } catch (err) {
              console.error('Failed to parse SSE new_notification', err);
            }
          });
        }

        if (params.onNotificationRead) {
          es.addEventListener('notification_read', (e) => {
            try {
              const data = JSON.parse(e.data);
              params.onNotificationRead!(data);
            } catch (err) {
              console.error('Failed to parse SSE notification_read', err);
            }
          });
        }

        if (params.onNotificationsRead) {
          es.addEventListener('notifications_read', (e) => {
            try {
              const data = JSON.parse(e.data);
              params.onNotificationsRead!(data);
            } catch (err) {
              console.error('Failed to parse SSE notifications_read', err);
            }
          });
        }

        if (params.onConversationUnreadUpdated) {
          es.addEventListener('conversation_unread_updated', (e) => {
            try {
              const data = JSON.parse(e.data);
              params.onConversationUnreadUpdated!(data);
            } catch (err) {
              console.error('Failed to parse SSE conversation_unread_updated', err);
            }
          });
        }

        es.addEventListener('force_disconnect', () => {
          // Server explicitly closed connection (e.g. user logged out)
          isCancelled = true;
          es.close();
          if (eventSource === es) eventSource = null;
        });

        es.onerror = () => {
          if (isCancelled) return;
          // Close failing connection and schedule reconnection with exponential backoff
          es.close();
          if (eventSource === es) eventSource = null;

          const backoffDelay = Math.min(2000 * Math.pow(1.5, retryAttempt), 30000);
          retryAttempt++;

          if (retryTimeout) clearTimeout(retryTimeout);
          retryTimeout = setTimeout(() => {
            if (!isCancelled) {
              connect();
            }
          }, backoffDelay);
        };
      } catch (err) {
        if (!isCancelled) {
          const backoffDelay = Math.min(2000 * Math.pow(1.5, retryAttempt), 30000);
          retryAttempt++;
          if (retryTimeout) clearTimeout(retryTimeout);
          retryTimeout = setTimeout(() => {
            if (!isCancelled) {
              connect();
            }
          }, backoffDelay);
        }
      }
    };

    connect();

    return () => {
      isCancelled = true;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/notifications', { headers });
    if (!res.ok) throw new Error('فشل في جلب الإشعارات');
    return res.json();
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers,
    });
    return res.json();
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/notifications/read-all', {
      method: 'PATCH',
      headers,
    });
    return res.json();
  },

  async getUnreadSupportCount(): Promise<{ unreadSupportCount: number }> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/conversations/unread-count', { headers });
      if (!res.ok) return { unreadSupportCount: 0 };
      return res.json();
    } catch {
      return { unreadSupportCount: 0 };
    }
  },

  // Users & Admin
  async syncUser(user: { id?: string; name: string; email: string; photo?: string }): Promise<UserProfile> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/users/sync', {
      method: 'POST',
      headers,
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error('فشل في مزامنة بيانات المستخدم');
    return res.json();
  },

  async getAdminOverview(): Promise<{ kpi: DashboardOverviewKPI; recentOrders: OrderItem[] }> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/overview', {
      headers,
    });
    if (!res.ok) throw new Error('غير مصرح بالوصول إلى لوحة التحكم');
    return res.json();
  },

  async getAdminUsers(): Promise<UserProfile[]> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/users', {
      headers,
    });
    if (!res.ok) throw new Error('غير مصرح بالوصول إلى بيانات المستخدمين');
    return res.json();
  },
};

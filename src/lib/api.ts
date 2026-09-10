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

let currentUserEmail = '';
let currentUserId = '';

export function setApiAuth(userId: string, email: string) {
  currentUserId = userId;
  currentUserEmail = email;
}

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (currentUserId) headers['x-user-id'] = currentUserId;
  if (currentUserEmail) headers['x-user-email'] = currentUserEmail;
  return headers;
}

export const api = {
  // Config
  async getConfig(): Promise<PlatformSettings> {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('فشل في جلب إعدادات المنصة');
    return res.json();
  },

  async updateSettings(settings: Partial<PlatformSettings>): Promise<{ success: boolean; settings: PlatformSettings }> {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('فشل في تحديث إعدادات المنصة');
    return res.json();
  },

  // Services
  async getServices(): Promise<ServiceItem[]> {
    const res = await fetch('/api/services');
    if (!res.ok) throw new Error('فشل في جلب الخدمات');
    return res.json();
  },

  async getService(id: string): Promise<ServiceItem> {
    const res = await fetch(`/api/services/${id}`);
    if (!res.ok) throw new Error('الخدمة غير موجودة');
    return res.json();
  },

  async createService(serviceData: Partial<ServiceItem>): Promise<ServiceItem> {
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(serviceData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل في إضافة الخدمة');
    }
    return res.json();
  },

  async updateService(id: string, serviceData: Partial<ServiceItem>): Promise<ServiceItem> {
    const res = await fetch(`/api/services/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(serviceData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل في تحديث الخدمة');
    }
    return res.json();
  },

  async deleteService(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/services/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('فشل في حذف الخدمة');
    return res.json();
  },

  // Orders
  async getOrders(): Promise<OrderItem[]> {
    const url = currentUserId ? `/api/orders?userId=${encodeURIComponent(currentUserId)}` : '/api/orders';
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('فشل في جلب الطلبات');
    return res.json();
  },

  async getOrder(id: string): Promise<OrderItem> {
    const res = await fetch(`/api/orders/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('فشل في جلب بيانات الطلب');
    return res.json();
  },

  async createOrder(orderData: {
    userId: string;
    userName: string;
    userEmail: string;
    serviceId: string;
    customerRequirements?: string;
    paymentProof: string;
    paymentProofFilename?: string;
    paymentMethod?: string;
    senderWalletNumber?: string;
  }): Promise<OrderItem> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(orderData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل في إرسال الطلب');
    }
    return res.json();
  },

  async updateOrderStatus(id: string, status: OrderStatus, rejectionReason?: string): Promise<OrderItem> {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, rejectionReason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل في تحديث حالة الطلب');
    }
    return res.json();
  },

  async cancelOrder(id: string): Promise<{ success: boolean; order: OrderItem }> {
    const res = await fetch(`/api/orders/${id}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل في إلغاء الطلب');
    }
    return res.json();
  },

  // File Upload (Via backend, NOT Firebase Storage)
  async uploadFile(file: File | Blob, originalName?: string): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    const name = originalName || (file instanceof File ? file.name : 'upload.bin');
    formData.append('file', file, name);

    const headers: Record<string, string> = {};
    if (currentUserId) headers['x-user-id'] = currentUserId;
    if (currentUserEmail) headers['x-user-email'] = currentUserEmail;

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
    const url = currentUserId ? `/api/conversations?userId=${encodeURIComponent(currentUserId)}` : '/api/conversations';
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('فشل في جلب المحادثات');
    return res.json();
  },

  async findOrCreateConversation(data: {
    userId: string;
    userName: string;
    userEmail: string;
    orderId?: string;
  }): Promise<Conversation> {
    const res = await fetch('/api/conversations/find-or-create', {
      method: 'POST',
      headers: getHeaders(),
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

    const res = await fetch(url, { headers: getHeaders() });
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

    const res = await fetch(url, { headers: getHeaders() });
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
      senderId: string;
      senderName: string;
      senderRole: 'user' | 'admin';
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
    }
  ): Promise<MessageItem> {
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(messageData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل في إرسال الرسالة');
    }
    return res.json();
  },

  async editMessage(conversationId: string, messageId: string, text: string): Promise<MessageItem> {
    const res = await fetch(`/api/conversations/${conversationId}/messages/${messageId}`, {
      method: 'PUT',
      headers: getHeaders(),
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
    const res = await fetch(`/api/conversations/${conversationId}/messages/${messageId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل في حذف الرسالة');
    }
    return res.json();
  },

  async markConversationRead(conversationId: string): Promise<void> {
    try {
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: getHeaders(),
      });
    } catch {
      // silent
    }
  },

  async sendTyping(
    conversationId: string,
    isTyping: boolean,
    data: { userId: string; userName: string; role: 'admin' | 'user' }
  ): Promise<void> {
    try {
      await fetch(`/api/conversations/${conversationId}/typing`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ...data, isTyping }),
      });
    } catch {
      // silent
    }
  },

  async getUserPresence(userId: string): Promise<{ userId: string; isOnline: boolean; lastSeenAt: string }> {
    const res = await fetch(`/api/chat/presence/${encodeURIComponent(userId)}`, {
      headers: getHeaders(),
    });
    if (!res.ok) return { userId, isOnline: false, lastSeenAt: new Date().toISOString() };
    return res.json();
  },

  async getAdminPresenceStatus(): Promise<{ isOnline: boolean; statusText: string }> {
    const res = await fetch('/api/chat/presence-admin/status', {
      headers: getHeaders(),
    });
    if (!res.ok) return { isOnline: false, statusText: 'خدمة العملاء متاحة للرد' };
    return res.json();
  },

  async sendPresenceHeartbeat(userId: string, role: 'admin' | 'user'): Promise<void> {
    try {
      await fetch('/api/chat/presence', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId, role, isOnline: true }),
      });
    } catch {
      // silent
    }
  },

  // Realtime Server-Sent Events Chat Subscription
  subscribeChat(params: {
    userId: string;
    role: 'admin' | 'user';
    conversationId?: string;
    onMessage?: (msg: MessageItem) => void;
    onMessageUpdated?: (msg: MessageItem) => void;
    onMessagesRead?: (data: { conversationId: string; readAt: string; readByRole: string }) => void;
    onTyping?: (data: { conversationId: string; userId: string; userName: string; isTyping: boolean }) => void;
    onPresence?: (data: { userId: string; role: string; isOnline: boolean; lastSeenAt: string }) => void;
  }): () => void {
    const query = new URLSearchParams({
      userId: params.userId,
      role: params.role,
    });
    if (params.conversationId) query.set('convId', params.conversationId);

    const eventSource = new EventSource(`/api/chat/stream?${query.toString()}`);

    if (params.onMessage) {
      eventSource.addEventListener('message_created', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.message) params.onMessage!(data.message);
        } catch (err) {
          console.error('Failed to parse SSE message_created', err);
        }
      });
    }

    if (params.onMessageUpdated) {
      eventSource.addEventListener('message_updated', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.message) params.onMessageUpdated!(data.message);
        } catch (err) {
          console.error('Failed to parse SSE message_updated', err);
        }
      });
    }

    if (params.onMessagesRead) {
      eventSource.addEventListener('messages_read', (e) => {
        try {
          const data = JSON.parse(e.data);
          params.onMessagesRead!(data);
        } catch (err) {
          console.error('Failed to parse SSE messages_read', err);
        }
      });
    }

    if (params.onTyping) {
      eventSource.addEventListener('typing', (e) => {
        try {
          const data = JSON.parse(e.data);
          params.onTyping!(data);
        } catch (err) {
          console.error('Failed to parse SSE typing', err);
        }
      });
    }

    if (params.onPresence) {
      eventSource.addEventListener('presence', (e) => {
        try {
          const data = JSON.parse(e.data);
          params.onPresence!(data);
        } catch (err) {
          console.error('Failed to parse SSE presence', err);
        }
      });
    }

    return () => {
      eventSource.close();
    };
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    const url = currentUserId ? `/api/notifications?userId=${encodeURIComponent(currentUserId)}` : '/api/notifications';
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('فشل في جلب الإشعارات');
    return res.json();
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return res.json();
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    const url = currentUserId ? `/api/notifications/read-all?userId=${encodeURIComponent(currentUserId)}` : '/api/notifications/read-all';
    const res = await fetch(url, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return res.json();
  },

  // Users & Admin
  async syncUser(user: { id: string; name: string; email: string; photo?: string }): Promise<UserProfile> {
    const res = await fetch('/api/users/sync', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error('فشل في مزامنة بيانات المستخدم');
    return res.json();
  },

  async getAdminOverview(): Promise<{ kpi: DashboardOverviewKPI; recentOrders: OrderItem[] }> {
    const res = await fetch('/api/admin/overview', {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('غير مصرح بالوصول إلى لوحة التحكم');
    return res.json();
  },

  async getAdminUsers(): Promise<UserProfile[]> {
    const res = await fetch('/api/admin/users', {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('غير مصرح بالوصول إلى بيانات المستخدمين');
    return res.json();
  },
};

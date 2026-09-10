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

  async getMessages(conversationId: string): Promise<MessageItem[]> {
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('فشل في جلب الرسائل');
    return res.json();
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

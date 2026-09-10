export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photo?: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string;
  orderCount?: number;
}

export interface ServiceItem {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  image: string;
  basePrice: number;
  discountedPrice: number;
  isDiscounted: boolean;
  pricingType?: 'budget' | 'fixed';
  deliverables: string[];
  additionalInfo?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export type OrderStatus =
  | 'pending_review'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export interface OrderItem {
  id: string;
  orderNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  serviceId: string;
  serviceNameSnapshot: string;
  serviceImageSnapshot?: string;
  price: number;
  originalPrice?: number;
  customerRequirements: string;
  paymentMethod: string;
  senderWalletNumber?: string;
  paymentProof: string;
  paymentProofFilename?: string;
  status: OrderStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  orderId?: string;
  orderNumber?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadByAdmin?: number;
  unreadByUser?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessageReplyReference {
  id: string;
  senderName: string;
  type: 'text' | 'file' | 'audio' | 'image';
  text?: string;
  fileName?: string;
  isImage?: boolean;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  type: 'text' | 'file' | 'audio' | 'image';
  text?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isImage?: boolean;
  audioUrl?: string;
  audioDuration?: number;
  isDeleted?: boolean;
  isEdited?: boolean;
  editedAt?: string;
  replyTo?: MessageReplyReference;
  createdAt: string;
  readAt?: string;
}

export interface UserPresence {
  userId: string;
  role: 'admin' | 'user';
  isOnline: boolean;
  lastSeenAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'order_status' | 'new_message' | 'new_order' | 'new_user';
  title: string;
  body: string;
  relatedOrderId?: string;
  relatedConversationId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface PlatformSettings {
  walletName: string;
  walletNumber: string;
  adminEmail: string;
}

export interface DashboardOverviewKPI {
  totalUsers: number;
  totalServices: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  rejectedOrders: number;
}

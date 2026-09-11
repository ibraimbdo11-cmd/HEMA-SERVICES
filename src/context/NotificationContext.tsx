import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { NotificationItem } from '../types';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const activeUserRef = useRef<string | null>(null);

  const refreshNotifications = useCallback(async () => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const items = await api.getNotifications();
      // Ensure strict user isolation verification
      setNotifications(items);
      const unread = items.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Optimistic Mark Single Notification As Read
  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => {
      let wasUnread = false;
      const updated = prev.map((item) => {
        if (item.id === id && !item.isRead) {
          wasUnread = true;
          return { ...item, isRead: true };
        }
        return item;
      });
      if (wasUnread) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return updated;
    });

    try {
      await api.markNotificationRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read on server:', err);
      // Re-sync with server truth if mutation failed
      refreshNotifications();
    }
  }, [refreshNotifications]);

  // Optimistic Mark All Notifications As Read
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);

    try {
      await api.markAllNotificationsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read on server:', err);
      refreshNotifications();
    }
  }, [refreshNotifications]);

  // Lifecycle: Synchronize notifications & subscribe to Realtime SSE events
  useEffect(() => {
    const currentUid = currentUser?.uid || null;
    activeUserRef.current = currentUid;

    if (!currentUser) {
      // Immediate clean wipe on logout to prevent cross-account leakage
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let isSubscribed = true;

    // Fetch initial notifications for current authenticated user
    refreshNotifications();

    // Subscribe to realtime notification events (account-safe)
    const unsubscribe = api.subscribeChat({
      userId: currentUser.uid,
      role: isAdmin ? 'admin' : 'user',
      onNotification: (data) => {
        if (!isSubscribed) return;
        if (data?.notification) {
          const newNotif = data.notification;
          setNotifications((prev) => {
            // Deduplication check by notification ID
            if (prev.some((n) => n.id === newNotif.id)) {
              return prev;
            }
            if (!newNotif.isRead) {
              setUnreadCount((c) => c + 1);
            }
            return [newNotif, ...prev];
          });
        } else {
          refreshNotifications();
        }
      },
      onNotificationRead: (data) => {
        if (!isSubscribed) return;
        if (data?.notificationId) {
          setNotifications((prev) => {
            let wasUnread = false;
            const updated = prev.map((item) => {
              if (item.id === data.notificationId && !item.isRead) {
                wasUnread = true;
                return { ...item, isRead: true };
              }
              return item;
            });
            if (wasUnread) {
              setUnreadCount((c) => Math.max(0, c - 1));
            }
            return updated;
          });
        }
      },
      onNotificationsRead: () => {
        if (!isSubscribed) return;
        setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
        setUnreadCount(0);
      },
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [currentUser?.uid, isAdmin, refreshNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

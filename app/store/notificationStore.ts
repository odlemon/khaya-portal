import { create } from 'zustand';
import notificationsService from '@/app/services/notifications/notifications.service';
import type { AppNotification } from '@/app/services/notifications/notifications.types';
import { parseNotificationsList, parseUnreadCount } from '@/app/lib/notificationPayload';

function isNotificationRead(n: AppNotification): boolean {
  return Boolean(n.read ?? n.isRead);
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: (page?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  addNotification: (notification: AppNotification, options?: { suppressBadge?: boolean }) => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  fetchNotifications: async (page = 1) => {
    set({ loading: true, error: null });
    try {
      const response = await notificationsService.fetchNotifications(page);
      set({
        notifications: parseNotificationsList(response),
        loading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load notifications';
      set({ loading: false, error: message });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await notificationsService.fetchUnreadCount();
      set({ unreadCount: parseUnreadCount(response) });
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  },

  addNotification: (notification, options) => {
    const { notifications, unreadCount } = get();
    if (notifications.some((n) => n._id === notification._id)) return;

    const suppress =
      options?.suppressBadge ||
      notification.data?.suppressBanner === true;

    set({
      notifications: [notification, ...notifications].slice(0, 50),
      unreadCount: suppress || isNotificationRead(notification)
        ? unreadCount
        : unreadCount + 1,
    });
  },

  markRead: async (id) => {
    try {
      await notificationsService.markRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, read: true, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Error marking notification read:', error);
      throw error;
    }
  },

  markAllRead: async () => {
    try {
      await notificationsService.markAllRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Error marking all read:', error);
      throw error;
    }
  },
}));

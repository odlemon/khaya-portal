import { create } from 'zustand';
import notificationsService from '@/app/services/notifications/notifications.service';
import type {
  AppNotification,
  NotificationGroup,
  UnreadByGroup,
} from '@/app/services/notifications/notifications.types';
import {
  parseNotificationsList,
  parseUnreadCount,
  resolveNotificationGroup,
} from '@/app/lib/notificationPayload';

function isNotificationRead(n: AppNotification): boolean {
  return Boolean(n.read ?? n.isRead);
}

function sumUnread(byGroup: UnreadByGroup): number {
  return byGroup.messages + byGroup.actions;
}

function findInLists(
  messages: AppNotification[],
  actions: AppNotification[],
  id: string
): AppNotification | undefined {
  return messages.find((n) => n._id === id) ?? actions.find((n) => n._id === id);
}

interface NotificationState {
  messages: AppNotification[];
  actions: AppNotification[];
  unreadByGroup: UnreadByGroup;
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchUnreadCount: () => Promise<void>;
  fetchGroup: (group: NotificationGroup, page?: number) => Promise<void>;
  /** @deprecated use fetchGroup — kept for any leftover callers */
  fetchNotifications: (page?: number) => Promise<void>;
  addNotification: (notification: AppNotification, options?: { suppressBadge?: boolean }) => void;
  markRead: (id: string) => Promise<void>;
  markGroupRead: (group: NotificationGroup) => Promise<void>;
  /** @deprecated use markGroupRead — clears both groups */
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  messages: [],
  actions: [],
  unreadByGroup: { messages: 0, actions: 0 },
  unreadCount: 0,
  loading: false,
  error: null,

  fetchUnreadCount: async () => {
    try {
      const response = await notificationsService.fetchUnreadCount();
      const parsed = parseUnreadCount(response);
      set({
        unreadByGroup: parsed.byGroup,
        unreadCount: parsed.unreadCount,
      });
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  },

  fetchGroup: async (group, page = 1) => {
    set({ loading: true, error: null });
    try {
      const response = await notificationsService.fetchNotifications(page, 20, { group });
      const items = parseNotificationsList(response);
      set({
        ...(group === 'messages' ? { messages: items } : { actions: items }),
        loading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load notifications';
      set({ loading: false, error: message });
    }
  },

  fetchNotifications: async (page = 1) => {
    await get().fetchGroup('actions', page);
  },

  addNotification: (notification, options) => {
    const state = get();
    if (
      state.messages.some((n) => n._id === notification._id) ||
      state.actions.some((n) => n._id === notification._id)
    ) {
      return;
    }

    const group = resolveNotificationGroup(notification);
    const suppress =
      options?.suppressBadge ||
      notification.data?.suppressBanner === true ||
      isNotificationRead(notification);

    const listKey = group === 'messages' ? 'messages' : 'actions';
    const nextList = [notification, ...state[listKey]].slice(0, 50);

    let unreadByGroup = { ...state.unreadByGroup };
    if (!suppress) {
      unreadByGroup = {
        ...unreadByGroup,
        [group]: unreadByGroup[group] + 1,
      };
    }

    set({
      [listKey]: nextList,
      unreadByGroup,
      unreadCount: sumUnread(unreadByGroup),
    });
  },

  markRead: async (id) => {
    const existing = findInLists(get().messages, get().actions, id);
    const wasUnread = existing ? !isNotificationRead(existing) : true;
    const group = existing ? resolveNotificationGroup(existing) : null;

    try {
      await notificationsService.markRead(id);
      set((state) => {
        const mark = (n: AppNotification) =>
          n._id === id ? { ...n, read: true, isRead: true } : n;

        let unreadByGroup = { ...state.unreadByGroup };
        if (wasUnread && group) {
          unreadByGroup = {
            ...unreadByGroup,
            [group]: Math.max(0, unreadByGroup[group] - 1),
          };
        }

        return {
          messages: state.messages.map(mark),
          actions: state.actions.map(mark),
          unreadByGroup,
          unreadCount: sumUnread(unreadByGroup),
        };
      });
    } catch (error) {
      console.error('Error marking notification read:', error);
      throw error;
    }
  },

  markGroupRead: async (group) => {
    try {
      await notificationsService.markAllRead(group);
      set((state) => {
        const markAll = (n: AppNotification) => ({ ...n, read: true, isRead: true });
        const unreadByGroup = {
          ...state.unreadByGroup,
          [group]: 0,
        };
        return {
          ...(group === 'messages'
            ? { messages: state.messages.map(markAll) }
            : { actions: state.actions.map(markAll) }),
          unreadByGroup,
          unreadCount: sumUnread(unreadByGroup),
        };
      });
      await get().fetchGroup(group);
    } catch (error) {
      console.error('Error marking group read:', error);
      throw error;
    }
  },

  markAllRead: async () => {
    try {
      await notificationsService.markAllRead();
      set((state) => ({
        messages: state.messages.map((n) => ({ ...n, read: true, isRead: true })),
        actions: state.actions.map((n) => ({ ...n, read: true, isRead: true })),
        unreadByGroup: { messages: 0, actions: 0 },
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Error marking all read:', error);
      throw error;
    }
  },
}));

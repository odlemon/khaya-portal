import type { AppNotification } from '@/app/services/notifications/notifications.types';

/** Normalize socket/API notification payloads (wrapped or raw). */
export function parseNotificationPayload(payload: unknown): AppNotification | null {
  if (!payload || typeof payload !== 'object') return null;
  const o = payload as Record<string, unknown>;

  if (o.notification && typeof o.notification === 'object') {
    return o.notification as AppNotification;
  }

  if (typeof o._id === 'string' && (typeof o.title === 'string' || typeof o.body === 'string')) {
    return o as unknown as AppNotification;
  }

  return null;
}

/** Backend may return unreadCount, count, or unread. */
export function parseUnreadCount(data: unknown): number {
  if (!data || typeof data !== 'object') return 0;
  const d = data as Record<string, unknown>;
  const inner = d.data && typeof d.data === 'object' ? (d.data as Record<string, unknown>) : d;

  if (typeof inner.unreadCount === 'number') return inner.unreadCount;
  if (typeof inner.count === 'number') return inner.count;
  if (typeof inner.unread === 'number') return inner.unread;
  return 0;
}

/** Backend may return items[] or notifications[]. */
export function parseNotificationsList(data: unknown): AppNotification[] {
  if (!data || typeof data !== 'object') return [];
  const d = data as Record<string, unknown>;
  const inner = d.data && typeof d.data === 'object' ? (d.data as Record<string, unknown>) : d;

  if (Array.isArray(inner.items)) return inner.items as AppNotification[];
  if (Array.isArray(inner.notifications)) return inner.notifications as AppNotification[];
  return [];
}

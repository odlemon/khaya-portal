import type {
  AppNotification,
  NotificationGroup,
  UnreadByGroup,
  UnreadCountData,
} from '@/app/services/notifications/notifications.types';

const MESSAGE_TYPES = new Set([
  'new_message',
  'viewing_request',
  'move_in_request',
  'viewing_response',
  'move_in_response',
  'chat',
  'chat_notification',
]);

/** Map legacy rows (no group) by type: chat-ish → messages, else → actions. */
export function inferGroupFromType(type?: string): NotificationGroup {
  if (!type) return 'actions';
  if (MESSAGE_TYPES.has(type)) return 'messages';
  return 'actions';
}

export function resolveNotificationGroup(n: AppNotification): NotificationGroup {
  if (n.group === 'messages' || n.group === 'actions') return n.group;
  return inferGroupFromType(n.type);
}

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

/** Backend may return unreadCount + byGroup, or legacy count/unread. */
export function parseUnreadCount(data: unknown): UnreadCountData {
  const empty: UnreadCountData = {
    unreadCount: 0,
    byGroup: { messages: 0, actions: 0 },
  };

  if (!data || typeof data !== 'object') return empty;
  const d = data as Record<string, unknown>;
  const inner = d.data && typeof d.data === 'object' ? (d.data as Record<string, unknown>) : d;

  const byGroupRaw =
    inner.byGroup && typeof inner.byGroup === 'object'
      ? (inner.byGroup as Partial<UnreadByGroup>)
      : {};

  const byGroup: UnreadByGroup = {
    messages: typeof byGroupRaw.messages === 'number' ? byGroupRaw.messages : 0,
    actions: typeof byGroupRaw.actions === 'number' ? byGroupRaw.actions : 0,
  };

  let unreadCount = 0;
  if (typeof inner.unreadCount === 'number') {
    unreadCount = inner.unreadCount;
  } else if (typeof inner.count === 'number') {
    unreadCount = inner.count;
  } else if (typeof inner.unread === 'number') {
    unreadCount = inner.unread;
  } else {
    unreadCount = byGroup.messages + byGroup.actions;
  }

  // Legacy total-only response: put all unread under actions so badges still work
  if (
    byGroup.messages === 0 &&
    byGroup.actions === 0 &&
    unreadCount > 0 &&
    !inner.byGroup
  ) {
    byGroup.actions = unreadCount;
  }

  return { unreadCount, byGroup };
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

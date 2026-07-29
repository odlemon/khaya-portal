import type { AppNotification } from '@/app/services/notifications/notifications.types';
import { resolveNotificationGroup } from '@/app/lib/notificationPayload';

const CHAT_TYPES = new Set([
  'new_message',
  'viewing_request',
  'move_in_request',
  'viewing_response',
  'move_in_response',
  'chat',
  'chat_notification',
]);

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/**
 * Map notification type/data to a portal route, or null if no navigation.
 */
export function getNotificationHref(n: AppNotification): string | null {
  const type = n.type;
  const data = n.data ?? {};
  const chatId = asString(data.chatId);
  const path = asString(data.path);

  if (path) {
    // Only allow in-app relative paths that match known admin routes
    if (path.startsWith('/') && !path.startsWith('//')) {
      const mapped = mapBackendPath(path);
      if (mapped) return mapped;
    }
  }

  if (type && CHAT_TYPES.has(type)) {
    return chatId ? `/messages?chat=${encodeURIComponent(chatId)}` : '/messages';
  }

  if (resolveNotificationGroup(n) === 'messages' && chatId) {
    return `/messages?chat=${encodeURIComponent(chatId)}`;
  }

  switch (type) {
    case 'property_submitted':
      return '/incoming-requests';
    case 'document_verification_submitted':
      return '/incoming-requests';
    case 'agreement_completed':
      return '/agreements';
    default:
      return null;
  }
}

/** Translate backend admin paths to portal routes when possible. */
function mapBackendPath(path: string): string | null {
  if (path.startsWith('/admin/chat/') || path.startsWith('/admin/chats/')) {
    const chatId = path.split('/').pop();
    return chatId ? `/messages?chat=${encodeURIComponent(chatId)}` : '/messages';
  }
  if (path.includes('verif') || path === '/admin/verifications') {
    return '/incoming-requests';
  }
  if (path.startsWith('/admin/agreements')) {
    return '/agreements';
  }
  if (path.startsWith('/admin/properties')) {
    return '/incoming-requests';
  }
  // Already a portal path
  if (
    path.startsWith('/messages') ||
    path.startsWith('/incoming-requests') ||
    path.startsWith('/agreements') ||
    path.startsWith('/properties')
  ) {
    return path;
  }
  return null;
}

import { socketService } from '@/app/lib/socket';
import { parseNotificationPayload } from '@/app/lib/notificationPayload';
import { useChatStore } from '@/app/store/chatStore';
import { useNotificationStore } from '@/app/store/notificationStore';
import type { Message } from '@/app/services/chat/types';

let listenersRegistered = false;

function parseNewMessagePayload(payload: unknown): { chatId: string; message: Message } | null {
  if (!payload || typeof payload !== 'object') return null;
  const data = payload as Record<string, unknown>;

  if (data.chatId && data.message && typeof data.message === 'object') {
    return { chatId: String(data.chatId), message: data.message as Message };
  }

  const asMessage = data as unknown as Message;
  if (asMessage._id && asMessage.chatId) {
    return { chatId: String(asMessage.chatId), message: asMessage };
  }

  if (data.chatId && data._id) {
    return { chatId: String(data.chatId), message: data as unknown as Message };
  }

  return null;
}

/**
 * Register global socket listeners once. Handlers persist in socketService
 * and are re-attached automatically on reconnect.
 */
export function ensureRealtimeListeners() {
  if (listenersRegistered) return;
  listenersRegistered = true;

  socketService.on('new_message', (payload: unknown) => {
    const parsed = parseNewMessagePayload(payload);
    if (process.env.NODE_ENV === 'development') {
      console.log('[portal] new_message', parsed?.chatId ?? payload);
    }
    if (parsed) {
      useChatStore.getState().handleNewMessage(parsed.chatId, parsed.message);
      return;
    }
    if (process.env.NODE_ENV === 'development') {
      console.warn('[portal] new_message payload unrecognized', payload);
    }
  });

  const ingestNotification = (payload: unknown) => {
    const notification = parseNotificationPayload(payload);
    if (!notification) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[portal] notification payload unrecognized', payload);
      }
      return;
    }
    if (process.env.NODE_ENV === 'development') {
      console.log('[portal] notification_created', notification._id);
    }
    const activeChatId = useChatStore.getState().activeChatId;
    const suppress =
      notification.data?.chatId != null && notification.data.chatId === activeChatId;
    useNotificationStore.getState().addNotification(notification, { suppressBadge: suppress });
  };

  socketService.on('notification_created', ingestNotification);
  socketService.on('chat_notification', ingestNotification);

  socketService.on('user_typing', (payload: unknown) => {
    const data = payload as { chatId?: string; userId?: string; isTyping?: boolean };
    if (data.chatId && data.userId != null) {
      useChatStore.getState().setTyping(data.chatId, data.userId, Boolean(data.isTyping));
    }
  });

  socketService.on('messages_read', (payload: unknown) => {
    const data = payload as { chatId?: string; messageIds?: string[] };
    if (data.chatId && data.messageIds) {
      useChatStore.getState().applyMessagesRead(data.chatId, data.messageIds);
    }
  });

  socketService.on('socket_error', (payload: unknown) => {
    const data = payload as { message?: string; chatId?: string };
    console.error('[portal] socket_error', data.chatId, data.message);
  });
}

export function resetRealtimeListeners() {
  listenersRegistered = false;
}

export function bootstrapRealtime(token: string) {
  ensureRealtimeListeners();
  socketService.connect(token);
}

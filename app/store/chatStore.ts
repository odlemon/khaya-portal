import { create } from 'zustand';
import chatService from '@/app/services/chat/chat.service';
import type { Chat, Message } from '@/app/services/chat/types';
import { socketService } from '@/app/lib/socket';
import { getToken } from '@/app/lib/authSession';
import { isKhayalamiAdminRole } from '@/app/lib/portals';

function getCurrentUserId(): string | null {
  const token = getToken();
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(
      decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
    );
    return payload.userId || payload._id || payload.id || null;
  } catch {
    return null;
  }
}

function bumpChatPreview(chats: Chat[], chatId: string, message: Message): Chat[] {
  const lastMessage = {
    content: message.content,
    senderId:
      typeof message.senderId === 'object' && message.senderId
        ? message.senderId._id
        : String(message.senderId),
    timestamp: message.createdAt,
  };

  const existing = chats.find((c) => c._id === chatId);
  if (existing) {
    const updated = chats.map((chat) =>
      chat._id === chatId
        ? { ...chat, lastMessage, updatedAt: message.createdAt }
        : chat
    );
    return [...updated].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  return chats;
}

function processMessage(message: Message, forceMine?: boolean): Message {
  const userId = getCurrentUserId();
  const senderId =
    typeof message.senderId === 'object' && message.senderId
      ? message.senderId._id
      : (message.senderId as unknown as string);
  const isMine =
    forceMine !== undefined
      ? forceMine
      : isKhayalamiAdminRole(message.senderRole) ||
        Boolean(userId && senderId && String(userId) === String(senderId));
  const senderRole =
    message.senderRole ||
    (forceMine || isMine ? 'admin' : message.senderRole);
  return { ...message, senderRole, isMine: Boolean(isMine) };
}

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  activeChatId: string | null;
  messages: Message[];
  unreadByChatId: Record<string, number>;
  typingByChatId: Record<string, string | null>;
  isLoading: boolean;
  error: string | null;
  loadAllChats: (page?: number) => Promise<void>;
  openChat: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, content: string) => Promise<void>;
  handleNewMessage: (chatId: string, message: Message) => void;
  setTyping: (chatId: string, userId: string, isTyping: boolean) => void;
  applyMessagesRead: (chatId: string, messageIds: string[]) => void;
  clearActiveChat: () => void;
  clearUnread: (chatId: string) => void;
  setMessages: (messages: Message[]) => void;
  /** @deprecated use openChat */
  loadChatById: (chatId: string) => Promise<void>;
  /** @deprecated use clearActiveChat */
  clearCurrentChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChat: null,
  activeChatId: null,
  messages: [],
  unreadByChatId: {},
  typingByChatId: {},
  isLoading: false,
  error: null,

  loadAllChats: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const response = await chatService.getAllChats(page);
      set({ chats: response.data.chats, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load chats';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  openChat: async (chatId: string) => {
    set({ isLoading: true, error: null, activeChatId: chatId });
    try {
      await chatService.joinChat(chatId);
      const response = await chatService.getChatMessages(chatId);
      const processedMessages = (response.data.messages || []).map((m: Message) => processMessage(m));

      set({
        currentChat: response.data.chat,
        messages: processedMessages,
        isLoading: false,
        unreadByChatId: { ...get().unreadByChatId, [chatId]: 0 },
      });

      socketService.joinChat(chatId);
      socketService.markRead(chatId);
      await chatService.markChatRead(chatId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load chat';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  loadChatById: async (chatId: string) => {
    return get().openChat(chatId);
  },

  sendMessage: async (chatId: string, content: string) => {
    const response = await chatService.sendMessage(chatId, content);
    const newMessage = processMessage(response.data, true);
    const { messages, chats } = get();
    if (!messages.some((m) => m._id === newMessage._id)) {
      set({
        messages: [...messages, newMessage],
        chats: bumpChatPreview(chats, chatId, newMessage),
      });
    } else {
      set({ chats: bumpChatPreview(chats, chatId, newMessage) });
    }
    socketService.stopTyping(chatId);
  },

  handleNewMessage: (chatId: string, rawMessage: Message) => {
    const message = processMessage(rawMessage);
    const currentUserId = getCurrentUserId();
    const senderId =
      typeof message.senderId === 'object' && message.senderId
        ? message.senderId._id
        : (message.senderId as unknown as string);
    const isOwnMessage = Boolean(currentUserId && senderId === currentUserId);

    const state = get();
    let nextMessages = state.messages;
    let nextUnread = state.unreadByChatId;

    if (state.activeChatId === chatId) {
      const exists = state.messages.some((m) => m._id === message._id);
      if (!exists) {
        nextMessages = [...state.messages, message];
      }
    } else if (!isOwnMessage && !message.isMine) {
      nextUnread = {
        ...state.unreadByChatId,
        [chatId]: (state.unreadByChatId[chatId] || 0) + 1,
      };
    }

    if (state.chats.some((c) => c._id === chatId)) {
      set({
        messages: nextMessages,
        unreadByChatId: nextUnread,
        chats: bumpChatPreview(state.chats, chatId, message),
      });
    } else {
      set({ messages: nextMessages, unreadByChatId: nextUnread });
      get().loadAllChats().catch(() => {});
    }
  },

  setTyping: (chatId: string, userId: string, isTyping: boolean) => {
    const currentUserId = getCurrentUserId();
    if (userId === currentUserId) return;

    set({
      typingByChatId: {
        ...get().typingByChatId,
        [chatId]: isTyping ? userId : null,
      },
    });
  },

  applyMessagesRead: (chatId: string, messageIds: string[]) => {
    if (get().activeChatId !== chatId) return;
    const idSet = new Set(messageIds);
    set({
      messages: get().messages.map((m) =>
        idSet.has(m._id) ? { ...m, read: true } : m
      ),
    });
  },

  clearUnread: (chatId: string) => {
    set({
      unreadByChatId: { ...get().unreadByChatId, [chatId]: 0 },
    });
  },

  clearActiveChat: () => {
    const { activeChatId } = get();
    if (activeChatId) {
      socketService.leaveChat(activeChatId);
    }
    set({
      currentChat: null,
      activeChatId: null,
      messages: [],
    });
  },

  clearCurrentChat: () => {
    get().clearActiveChat();
  },

  setMessages: (messages: Message[]) => {
    set({ messages });
  },
}));

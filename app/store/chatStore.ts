// @ts-nocheck
import { create } from 'zustand';
import { API_CONFIG } from '@/app/config/api.config';
import { socketService } from '@/app/lib/socket';

// Helper to get auth token
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

// Helper to make authenticated fetch requests
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

interface Message {
  _id: string;
  senderId: any;
  senderRole: string;
  content: string;
  visibleTo?: string[];
  taggedUser?: string;
  isMine: boolean;
  isPrivate: boolean;
  createdAt: string;
}

interface Chat {
  _id: string;
  participants: any[];
  propertyId: any;
  lastMessage?: any;
  isActive: boolean;
  updatedAt: string;
  createdAt: string;
}

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  loadAllChats: (page?: number) => Promise<void>;
  joinChat: (chatId: string) => Promise<void>;
  loadChatById: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, content: string) => Promise<void>;
  setMessages: (messages: Message[]) => void;
  initSocketListeners: () => void;
  clearCurrentChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChat: null,
  messages: [],
  isLoading: false,
  error: null,

  loadAllChats: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithAuth(`${API_CONFIG.baseUrl}/chat/admin/all-chats?page=${page}&limit=50`);
      console.log('Chats response:', response);
      set({ chats: response.data.chats, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to load chats' 
      });
      console.error('Error loading chats:', error);
      throw error;
    }
  },

  joinChat: async (chatId: string) => {
    try {
      await fetchWithAuth(`${API_CONFIG.baseUrl}/chat/admin/join/${chatId}`, {
        method: 'POST',
      });
      console.log('Joined chat:', chatId);
    } catch (error: any) {
      console.error('Error joining chat:', error);
      // Don't throw error if already joined
      if (!error.message?.includes('already')) {
        throw error;
      }
    }
  },

  loadChatById: async (chatId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Join chat first (if not already joined)
      await get().joinChat(chatId);

      // Load messages
      const response = await fetchWithAuth(`${API_CONFIG.baseUrl}/chat/${chatId}`);
      console.log('Chat response:', response);
      
      // Process messages to ensure correct direction
      const processedMessages = (response.data.messages || []).map((message: any) => ({
        ...message,
        isMine: message.senderRole === 'landlord' || message.senderRole === 'admin'
      }));
      
      set({
        currentChat: response.data.chat,
        messages: processedMessages,
        isLoading: false,
      });

      // Join socket room
      socketService.joinChat(chatId);
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to load chat' 
      });
      console.error('Error loading chat:', error);
      throw error;
    }
  },

  sendMessage: async (chatId: string, content: string) => {
    try {
      const response = await fetchWithAuth(`${API_CONFIG.baseUrl}/chat/${chatId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      
      // Add to messages if not already added by socket
      const newMessage = response.data;
      const messages = get().messages;
      if (!messages.some(m => m._id === newMessage._id)) {
        // Ensure message direction is set correctly for sent messages
        const processedMessage = {
          ...newMessage,
          isMine: true // Sent messages are always from current user
        };
        set({ messages: [...messages, processedMessage] });
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  initSocketListeners: () => {
    socketService.onNewMessage((data) => {
      const { chatId, message } = data;
      const currentChat = get().currentChat;

      if (currentChat?._id === chatId) {
        const messages = get().messages;
        const exists = messages.some(m => m._id === message._id);
        if (!exists) {
          // Ensure message direction is set correctly
          const processedMessage = {
            ...message,
            isMine: message.senderRole === 'landlord' || message.senderRole === 'admin'
          };
          set({ messages: [...messages, processedMessage] });
        }
      }
      
      // Update last message in chats list
      const chats = get().chats;
      const updatedChats = chats.map(chat => {
        if (chat._id === chatId) {
          return {
            ...chat,
            lastMessage: message,
            updatedAt: message.createdAt
          };
        }
        return chat;
      });
      set({ chats: updatedChats });
    });
  },

  clearCurrentChat: () => {
    const currentChat = get().currentChat;
    if (currentChat) {
      socketService.leaveChat(currentChat._id);
    }
    set({ currentChat: null, messages: [] });
  },

  setMessages: (messages: Message[]) => {
    set({ messages });
  },
}));


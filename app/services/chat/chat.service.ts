// @ts-nocheck
import { API_CONFIG } from '@/app/config/api.config';

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

export interface ChatParticipant {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface Property {
  _id: string;
  title: string;
  address: {
    street: string;
    city: string;
    state?: string;
    zipCode?: string;
  };
  images?: string[];
}

export interface LastMessage {
  content: string;
  senderId: string;
  timestamp: string;
}

export interface Chat {
  _id: string;
  participants: ChatParticipant[];
  propertyId: Property;
  lastMessage?: LastMessage;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  chatId: string;
  senderId: ChatParticipant;
  senderRole: string;
  content: string;
  visibleTo?: string[];
  taggedUser?: string;
  isMine: boolean;
  isPrivate: boolean;
  createdAt: string;
}

export interface AllChatsResponse {
  success: boolean;
  message: string;
  data: {
    chats: Chat[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface ChatResponse {
  success: boolean;
  message: string;
  data: {
    chat: Chat;
    messages: Message[];
  };
}

export interface MessageResponse {
  success: boolean;
  message: string;
  data: Message;
}

class ChatService {
  /**
   * Get all chats in the system (Admin only)
   */
  async getAllChats(page: number = 1, limit: number = 50): Promise<AllChatsResponse> {
    return await fetchWithAuth(`${API_CONFIG.baseUrl}/chat/admin/all-chats?page=${page}&limit=${limit}`);
  }

  /**
   * Admin joins a specific chat
   */
  async joinChat(chatId: string): Promise<void> {
    return await fetchWithAuth(`${API_CONFIG.baseUrl}/chat/admin/join/${chatId}`, {
      method: 'POST',
    });
  }

  /**
   * Get chat messages
   */
  async getChatMessages(chatId: string): Promise<ChatResponse> {
    return await fetchWithAuth(`${API_CONFIG.baseUrl}/chat/${chatId}`);
  }

  /**
   * Send a message in a chat
   */
  async sendMessage(chatId: string, content: string): Promise<MessageResponse> {
    return await fetchWithAuth(`${API_CONFIG.baseUrl}/chat/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }
}

const chatService = new ChatService();
export default chatService;


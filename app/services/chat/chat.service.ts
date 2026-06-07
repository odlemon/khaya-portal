import { API_CONFIG } from '@/app/config/api.config';
import { authenticatedFetchJson } from '@/app/lib/authenticatedFetch';
import type {
  AllChatsResponse,
  ChatResponse,
  MessageResponse,
} from './types';

async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  return authenticatedFetchJson<T>(url, { ...options, headers });
}

class ChatService {
  async getAllChats(page = 1, limit = 50): Promise<AllChatsResponse> {
    return fetchWithAuth(
      `${API_CONFIG.baseUrl}/chat/admin/all-chats?page=${page}&limit=${limit}`
    );
  }

  async joinChat(chatId: string): Promise<void> {
    try {
      await fetchWithAuth(`${API_CONFIG.baseUrl}/chat/admin/join/${chatId}`, {
        method: 'POST',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (!message.toLowerCase().includes('already')) {
        throw error;
      }
    }
  }

  async getChatMessages(chatId: string): Promise<ChatResponse> {
    return fetchWithAuth(`${API_CONFIG.baseUrl}/chat/${chatId}`);
  }

  async sendMessage(chatId: string, content: string): Promise<MessageResponse> {
    return fetchWithAuth(`${API_CONFIG.baseUrl}/chat/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async markChatRead(chatId: string): Promise<void> {
    try {
      await fetchWithAuth(`${API_CONFIG.baseUrl}/chat/${chatId}/read`, {
        method: 'PUT',
      });
    } catch {
      // Optional endpoint — ignore if not implemented
    }
  }
}

const chatService = new ChatService();
export default chatService;

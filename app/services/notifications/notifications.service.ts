import { API_CONFIG } from '@/app/config/api.config';
import { authenticatedFetchJson } from '@/app/lib/authenticatedFetch';
import type {
  AppNotification,
  NotificationsListResponse,
  UnreadCountResponse,
} from './notifications.types';

async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  return authenticatedFetchJson<T>(url, { ...options, headers });
}

class NotificationsService {
  async fetchNotifications(page = 1, limit = 20): Promise<NotificationsListResponse> {
    return fetchWithAuth(
      `${API_CONFIG.baseUrl}/notifications?page=${page}&limit=${limit}`
    );
  }

  async fetchUnreadCount(): Promise<UnreadCountResponse> {
    return fetchWithAuth(`${API_CONFIG.baseUrl}/notifications/unread-count`);
  }

  async markRead(id: string): Promise<{ success: boolean; data?: AppNotification }> {
    return fetchWithAuth(`${API_CONFIG.baseUrl}/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllRead(): Promise<{ success: boolean }> {
    return fetchWithAuth(`${API_CONFIG.baseUrl}/notifications/read-all`, {
      method: 'PUT',
    });
  }
}

const notificationsService = new NotificationsService();
export default notificationsService;

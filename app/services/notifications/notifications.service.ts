import { API_CONFIG } from '@/app/config/api.config';
import { authenticatedFetchJson } from '@/app/lib/authenticatedFetch';
import type {
  AppNotification,
  FetchNotificationsOptions,
  NotificationGroup,
  NotificationsListResponse,
  UnreadCountResponse,
} from './notifications.types';

async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  return authenticatedFetchJson<T>(url, { ...options, headers });
}

class NotificationsService {
  async fetchNotifications(
    page = 1,
    limit = 20,
    options: FetchNotificationsOptions = {}
  ): Promise<NotificationsListResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (options.group) params.set('group', options.group);
    if (options.unreadOnly) params.set('unreadOnly', 'true');

    return fetchWithAuth(
      `${API_CONFIG.baseUrl}/notifications?${params.toString()}`
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

  async markAllRead(group?: NotificationGroup): Promise<{ success: boolean }> {
    const qs = group ? `?group=${group}` : '';
    return fetchWithAuth(`${API_CONFIG.baseUrl}/notifications/read-all${qs}`, {
      method: 'PUT',
    });
  }
}

const notificationsService = new NotificationsService();
export default notificationsService;

export type NotificationGroup = 'messages' | 'actions';

export interface NotificationData {
  chatId?: string;
  messageId?: string;
  landlordId?: string;
  propertyId?: string;
  userId?: string;
  agreementId?: string;
  role?: string;
  path?: string;
  suppressBanner?: boolean;
  [key: string]: unknown;
}

export interface AppNotification {
  _id: string;
  title: string;
  body: string;
  type?: string;
  group?: NotificationGroup;
  read?: boolean;
  isRead?: boolean;
  data?: NotificationData;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationsListResponse {
  success: boolean;
  data: {
    items?: AppNotification[];
    notifications?: AppNotification[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface UnreadByGroup {
  messages: number;
  actions: number;
}

export interface UnreadCountData {
  unreadCount: number;
  byGroup: UnreadByGroup;
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount?: number;
    count?: number;
    unread?: number;
    byGroup?: Partial<UnreadByGroup>;
  };
}

export interface FetchNotificationsOptions {
  group?: NotificationGroup;
  unreadOnly?: boolean;
}

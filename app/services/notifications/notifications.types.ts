export interface NotificationData {
  chatId?: string;
  suppressBanner?: boolean;
  [key: string]: unknown;
}

export interface AppNotification {
  _id: string;
  title: string;
  body: string;
  type?: string;
  read?: boolean;
  isRead?: boolean;
  data?: NotificationData;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationsListResponse {
  success: boolean;
  data: {
    notifications: AppNotification[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

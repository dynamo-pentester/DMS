export interface Notification {
  notificationId: number;
  title: string;
  message: string;
  notificationType: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityId?: number;
}

export interface NotificationSearchParams {
  onlyUnread?: boolean;
  page?: number;
  pageSize?: number;
}

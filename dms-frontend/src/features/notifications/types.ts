// Mirrors DriverDms.Application.DTOs.NotificationDtos.cs exactly.

export interface NotificationDto {
  notificationId: number;
  entityTypeName: string;
  entityId: number;
  title: string;
  message: string;
  dueDate: string;
  statusName: string;
  createdAt: string;
  dismissedAt?: string | null;
}

export interface NotificationSearchRequest {
  status?: string;
  entityType?: string;
  page: number;
  pageSize: number;
}

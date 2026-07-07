import { axiosClient } from '@/api/axiosClient';
import { PagedResult } from '@/types/common';
import { NotificationDto, NotificationSearchRequest } from './types';

// Matches NotificationsController exactly: GET on /api/notifications
// and PATCH /api/notifications/:id/dismiss. No POST — notifications are
// raised internally by the backend ExpiryAlertJob.
export const notificationsService = {
  search: (params: NotificationSearchRequest) =>
    axiosClient.get<PagedResult<NotificationDto>>('/notifications', { params }).then((r) => r.data),

  getById: (id: number) =>
    axiosClient.get<NotificationDto>(`/notifications/${id}`).then((r) => r.data),

  dismiss: (id: number) =>
    axiosClient.patch(`/notifications/${id}/dismiss`),
};

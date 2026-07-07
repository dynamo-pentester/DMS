import { api } from "@/api/axiosInstance";
import type { Notification, NotificationSearchParams } from "@/types/notification";

export const notificationService = {
  /** Get all notifications (optionally only unread) */
  getAll: async (params?: NotificationSearchParams): Promise<{ items: Notification[]; totalCount: number }> => {
    const { data } = await api.get<any>("/notifications", { params });
    // Handle both array and paged response shapes
    if (Array.isArray(data)) return { items: data, totalCount: data.length };
    return { items: data.items ?? data, totalCount: data.totalCount ?? (data.items?.length ?? 0) };
  },

  /** Mark a single notification as read */
  markAsRead: async (id: number): Promise<void> => {
    await api.patch(`/notifications/${id}/mark-as-read`);
  },

  /** Mark all notifications as read */
  markAllAsRead: async (): Promise<void> => {
    await api.patch("/notifications/mark-all-as-read");
  },

  /** Dismiss / delete a notification */
  dismiss: async (id: number): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },

  /** Get unread count for the bell badge */
  getUnreadCount: async (): Promise<number> => {
    try {
      const { data } = await api.get<{ count: number }>("/notifications/unread-count");
      return data.count ?? 0;
    } catch {
      return 0;
    }
  },
};

export default notificationService;

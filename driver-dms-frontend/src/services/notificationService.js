import api from "./api";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

export const getNotification = (id) =>
  api.get(`${API_ENDPOINTS.NOTIFICATIONS}/${id}`);

// params: { status, entityType, page, pageSize }
// No create endpoint on purpose - notifications are raised internally by ExpiryAlertJob.
export const searchNotifications = (params) =>
  api.get(API_ENDPOINTS.NOTIFICATIONS, { params });

export const dismissNotification = (id) =>
  api.patch(`${API_ENDPOINTS.NOTIFICATIONS}/${id}/dismiss`);

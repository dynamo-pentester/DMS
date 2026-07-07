// License/MedicalRecord/Training DTOs each return a computed `status` field
// ("Valid" | "Expiring" | "Expired") from the backend's status resolvers -
// never recompute these dates on the frontend, just display/filter by the string.
export const RECORD_STATUS = {
  VALID: "Valid",
  EXPIRING: "Expiring",
  EXPIRED: "Expired",
};

export const RECORD_STATUS_OPTIONS = Object.values(RECORD_STATUS);

// Notification.status comes from the NotificationStatuses lookup table
// (Pending/Sent/Dismissed/Expired) - Notifications only support dismiss, no create.
export const NOTIFICATION_STATUS = {
  PENDING: "Pending",
  SENT: "Sent",
  DISMISSED: "Dismissed",
  EXPIRED: "Expired",
};

export const STATUS_COLORS = {
  [RECORD_STATUS.VALID]: "#16a34a",
  [RECORD_STATUS.EXPIRING]: "#d97706",
  [RECORD_STATUS.EXPIRED]: "#dc2626",
  [NOTIFICATION_STATUS.PENDING]: "#2563eb",
  [NOTIFICATION_STATUS.SENT]: "#16a34a",
  [NOTIFICATION_STATUS.DISMISSED]: "#6b7280",
};

export function statusColor(status) {
  return STATUS_COLORS[status] || "#6b7280";
}

using DriverDms.Application.DTOs;

namespace DriverDms.Application.Interfaces;

public interface INotificationService
{
    Task<NotificationDto?> GetByIdAsync(int notificationId);
    Task<PagedResult<NotificationDto>> SearchAsync(NotificationSearchRequest request);
    Task DismissAsync(int notificationId);
    Task MarkAsReadAsync(int notificationId);
    Task MarkAllAsReadAsync();
    Task<int> GetUnreadCountAsync();
    Task DeleteAsync(int notificationId);

    /// <summary>
    /// Used internally by ExpiryAlertJob (and any future producer). Dedupes against
    /// an existing non-dismissed notification for the same entity type + entity id,
    /// so a daily job doesn't create a fresh row every single run for the same
    /// still-expiring record - it returns the existing one instead.
    /// </summary>
    Task<NotificationDto> RaiseAsync(string entityTypeName, int entityId, string title, string message, DateTime dueDate, string? targetRole = null);
}

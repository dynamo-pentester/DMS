namespace DriverDms.Domain.Entities;

/// <summary>
/// Per design doc §4.8 (Documents & Alerts domain). Deliberately plain, not BaseEntity -
/// same treatment as AuditLog: this is a system-generated record, not a user-editable
/// business entity, so soft-delete/concurrency don't apply the same way.
/// </summary>
public class Notification
{
    public int NotificationId { get; set; }
    public int NotificationEntityTypeId { get; set; }
    public NotificationEntityType? NotificationEntityType { get; set; }
    public int EntityId { get; set; }
    public string Title { get; set; } = default!;
    public string Message { get; set; } = default!;
    public DateTime DueDate { get; set; }
    public int NotificationStatusId { get; set; }
    public NotificationStatus? NotificationStatus { get; set; }
    public DateTime CreatedAt { get; set; }

    // Standard addition beyond the original spec list, same reasoning as AuditLog's
    // extra fields: needed to support the dismiss action (§ this sprint), not scope creep.
    public DateTime? DismissedAt { get; set; }
}

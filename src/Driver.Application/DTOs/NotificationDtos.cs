namespace DriverDms.Application.DTOs;

public class NotificationDto
{
    public int NotificationId { get; set; }
    public string EntityTypeName { get; set; } = default!;
    public int EntityId { get; set; }
    public string Title { get; set; } = default!;
    public string Message { get; set; } = default!;
    public DateTime DueDate { get; set; }
    public string StatusName { get; set; } = default!;
    public DateTime CreatedAt { get; set; }
    public DateTime? DismissedAt { get; set; }
    public bool IsRead { get; set; }
    public string? TargetRole { get; set; }
}

public class NotificationSearchRequest
{
    /// <summary>Filter by status name: Pending | Sent | Dismissed | Expired</summary>
    public string? Status { get; set; }
    /// <summary>Filter by entity type name: License | Medical | Training | Incident | Document | System</summary>
    public string? EntityType { get; set; }
    public bool? OnlyUnread { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;
}

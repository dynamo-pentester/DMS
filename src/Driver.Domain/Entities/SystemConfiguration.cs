namespace DriverDms.Domain.Entities;

public class SystemConfiguration
{
    public string ConfigKey { get; set; } = default!;   // e.g. "LicenseReminderDays"
    public string ConfigValue { get; set; } = default!;
    public string? Description { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class AuditLog
{
    public int AuditLogId { get; set; }
    public int? UserId { get; set; }
    public string Action { get; set; } = default!;      // Created / Updated / Deleted
    public string EntityType { get; set; } = default!;   // free text on purpose - see design doc §4.8 note
    public int EntityId { get; set; }
    public string? OldValue { get; set; }                 // full-row JSON snapshot
    public string? NewValue { get; set; }
    public string? IPAddress { get; set; }
    public string? CorrelationId { get; set; }
    public DateTime CreatedAt { get; set; }
}

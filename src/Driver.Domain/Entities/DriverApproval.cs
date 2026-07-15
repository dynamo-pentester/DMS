using DriverDms.Domain.Common;

namespace DriverDms.Domain.Entities;

/// <summary>
/// Tracks a driver approval request created when an Employee registers a new driver.
/// The Manager assigned to handle it can approve or reject.
/// Admin/Manager-created drivers skip this table (auto-approved).
/// </summary>
public class DriverApproval : BaseEntity
{
    public int Id { get; set; }

    public int DriverId { get; set; }
    public Driver? Driver { get; set; }

    /// <summary>UserId of the Employee who created the driver and triggered this request.</summary>
    public int RequestedByUserId { get; set; }

    /// <summary>UserId of the Manager this request was assigned to. May be 0 if routed to all managers.</summary>
    public int AssignedToManagerId { get; set; }

    /// <summary>"PendingApproval" | "Approved" | "Rejected"</summary>
    public string Status { get; set; } = "PendingApproval";

    public string? Comments { get; set; }

    public DateTime RequestedDate { get; set; } = DateTime.UtcNow;

    /// <summary>Stamped when the Manager approves or rejects.</summary>
    public DateTime? ActionDate { get; set; }
}

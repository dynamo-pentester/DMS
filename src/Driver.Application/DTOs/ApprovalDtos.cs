namespace DriverDms.Application.DTOs;

public class DriverApprovalDto
{
    public int Id { get; set; }
    public int DriverId { get; set; }
    public string DriverCode { get; set; } = default!;
    public string DriverName { get; set; } = default!;
    public int RequestedByUserId { get; set; }
    public string? RequestedByName { get; set; }   // filled by the service via Identity lookup
    public int AssignedToManagerId { get; set; }
    public string Status { get; set; } = default!;
    public string? Comments { get; set; }
    public DateTime RequestedDate { get; set; }
    public DateTime? ActionDate { get; set; }
}

public class ApproveRejectRequest
{
    public string? Comments { get; set; }
}

using DriverDms.Application.DTOs;

namespace DriverDms.Application.Interfaces;

public interface IApprovalService
{
    /// <summary>Returns all pending approval requests (for Manager/Admin view).</summary>
    Task<IReadOnlyList<DriverApprovalDto>> GetPendingAsync();

    /// <summary>Returns approval requests created by a specific employee.</summary>
    Task<IReadOnlyList<DriverApprovalDto>> GetMyRequestsAsync(int requestedByUserId);

    /// <summary>Returns all approval requests (approved + rejected + pending) for Admin.</summary>
    Task<IReadOnlyList<DriverApprovalDto>> GetAllAsync();

    /// <summary>Manager approves the driver — sets both the approval record and Driver.ApprovalStatus to "Approved".</summary>
    Task ApproveAsync(int approvalId, string? comments, int managerId);

    /// <summary>Manager rejects the driver — sets both to "Rejected".</summary>
    Task RejectAsync(int approvalId, string? comments, int managerId);
}

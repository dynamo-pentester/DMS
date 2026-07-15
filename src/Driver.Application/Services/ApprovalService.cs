using Microsoft.EntityFrameworkCore;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;
using DriverDms.Domain.Entities;

namespace DriverDms.Application.Services;

public class ApprovalService : IApprovalService
{
    private readonly IApplicationDbContext _db;
    private readonly IIdentityService _identityService;
    private readonly INotificationService _notifications;

    public ApprovalService(IApplicationDbContext db, IIdentityService identityService, INotificationService notifications)
    {
        _db = db;
        _identityService = identityService;
        _notifications = notifications;
    }

    public async Task<IReadOnlyList<DriverApprovalDto>> GetPendingAsync()
    {
        var approvals = await _db.DriverApprovals
            .Include(a => a.Driver)
            .Where(a => a.Status == "PendingApproval" && !a.IsDeleted)
            .OrderByDescending(a => a.RequestedDate)
            .ToListAsync();

        return await MapAsync(approvals);
    }

    public async Task<IReadOnlyList<DriverApprovalDto>> GetMyRequestsAsync(int requestedByUserId)
    {
        var approvals = await _db.DriverApprovals
            .Include(a => a.Driver)
            .Where(a => a.RequestedByUserId == requestedByUserId && !a.IsDeleted)
            .OrderByDescending(a => a.RequestedDate)
            .ToListAsync();

        return await MapAsync(approvals);
    }

    public async Task<IReadOnlyList<DriverApprovalDto>> GetAllAsync()
    {
        var approvals = await _db.DriverApprovals
            .Include(a => a.Driver)
            .Where(a => !a.IsDeleted)
            .OrderByDescending(a => a.RequestedDate)
            .ToListAsync();

        return await MapAsync(approvals);
    }

    public async Task ApproveAsync(int approvalId, string? comments, int managerId)
    {
        var approval = await _db.DriverApprovals
            .Include(a => a.Driver)
            .FirstOrDefaultAsync(a => a.Id == approvalId && !a.IsDeleted)
            ?? throw new KeyNotFoundException($"Approval request {approvalId} not found.");

        if (approval.Status != "PendingApproval")
            throw new InvalidOperationException($"Approval {approvalId} is already in status '{approval.Status}'.");

        approval.Status = "Approved";
        approval.Comments = comments;
        approval.ActionDate = DateTime.UtcNow;
        approval.UpdatedBy = managerId;

        if (approval.Driver is not null)
        {
            approval.Driver.ApprovalStatus = "Approved";
            approval.Driver.ApprovedBy = managerId;
            approval.Driver.ApprovedDate = DateTime.UtcNow;
            approval.Driver.UpdatedBy = managerId;
        }

        await _db.SaveChangesAsync();

        if (approval.Driver is not null)
        {
            await _notifications.RaiseAsync(
                entityTypeName: "System",
                entityId: approval.Driver.DriverId,
                title: "Driver approved",
                message: $"Driver {approval.Driver.FullName} ({approval.Driver.DriverCode}) has been approved.",
                dueDate: DateTime.UtcNow);
        }
    }

    public async Task RejectAsync(int approvalId, string? comments, int managerId)
    {
        var approval = await _db.DriverApprovals
            .Include(a => a.Driver)
            .FirstOrDefaultAsync(a => a.Id == approvalId && !a.IsDeleted)
            ?? throw new KeyNotFoundException($"Approval request {approvalId} not found.");

        if (approval.Status != "PendingApproval")
            throw new InvalidOperationException($"Approval {approvalId} is already in status '{approval.Status}'.");

        approval.Status = "Rejected";
        approval.Comments = comments;
        approval.ActionDate = DateTime.UtcNow;
        approval.UpdatedBy = managerId;

        if (approval.Driver is not null)
        {
            approval.Driver.ApprovalStatus = "Rejected";
            approval.Driver.UpdatedBy = managerId;
        }

        await _db.SaveChangesAsync();
    }

    // ── Private helpers ──────────────────────────────────────────────────────────

    private async Task<IReadOnlyList<DriverApprovalDto>> MapAsync(List<DriverApproval> approvals)
    {
        var result = new List<DriverApprovalDto>();

        foreach (var a in approvals)
        {
            string? requesterName = null;
            if (a.RequestedByUserId > 0)
            {
                requesterName = await _identityService.GetUserFullNameAsync(a.RequestedByUserId);
            }

            result.Add(new DriverApprovalDto
            {
                Id = a.Id,
                DriverId = a.DriverId,
                DriverCode = a.Driver?.DriverCode ?? string.Empty,
                DriverName = a.Driver?.FullName ?? string.Empty,
                RequestedByUserId = a.RequestedByUserId,
                RequestedByName = requesterName,
                AssignedToManagerId = a.AssignedToManagerId,
                Status = a.Status,
                Comments = a.Comments,
                RequestedDate = a.RequestedDate,
                ActionDate = a.ActionDate
            });
        }

        return result;
    }
}

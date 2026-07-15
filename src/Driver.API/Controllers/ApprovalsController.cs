using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;

namespace DriverDms.API.Controllers;

[ApiController]
[Route("api/approvals")]
[Authorize]
public class ApprovalsController : ControllerBase
{
    private readonly IApprovalService _approvalService;

    public ApprovalsController(IApprovalService approvalService)
    {
        _approvalService = approvalService;
    }

    /// <summary>
    /// HOD: list all pending driver approval requests.
    /// Admin is excluded — approval is solely the HOD's responsibility.
    /// </summary>
    [HttpGet("pending")]
    [Authorize(Roles = "HOD")]
    public async Task<IActionResult> GetPending()
    {
        var pending = await _approvalService.GetPendingAsync();
        return Ok(pending);
    }

    /// <summary>
    /// Employee: see their own submitted driver approval requests.
    /// </summary>
    [HttpGet("my-requests")]
    [Authorize(Roles = "Employee")]
    public async Task<IActionResult> GetMyRequests()
    {
        var userId = GetCurrentUserId();
        var requests = await _approvalService.GetMyRequestsAsync(userId);
        return Ok(requests);
    }

    /// <summary>
    /// HOD: approve a pending driver enrollment request.
    /// </summary>
    [HttpPut("{id:int}/approve")]
    [Authorize(Roles = "HOD")]
    public async Task<IActionResult> Approve(int id, [FromBody] ApproveRejectRequest request)
    {
        try
        {
            var managerId = GetCurrentUserId();
            await _approvalService.ApproveAsync(id, request.Comments, managerId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// HOD: reject a pending driver enrollment request.
    /// </summary>
    [HttpPut("{id:int}/reject")]
    [Authorize(Roles = "HOD")]
    public async Task<IActionResult> Reject(int id, [FromBody] ApproveRejectRequest request)
    {
        try
        {
            var managerId = GetCurrentUserId();
            await _approvalService.RejectAsync(id, request.Comments, managerId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst("sub") ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        return claim is not null && int.TryParse(claim.Value, out var id) ? id : 0;
    }
}

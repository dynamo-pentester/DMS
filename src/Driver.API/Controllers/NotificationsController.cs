using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;

namespace DriverDms.API.Controllers;

/// <summary>
/// Surface-only for this sprint: list/get/dismiss. Notifications themselves are
/// raised internally (currently by ExpiryAlertJob via INotificationService.RaiseAsync),
/// not created directly through this controller - there's no POST here on purpose.
/// </summary>
[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _service;

    public NotificationsController(INotificationService service)
    {
        _service = service;
    }

    /// <summary>Get a single notification by ID</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var notification = await _service.GetByIdAsync(id);
        return notification is null ? NotFound() : Ok(notification);
    }

    /// <summary>
    /// List notifications. Filter by status (Pending | Sent | Dismissed | Expired)
    /// or entityType (License | Medical | Training | Incident | Document | System).
    /// e.g. GET /api/notifications?status=Pending
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] NotificationSearchRequest request)
        => Ok(await _service.SearchAsync(request));

    /// <summary>Mark a notification as dismissed</summary>
    [HttpPatch("{id:int}/dismiss")]
    public async Task<IActionResult> Dismiss(int id)
    {
        try
        {
            await _service.DismissAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}

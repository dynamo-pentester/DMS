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

    /// <summary>Mark a single notification as read</summary>
    [HttpPatch("{id:int}/mark-as-read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        try
        {
            await _service.MarkAsReadAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>Mark all notifications as read</summary>
    [HttpPatch("mark-all-as-read")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        await _service.MarkAllAsReadAsync();
        return NoContent();
    }

    /// <summary>Get unread notifications count</summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var count = await _service.GetUnreadCountAsync();
        return Ok(new { count });
    }

    /// <summary>Dismiss / delete a notification</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}

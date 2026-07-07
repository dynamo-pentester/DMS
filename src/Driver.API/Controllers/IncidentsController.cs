using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;

namespace DriverDms.API.Controllers;

[ApiController]
[Route("api/incidents")]
[Authorize]
public class IncidentsController : ControllerBase
{
    private readonly IIncidentService _service;

    public IncidentsController(IIncidentService service)
    {
        _service = service;
    }

    /// <summary>Get a single incident, including its corrective actions</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var incident = await _service.GetByIdAsync(id);
        return incident is null ? NotFound() : Ok(incident);
    }

    /// <summary>
    /// List incidents. Filter by driverId, severityLevelId, or rootCauseCompleted.
    /// e.g. GET /api/incidents?driverId=1&rootCauseCompleted=false
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] IncidentSearchRequest request)
        => Ok(await _service.SearchAsync(request));

    /// <summary>Report a new incident/near-miss/violation for a driver</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateIncidentRequest request)
    {
        var userId = GetUserId();
        try
        {
            var incident = await _service.CreateAsync(request, userId);
            return CreatedAtAction(nameof(Get), new { id = incident.IncidentId }, incident);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Update incident details, including marking root cause analysis complete</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateIncidentRequest request)
    {
        var userId = GetUserId();
        try
        {
            var incident = await _service.UpdateAsync(id, request, userId);
            return Ok(incident);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Soft-delete an incident</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetUserId();
        try
        {
            await _service.DeleteAsync(id, userId);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Attach a corrective action to an incident. An incident can accumulate more than
    /// one over time (e.g. an initial warning, then a later suspension) - this adds to
    /// the list rather than replacing it.
    /// </summary>
    [HttpPost("{id:int}/corrective-actions")]
    public async Task<IActionResult> AddCorrectiveAction(int id, [FromBody] AddCorrectiveActionRequest request)
    {
        var userId = GetUserId();
        try
        {
            var action = await _service.AddCorrectiveActionAsync(id, request, userId);
            return CreatedAtAction(nameof(Get), new { id }, action);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private int GetUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        return int.TryParse(claim, out var id) ? id : 0;
    }
}

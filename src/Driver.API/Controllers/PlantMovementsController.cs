using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;

namespace DriverDms.API.Controllers;

[ApiController]
[Route("api/plant-movements")]
[Authorize]
public class PlantMovementsController : ControllerBase
{
    private readonly IPlantMovementService _service;

    public PlantMovementsController(IPlantMovementService service)
    {
        _service = service;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var movement = await _service.GetByIdAsync(id);
        return movement is null ? NotFound() : Ok(movement);
    }

    /// <summary>
    /// List movements. Use onSiteOnly=true to see who's currently on-site (no exit recorded yet).
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] PlantMovementSearchRequest request)
        => Ok(await _service.SearchAsync(request));

    /// <summary>Record a driver entering the plant/mine site</summary>
    [HttpPost]
    [Authorize(Roles = "System Administrator,HOD,Employee,Gate Security,Transport Coordinator")]
    public async Task<IActionResult> RecordEntry([FromBody] CreatePlantMovementRequest request)
    {
        var userId = GetUserId();
        try
        {
            var movement = await _service.RecordEntryAsync(request, userId);
            return CreatedAtAction(nameof(Get), new { id = movement.MovementId }, movement);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Record exit for an existing entry row - same movement, not a new one, per the
    /// design doc's "one row, two timestamps" decision for Plant Movement.
    /// </summary>
    [HttpPatch("{id:int}/exit")]
    [Authorize(Roles = "System Administrator,HOD,Employee,Gate Security,Transport Coordinator")]
    public async Task<IActionResult> RecordExit(int id, [FromBody] RecordExitRequest request)
    {
        try
        {
            var movement = await _service.RecordExitAsync(id, request);
            return Ok(movement);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private int GetUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return int.TryParse(claim, out var id) ? id : 0;
    }
}

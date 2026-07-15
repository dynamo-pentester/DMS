using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;

namespace DriverDms.API.Controllers;

[ApiController]
[Route("api/transporters")]
[Authorize]
public class TransportersController : ControllerBase
{
    private readonly ITransporterService _service;

    public TransportersController(ITransporterService service)
    {
        _service = service;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var transporter = await _service.GetByIdAsync(id);
        return transporter is null ? NotFound() : Ok(transporter);
    }

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] TransporterSearchRequest request)
        => Ok(await _service.SearchAsync(request));

    [HttpPost]
    [Authorize(Roles = "System Administrator,HOD,Employee,Transport Coordinator")]
    public async Task<IActionResult> Create(CreateTransporterRequest request)
    {
        var transporter = await _service.CreateAsync(request, GetCurrentUserId());
        return CreatedAtAction(nameof(Get), new { id = transporter.TransporterId }, transporter);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "System Administrator,HOD,Employee,Transport Coordinator")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTransporterRequest request)
        => Ok(await _service.UpdateAsync(id, request, GetCurrentUserId()));

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "System Administrator,HOD")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id, GetCurrentUserId());
        return NoContent();
    }

    // ---- Driver assignment (tracked as history, not a plain FK - design doc §4.4) ----

    [HttpPost("{id:int}/drivers")]
    [Authorize(Roles = "System Administrator,HOD,Employee,Transport Coordinator")]
    public async Task<IActionResult> AssignDriver(int id, [FromBody] AssignDriverRequest request)
    {
        var assignment = await _service.AssignDriverAsync(id, request, GetCurrentUserId());
        return Ok(assignment);
    }

    [HttpDelete("{id:int}/drivers/{driverId:int}")]
    [Authorize(Roles = "System Administrator,HOD,Employee,Transport Coordinator")]
    public async Task<IActionResult> UnassignDriver(int id, int driverId)
    {
        await _service.UnassignDriverAsync(id, driverId, GetCurrentUserId());
        return NoContent();
    }

    [HttpGet("{id:int}/drivers")]
    public async Task<IActionResult> AssignmentHistory(int id)
        => Ok(await _service.GetAssignmentHistoryAsync(id));

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst("sub") ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        return claim is not null && int.TryParse(claim.Value, out var id) ? id : 0;
    }
}

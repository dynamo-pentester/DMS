using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;

namespace DriverDms.API.Controllers;

[ApiController]
[Route("api/drivers")]
[Authorize]
public class DriversController : ControllerBase
{
    private readonly IDriverService _service;

    public DriversController(IDriverService service)
    {
        _service = service;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var driver = await _service.GetByIdAsync(id);
        return driver is null ? NotFound() : Ok(driver);
    }

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] DriverSearchRequest request)
        => Ok(await _service.SearchAsync(request));

    [HttpPost]
    [Authorize(Roles = "System Administrator,Manager,Employee")]
    public async Task<IActionResult> Create(CreateDriverRequest request)
    {
        var userId = GetCurrentUserId();
        var driver = await _service.CreateAsync(request, userId);
        return CreatedAtAction(nameof(Get), new { id = driver.DriverId }, driver);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "System Administrator,Manager,Employee")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDriverRequest request)
        => Ok(await _service.UpdateAsync(id, request, GetCurrentUserId()));

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "System Administrator,Manager,Employee,Safety Officer")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateDriverStatusRequest request)
    {
        await _service.UpdateStatusAsync(id, request.NewStatusId, request.Reason, GetCurrentUserId());
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "System Administrator,Manager")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id, GetCurrentUserId());
        return NoContent();
    }

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst("sub") ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        return claim is not null && int.TryParse(claim.Value, out var id) ? id : 0;
    }
}

public class UpdateDriverStatusRequest
{
    public int NewStatusId { get; set; }
    public string? Reason { get; set; }
}

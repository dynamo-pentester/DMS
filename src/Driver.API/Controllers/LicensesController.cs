using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;

namespace DriverDms.API.Controllers;

[ApiController]
[Route("api/licenses")]
[Authorize]
public class LicensesController : ControllerBase
{
    private readonly ILicenseService _service;

    public LicensesController(ILicenseService service)
    {
        _service = service;
    }

    /// <summary>Get a single license by ID</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var license = await _service.GetByIdAsync(id);
        return license is null ? NotFound() : Ok(license);
    }

    /// <summary>
    /// List licenses. Filter by driverId or status (Valid | Expiring | Expired).
    /// e.g. GET /api/licenses?driverId=1&status=Expiring
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] LicenseSearchRequest request)
        => Ok(await _service.SearchAsync(request));

    /// <summary>Add a new license to a driver</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLicenseRequest request)
    {
        var userId = GetUserId();
        try
        {
            var license = await _service.CreateAsync(request, userId);
            return CreatedAtAction(nameof(Get), new { id = license.LicenseId }, license);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Update license details and endorsements</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateLicenseRequest request)
    {
        var userId = GetUserId();
        try
        {
            var license = await _service.UpdateAsync(id, request, userId);
            return Ok(license);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Soft-delete a license</summary>
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

    private int GetUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        return int.TryParse(claim, out var id) ? id : 0;
    }
}

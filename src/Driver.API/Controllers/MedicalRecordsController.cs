using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;

namespace DriverDms.API.Controllers;

[ApiController]
[Route("api/medical-records")]
[Authorize]
public class MedicalRecordsController : ControllerBase
{
    private readonly IMedicalRecordService _service;

    public MedicalRecordsController(IMedicalRecordService service)
    {
        _service = service;
    }

    /// <summary>Get a single medical record by ID</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var record = await _service.GetByIdAsync(id);
        return record is null ? NotFound() : Ok(record);
    }

    /// <summary>
    /// List medical records. Filter by driverId or status (Valid | Expiring | Expired).
    /// e.g. GET /api/medical-records?driverId=1&status=Expiring
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] MedicalRecordSearchRequest request)
        => Ok(await _service.SearchAsync(request));

    /// <summary>Add a new medical/fitness record for a driver</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMedicalRecordRequest request)
    {
        var userId = GetUserId();
        try
        {
            var record = await _service.CreateAsync(request, userId);
            return CreatedAtAction(nameof(Get), new { id = record.MedicalRecordId }, record);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Update medical record details</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMedicalRecordRequest request)
    {
        var userId = GetUserId();
        try
        {
            var record = await _service.UpdateAsync(id, request, userId);
            return Ok(record);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Soft-delete a medical record</summary>
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

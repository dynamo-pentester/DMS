using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;

namespace DriverDms.API.Controllers;

[ApiController]
[Route("api/trainings")]
[Authorize]
public class TrainingsController : ControllerBase
{
    private readonly ITrainingService _service;

    public TrainingsController(ITrainingService service)
    {
        _service = service;
    }

    /// <summary>Get a single training record by ID</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var training = await _service.GetByIdAsync(id);
        return training is null ? NotFound() : Ok(training);
    }

    /// <summary>
    /// List training records. Filter by driverId or status (Valid | Expiring | Expired).
    /// e.g. GET /api/trainings?driverId=1&status=Expiring
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] TrainingSearchRequest request)
        => Ok(await _service.SearchAsync(request));

    /// <summary>Record a completed training / PEP talk for a driver</summary>
    [HttpPost]
    [Authorize(Roles = "System Administrator,HOD,Employee,Safety Officer")]
    public async Task<IActionResult> Create([FromBody] CreateTrainingRequest request)
    {
        var userId = GetUserId();
        try
        {
            var training = await _service.CreateAsync(request, userId);
            return CreatedAtAction(nameof(Get), new { id = training.TrainingId }, training);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Update training record details</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "System Administrator,HOD,Employee,Safety Officer")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTrainingRequest request)
    {
        var userId = GetUserId();
        try
        {
            var training = await _service.UpdateAsync(id, request, userId);
            return Ok(training);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Soft-delete a training record</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "System Administrator,HOD")]
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

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DriverDms.Application.Interfaces;

namespace DriverDms.API.Controllers;

// Plain reference-data reads - no service layer needed per §4.2/§4.10 of the
// design doc (these tables have no soft delete, no audit, no business logic).
[ApiController]
[Route("api/lookups")]
[Authorize]
public class LookupsController : ControllerBase
{
    private readonly IApplicationDbContext _db;

    public LookupsController(IApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet("blood-groups")]
    public async Task<IActionResult> BloodGroups()
        => Ok(await _db.BloodGroups
            .Select(b => new { b.BloodGroupId, b.Name })
            .ToListAsync());

    [HttpGet("endorsements")]
    public async Task<IActionResult> Endorsements()
        => Ok(await _db.Endorsements
            .Where(e => e.IsActive)
            .Select(e => new { e.EndorsementId, e.Name })
            .ToListAsync());

    [HttpGet("vehicle-types")]
    public async Task<IActionResult> VehicleTypes()
        => Ok(await _db.VehicleTypes
            .Where(v => v.IsActive)
            .Select(v => new { v.VehicleTypeId, v.Name })
            .ToListAsync());

    [HttpGet("driver-status-types")]
    public async Task<IActionResult> DriverStatusTypes()
        => Ok(await _db.DriverStatusTypes
            .Select(s => new { s.DriverStatusTypeId, s.Name })
            .ToListAsync());

    [HttpGet("fitness-statuses")]
    public async Task<IActionResult> FitnessStatuses()
        => Ok(await _db.FitnessStatuses
            .Select(f => new { f.FitnessStatusId, f.Name })
            .ToListAsync());

    [HttpGet("incident-types")]
    public async Task<IActionResult> IncidentTypes()
        => Ok(await _db.IncidentTypes
            .Select(i => new { i.IncidentTypeId, i.Name })
            .ToListAsync());

    [HttpGet("severity-levels")]
    public async Task<IActionResult> SeverityLevels()
        => Ok(await _db.SeverityLevels
            .Select(s => new { s.SeverityLevelId, s.Name })
            .ToListAsync());

    [HttpGet("penalty-types")]
    public async Task<IActionResult> PenaltyTypes()
        => Ok(await _db.PenaltyTypes
            .Select(p => new { p.PenaltyTypeId, p.Name })
            .ToListAsync());

    [HttpGet("purpose-types")]
    public async Task<IActionResult> PurposeTypes()
        => Ok(await _db.PurposeTypes
            .Select(p => new { p.PurposeTypeId, p.Name })
            .ToListAsync());

    [HttpGet("gate-numbers")]
    public async Task<IActionResult> GateNumbers()
        => Ok(await _db.GateNumbers
            .Select(g => new { g.GateNumberId, g.Name })
            .ToListAsync());

    [HttpGet("training-types")]
    public async Task<IActionResult> TrainingTypes()
        => Ok(await _db.TrainingTypes
            .Select(t => new { t.TrainingTypeId, t.Name })
            .ToListAsync());

    [HttpGet("notification-entity-types")]
    public async Task<IActionResult> NotificationEntityTypes()
        => Ok(await _db.NotificationEntityTypes
            .Select(n => new { n.NotificationEntityTypeId, n.Name })
            .ToListAsync());

    [HttpGet("notification-statuses")]
    public async Task<IActionResult> NotificationStatuses()
        => Ok(await _db.NotificationStatuses
            .Select(n => new { n.NotificationStatusId, n.Name })
            .ToListAsync());
}

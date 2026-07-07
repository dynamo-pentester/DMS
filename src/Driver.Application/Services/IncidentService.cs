using Microsoft.EntityFrameworkCore;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;
using DriverDms.Domain.Entities;

namespace DriverDms.Application.Services;

public class IncidentService : IIncidentService
{
    private readonly IApplicationDbContext _db;

    public IncidentService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IncidentDto?> GetByIdAsync(int incidentId)
    {
        var incident = await LoadFullIncidentQuery()
            .FirstOrDefaultAsync(i => i.IncidentId == incidentId && !i.IsDeleted);

        return incident is null ? null : ToDto(incident);
    }

    public async Task<PagedResult<IncidentDto>> SearchAsync(IncidentSearchRequest request)
    {
        var query = LoadFullIncidentQuery().Where(i => !i.IsDeleted);

        if (request.DriverId.HasValue)
            query = query.Where(i => i.DriverId == request.DriverId.Value);

        if (request.SeverityLevelId.HasValue)
            query = query.Where(i => i.SeverityLevelId == request.SeverityLevelId.Value);

        if (request.RootCauseCompleted.HasValue)
            query = query.Where(i => i.RootCauseCompleted == request.RootCauseCompleted.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(i => i.IncidentDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        return new PagedResult<IncidentDto>
        {
            Items = items.Select(ToDto).ToList(),
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }

    public async Task<IncidentDto> CreateAsync(CreateIncidentRequest request, int createdByUserId)
    {
        var driverExists = await _db.Drivers.AnyAsync(d => d.DriverId == request.DriverId && !d.IsDeleted);
        if (!driverExists)
            throw new InvalidOperationException($"Driver {request.DriverId} not found.");

        var incident = new Incident
        {
            DriverId = request.DriverId,
            IncidentDate = request.IncidentDate,
            IncidentTypeId = request.IncidentTypeId,
            Description = request.Description,
            SeverityLevelId = request.SeverityLevelId,
            Location = request.Location,
            RootCauseCompleted = false,
            CreatedBy = createdByUserId
        };

        _db.Incidents.Add(incident);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(incident.IncidentId)
            ?? throw new InvalidOperationException("Failed to reload created incident.");
    }

    public async Task<IncidentDto> UpdateAsync(int incidentId, UpdateIncidentRequest request, int updatedByUserId)
    {
        var incident = await _db.Incidents.FirstOrDefaultAsync(i => i.IncidentId == incidentId && !i.IsDeleted)
            ?? throw new InvalidOperationException($"Incident {incidentId} not found.");

        incident.IncidentDate = request.IncidentDate;
        incident.IncidentTypeId = request.IncidentTypeId;
        incident.Description = request.Description;
        incident.SeverityLevelId = request.SeverityLevelId;
        incident.Location = request.Location;
        incident.RootCauseCompleted = request.RootCauseCompleted;
        incident.UpdatedBy = updatedByUserId;

        await _db.SaveChangesAsync();

        return await GetByIdAsync(incidentId)
            ?? throw new InvalidOperationException("Failed to reload updated incident.");
    }

    public async Task DeleteAsync(int incidentId, int deletedByUserId)
    {
        var incident = await _db.Incidents.FirstOrDefaultAsync(i => i.IncidentId == incidentId && !i.IsDeleted)
            ?? throw new InvalidOperationException($"Incident {incidentId} not found.");

        incident.DeletedBy = deletedByUserId;
        _db.Incidents.Remove(incident); // SaveChangesAsync override converts to soft delete
        await _db.SaveChangesAsync();
    }

    public async Task<CorrectiveActionDto> AddCorrectiveActionAsync(int incidentId, AddCorrectiveActionRequest request, int createdByUserId)
    {
        var incidentExists = await _db.Incidents.AnyAsync(i => i.IncidentId == incidentId && !i.IsDeleted);
        if (!incidentExists)
            throw new InvalidOperationException($"Incident {incidentId} not found.");

        var action = new CorrectiveAction
        {
            IncidentId = incidentId,
            ActionTaken = request.ActionTaken,
            PenaltyTypeId = request.PenaltyTypeId,
            ActionDate = request.ActionDate ?? DateTime.UtcNow,
            CreatedBy = createdByUserId
        };

        _db.CorrectiveActions.Add(action);
        await _db.SaveChangesAsync();

        var reloaded = await _db.CorrectiveActions
            .Include(c => c.PenaltyType)
            .FirstAsync(c => c.CorrectiveActionId == action.CorrectiveActionId);

        return ToActionDto(reloaded);
    }

    // ---- mapping ----

    private IQueryable<Incident> LoadFullIncidentQuery() => _db.Incidents
        .Include(i => i.Driver)
        .Include(i => i.IncidentType)
        .Include(i => i.SeverityLevel)
        .Include(i => i.CorrectiveActions).ThenInclude(c => c.PenaltyType);

    private static IncidentDto ToDto(Incident incident) => new()
    {
        IncidentId = incident.IncidentId,
        DriverId = incident.DriverId,
        DriverName = incident.Driver?.FullName ?? string.Empty,
        IncidentDate = incident.IncidentDate,
        IncidentTypeName = incident.IncidentType?.Name ?? string.Empty,
        Description = incident.Description,
        SeverityLevelName = incident.SeverityLevel?.Name ?? string.Empty,
        Location = incident.Location,
        RootCauseCompleted = incident.RootCauseCompleted,
        CorrectiveActions = incident.CorrectiveActions
            .Where(c => !c.IsDeleted)
            .Select(ToActionDto)
            .ToList()
    };

    private static CorrectiveActionDto ToActionDto(CorrectiveAction action) => new()
    {
        CorrectiveActionId = action.CorrectiveActionId,
        IncidentId = action.IncidentId,
        ActionTaken = action.ActionTaken,
        PenaltyTypeName = action.PenaltyType?.Name,
        ActionDate = action.ActionDate
    };
}

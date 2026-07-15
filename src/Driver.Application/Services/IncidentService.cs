using Microsoft.EntityFrameworkCore;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;
using DriverDms.Domain.Entities;

namespace DriverDms.Application.Services;

public class IncidentService : IIncidentService
{
    private readonly IApplicationDbContext _db;
    private readonly INotificationService _notifications;

    public IncidentService(IApplicationDbContext db, INotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
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

        if (!string.IsNullOrWhiteSpace(request.LicenseNo))
        {
            var licenseTerm = request.LicenseNo.Trim();
            query = query.Where(i => i.Driver != null && i.Driver.Licenses.Any(l => l.LicenseNo.Contains(licenseTerm)));
        }

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

        // The frontend sends severity as a name string ("Low"/"Medium"/"High") while
        // the DTO also supports an explicit numeric SeverityLevelId. Resolve whichever
        // one was provided so either caller works correctly.
        var resolvedSeverityLevelId = request.SeverityLevelId;
        if (resolvedSeverityLevelId == 0 && !string.IsNullOrWhiteSpace(request.Severity))
        {
            resolvedSeverityLevelId = await _db.SeverityLevels
                .Where(s => s.Name == request.Severity)
                .Select(s => s.SeverityLevelId)
                .FirstOrDefaultAsync();
        }
        if (resolvedSeverityLevelId == 0)
        {
            // Last-resort: pick the first available severity so we never hit a FK violation.
            resolvedSeverityLevelId = await _db.SeverityLevels
                .Select(s => s.SeverityLevelId)
                .FirstOrDefaultAsync();
        }

        var incident = new Incident
        {
            DriverId = request.DriverId,
            IncidentDate = request.IncidentDate,
            IncidentTypeId = request.IncidentTypeId,
            Description = request.Description,
            SeverityLevelId = resolvedSeverityLevelId,
            Location = request.Location,
            RootCauseCompleted = false,
            TransporterName = request.TransporterName,
            TransporterChanged = request.TransporterChanged,
            CreatedBy = createdByUserId
        };

        _db.Incidents.Add(incident);
        await _db.SaveChangesAsync();

        var driver = await _db.Drivers.FirstOrDefaultAsync(d => d.DriverId == request.DriverId && !d.IsDeleted);
        var severity = await _db.SeverityLevels.FirstOrDefaultAsync(s => s.SeverityLevelId == resolvedSeverityLevelId);
        var severityName = severity?.Name ?? "Low";
        var incidentType = await _db.IncidentTypes.FirstOrDefaultAsync(t => t.IncidentTypeId == request.IncidentTypeId);
        var incidentTypeName = incidentType?.Name ?? "Incident";

        var title = severityName switch
        {
            "High" => "High severity incident",
            "Medium" => "Medium severity incident",
            _ => "New incident reported"
        };

        await _notifications.RaiseAsync(
            entityTypeName: "Incident",
            entityId: incident.IncidentId,
            title: title,
            message: $"{severityName} severity {incidentTypeName} reported for driver {driver?.FullName ?? "Unknown"}: {request.Description}",
            dueDate: DateTime.UtcNow,
            targetRole: "HOD");

        // ── Three-strikes auto-block: a driver with 3 or more incidents (all-time,
        // across their whole history) is automatically blacklisted. No approval is
        // needed for the block itself - only for the eventual unblock, which is
        // gated on a corrective-action attachment (see DriverService.UpdateStatusAsync).
        if (driver is not null)
        {
            var totalIncidents = await _db.Incidents.CountAsync(i => i.DriverId == driver.DriverId && !i.IsDeleted);
            var blacklistedStatus = await _db.DriverStatusTypes.FirstOrDefaultAsync(s => s.Name == "Blacklisted");

            if (totalIncidents >= 3 && blacklistedStatus is not null && driver.CurrentStatusId != blacklistedStatus.DriverStatusTypeId)
            {
                driver.CurrentStatusId = blacklistedStatus.DriverStatusTypeId;
                driver.UpdatedBy = createdByUserId;
                driver.UpdatedAt = DateTime.UtcNow;

                _db.DriverStatusHistories.Add(new DriverStatusHistory
                {
                    DriverId = driver.DriverId,
                    DriverStatusTypeId = blacklistedStatus.DriverStatusTypeId,
                    Reason = $"Auto-blocked: {totalIncidents} incidents recorded.",
                    ChangedBy = createdByUserId
                });

                await _db.SaveChangesAsync();

                await _notifications.RaiseAsync(
                    entityTypeName: "Driver",
                    entityId: driver.DriverId,
                    title: "Driver auto-blocked",
                    message: $"{driver.FullName} has been automatically blacklisted after reaching {totalIncidents} incidents. " +
                             "A letter of apology must be attached to a corrective action before the status can be changed.",
                    dueDate: DateTime.UtcNow,
                    targetRole: "HOD");
            }
        }

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
        TransporterName = incident.TransporterName,
        TransporterChanged = incident.TransporterChanged,
        CorrectiveActions = incident.CorrectiveActions
            .Where(c => !c.IsDeleted)
            .Select(ToActionDto)
            .ToList(),
        HasReport = !string.IsNullOrWhiteSpace(incident.IncidentReportPath)
    };

    public async Task<string?> GetReportPathAsync(int incidentId)
    {
        var incident = await _db.Incidents.FirstOrDefaultAsync(i => i.IncidentId == incidentId && !i.IsDeleted)
            ?? throw new InvalidOperationException($"Incident {incidentId} not found.");
        return incident.IncidentReportPath;
    }

    public async Task SetReportPathAsync(int incidentId, string? relativePath, int updatedByUserId)
    {
        var incident = await _db.Incidents.FirstOrDefaultAsync(i => i.IncidentId == incidentId && !i.IsDeleted)
            ?? throw new InvalidOperationException($"Incident {incidentId} not found.");

        incident.IncidentReportPath = relativePath;
        incident.UpdatedBy = updatedByUserId;

        await _db.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(relativePath))
        {
            await _notifications.RaiseAsync(
                entityTypeName: "Document",
                entityId: incidentId,
                title: "Incident Report document uploaded",
                message: $"Incident report document uploaded for incident ID {incidentId}.",
                dueDate: DateTime.UtcNow);
        }
    }

    private static CorrectiveActionDto ToActionDto(CorrectiveAction action) => new()
    {
        CorrectiveActionId = action.CorrectiveActionId,
        IncidentId = action.IncidentId,
        ActionTaken = action.ActionTaken,
        PenaltyTypeName = action.PenaltyType?.Name,
        ActionDate = action.ActionDate,
        HasAttachment = !string.IsNullOrWhiteSpace(action.AttachmentPath),
        HasApologyDocument = !string.IsNullOrEmpty(action.ApologyDocumentPath)
    };

    public async Task<string?> GetCorrectiveActionAttachmentPathAsync(int incidentId, int correctiveActionId)
    {
        var action = await _db.CorrectiveActions.FirstOrDefaultAsync(
            c => c.CorrectiveActionId == correctiveActionId && c.IncidentId == incidentId && !c.IsDeleted)
            ?? throw new InvalidOperationException($"Corrective action {correctiveActionId} not found on incident {incidentId}.");
        return action.AttachmentPath;
    }

    public async Task SetCorrectiveActionAttachmentPathAsync(int incidentId, int correctiveActionId, string? relativePath, int updatedByUserId)
    {
        var action = await _db.CorrectiveActions.FirstOrDefaultAsync(
            c => c.CorrectiveActionId == correctiveActionId && c.IncidentId == incidentId && !c.IsDeleted)
            ?? throw new InvalidOperationException($"Corrective action {correctiveActionId} not found on incident {incidentId}.");

        action.AttachmentPath = relativePath;
        action.UpdatedBy = updatedByUserId;

        await _db.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(relativePath))
        {
            await _notifications.RaiseAsync(
                entityTypeName: "Document",
                entityId: incidentId,
                title: "Corrective action attachment uploaded",
                message: $"A letter of apology / supporting attachment was uploaded for a corrective action on incident ID {incidentId}.",
                dueDate: DateTime.UtcNow,
                targetRole: "HOD");
        }
    }

    public async Task<string?> GetApologyDocumentPathAsync(int correctiveActionId)
    {
        var action = await _db.CorrectiveActions.FirstOrDefaultAsync(
            c => c.CorrectiveActionId == correctiveActionId && !c.IsDeleted)
            ?? throw new InvalidOperationException($"Corrective action {correctiveActionId} not found.");
        return action.ApologyDocumentPath;
    }

    public async Task SetApologyDocumentPathAsync(int correctiveActionId, string path, int updatedByUserId)
    {
        var action = await _db.CorrectiveActions.FirstOrDefaultAsync(
            c => c.CorrectiveActionId == correctiveActionId && !c.IsDeleted)
            ?? throw new InvalidOperationException($"Corrective action {correctiveActionId} not found.");

        action.ApologyDocumentPath = path;
        action.UpdatedBy = updatedByUserId;

        await _db.SaveChangesAsync();

        await _notifications.RaiseAsync(
            entityTypeName: "Document",
            entityId: correctiveActionId,
            title: "Apology document uploaded",
            message: $"An apology document was uploaded for corrective action ID {correctiveActionId} (incident ID {action.IncidentId}).",
            dueDate: DateTime.UtcNow,
            targetRole: "HOD");
    }
}

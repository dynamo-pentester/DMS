using Microsoft.EntityFrameworkCore;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;
using DriverDms.Domain.Entities;

namespace DriverDms.Application.Services;

public class TransporterService : ITransporterService
{
    private readonly IApplicationDbContext _db;

    public TransporterService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<TransporterDto?> GetByIdAsync(int id)
    {
        var transporter = await _db.Transporters
            .Include(t => t.DriverAssignments)
            .FirstOrDefaultAsync(t => t.TransporterId == id && !t.IsDeleted);

        return transporter is null ? null : ToDto(transporter);
    }

    public async Task<PagedResult<TransporterDto>> SearchAsync(TransporterSearchRequest request)
    {
        var query = _db.Transporters
            .Include(t => t.DriverAssignments)
            .Where(t => !t.IsDeleted)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim();
            query = query.Where(t =>
                t.Name.Contains(term) ||
                (t.ContactPerson != null && t.ContactPerson.Contains(term)) ||
                (t.Mobile != null && t.Mobile.Contains(term)));
        }

        if (request.IsActive.HasValue)
            query = query.Where(t => t.IsActive == request.IsActive.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(t => t.Name)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        return new PagedResult<TransporterDto>
        {
            Items = items.Select(ToDto).ToList(),
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }

    public async Task<TransporterDto> CreateAsync(CreateTransporterRequest request, int createdByUserId)
    {
        var transporter = new Transporter
        {
            Name = request.Name,
            ContactPerson = request.ContactPerson,
            Mobile = request.Mobile,
            Address = request.Address,
            AgreementValidTill = request.AgreementValidTill,
            IsActive = true,
            CreatedBy = createdByUserId
        };

        _db.Transporters.Add(transporter);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(transporter.TransporterId)
            ?? throw new InvalidOperationException("Transporter was created but could not be reloaded.");
    }

    public async Task<TransporterDto> UpdateAsync(int transporterId, UpdateTransporterRequest request, int updatedByUserId)
    {
        var transporter = await _db.Transporters.FirstOrDefaultAsync(t => t.TransporterId == transporterId && !t.IsDeleted)
            ?? throw new KeyNotFoundException($"Transporter {transporterId} not found.");

        transporter.Name = request.Name;
        transporter.ContactPerson = request.ContactPerson;
        transporter.Mobile = request.Mobile;
        transporter.Address = request.Address;
        transporter.AgreementValidTill = request.AgreementValidTill;
        transporter.IsActive = request.IsActive;
        transporter.UpdatedBy = updatedByUserId;

        await _db.SaveChangesAsync();

        return await GetByIdAsync(transporterId)
            ?? throw new InvalidOperationException("Transporter was updated but could not be reloaded.");
    }

    public async Task DeleteAsync(int transporterId, int deletedByUserId)
    {
        var transporter = await _db.Transporters.FirstOrDefaultAsync(t => t.TransporterId == transporterId && !t.IsDeleted)
            ?? throw new KeyNotFoundException($"Transporter {transporterId} not found.");

        transporter.DeletedBy = deletedByUserId;
        _db.Transporters.Remove(transporter); // soft delete via context convention
        await _db.SaveChangesAsync();
    }

    public async Task<DriverTransporterAssignmentDto> AssignDriverAsync(int transporterId, AssignDriverRequest request, int assignedByUserId)
    {
        var transporter = await _db.Transporters.FirstOrDefaultAsync(t => t.TransporterId == transporterId && !t.IsDeleted)
            ?? throw new KeyNotFoundException($"Transporter {transporterId} not found.");

        var driver = await _db.Drivers.FirstOrDefaultAsync(d => d.DriverId == request.DriverId && !d.IsDeleted)
            ?? throw new KeyNotFoundException($"Driver {request.DriverId} not found.");

        // A driver can only have one current transporter (filtered unique index on
        // DriverId where IsCurrent = 1 - design doc §4.4). If this driver already has
        // a current assignment (to this or any other transporter), close it out first.
        var existingCurrent = await _db.DriverTransporterHistories
            .FirstOrDefaultAsync(h => h.DriverId == request.DriverId && h.IsCurrent && !h.IsDeleted);

        if (existingCurrent is not null)
        {
            existingCurrent.IsCurrent = false;
            existingCurrent.EndDate = DateTime.UtcNow;
            existingCurrent.UpdatedBy = assignedByUserId;

            // Save this UPDATE on its own, before the INSERT below. The filtered
            // unique index (WHERE IsCurrent = 1) checks immediately per statement -
            // SQL Server doesn't defer constraint checks to commit time. If both
            // changes went through the same SaveChangesAsync call, EF Core's internal
            // command ordering isn't guaranteed to run this UPDATE before the new
            // row's INSERT, which could intermittently throw a duplicate-key violation
            // (both rows briefly IsCurrent = 1). Forcing the order explicitly here
            // costs one extra round trip but removes the ambiguity entirely.
            await _db.SaveChangesAsync();
        }

        var assignment = new DriverTransporterHistory
        {
            DriverId = request.DriverId,
            TransporterId = transporterId,
            AssignmentDate = request.AssignmentDate ?? DateTime.UtcNow,
            IsCurrent = true,
            CreatedBy = assignedByUserId
        };

        _db.DriverTransporterHistories.Add(assignment);
        await _db.SaveChangesAsync();

        return await LoadAssignmentDtoAsync(assignment.AssignmentId);
    }

    public async Task UnassignDriverAsync(int transporterId, int driverId, int unassignedByUserId)
    {
        var current = await _db.DriverTransporterHistories
            .FirstOrDefaultAsync(h => h.TransporterId == transporterId && h.DriverId == driverId && h.IsCurrent && !h.IsDeleted)
            ?? throw new KeyNotFoundException($"No current assignment found for driver {driverId} at transporter {transporterId}.");

        current.IsCurrent = false;
        current.EndDate = DateTime.UtcNow;
        current.UpdatedBy = unassignedByUserId;

        await _db.SaveChangesAsync();
    }

    public async Task<IReadOnlyList<DriverTransporterAssignmentDto>> GetAssignmentHistoryAsync(int transporterId)
    {
        var history = await _db.DriverTransporterHistories
            .Include(h => h.Driver)
            .Include(h => h.Transporter)
            .Where(h => h.TransporterId == transporterId && !h.IsDeleted)
            .OrderByDescending(h => h.AssignmentDate)
            .ToListAsync();

        return history.Select(ToAssignmentDto).ToList();
    }

    private async Task<DriverTransporterAssignmentDto> LoadAssignmentDtoAsync(int assignmentId)
    {
        var assignment = await _db.DriverTransporterHistories
            .Include(h => h.Driver)
            .Include(h => h.Transporter)
            .FirstAsync(h => h.AssignmentId == assignmentId);

        return ToAssignmentDto(assignment);
    }

    private static TransporterDto ToDto(Transporter t) => new()
    {
        TransporterId = t.TransporterId,
        Name = t.Name,
        ContactPerson = t.ContactPerson,
        Mobile = t.Mobile,
        Address = t.Address,
        AgreementValidTill = t.AgreementValidTill,
        IsActive = t.IsActive,
        CurrentDriverCount = t.DriverAssignments.Count(a => a.IsCurrent && !a.IsDeleted)
    };

    private static DriverTransporterAssignmentDto ToAssignmentDto(DriverTransporterHistory h) => new()
    {
        AssignmentId = h.AssignmentId,
        DriverId = h.DriverId,
        DriverName = h.Driver?.FullName ?? string.Empty,
        TransporterId = h.TransporterId,
        TransporterName = h.Transporter?.Name ?? string.Empty,
        AssignmentDate = h.AssignmentDate,
        EndDate = h.EndDate,
        IsCurrent = h.IsCurrent
    };
}

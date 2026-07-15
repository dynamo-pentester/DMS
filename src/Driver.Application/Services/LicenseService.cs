using Microsoft.EntityFrameworkCore;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;
using DriverDms.Domain.Entities;

namespace DriverDms.Application.Services;

public class LicenseService : ILicenseService
{
    private readonly IApplicationDbContext _db;
    private readonly LicenseStatusResolver _statusResolver;
    private readonly INotificationService _notifications;

    public LicenseService(IApplicationDbContext db, LicenseStatusResolver statusResolver, INotificationService notifications)
    {
        _db = db;
        _statusResolver = statusResolver;
        _notifications = notifications;
    }

    public async Task<LicenseDto?> GetByIdAsync(int licenseId)
    {
        var license = await _db.Licenses
            .Include(l => l.Driver)
            .Include(l => l.VehicleType)
            .Include(l => l.LicenseEndorsements).ThenInclude(le => le.Endorsement)
            .FirstOrDefaultAsync(l => l.LicenseId == licenseId && !l.IsDeleted);

        return license is null ? null : await ToDto(license);
    }

    public async Task<PagedResult<LicenseDto>> SearchAsync(LicenseSearchRequest request)
    {
        var query = _db.Licenses
            .Include(l => l.Driver)
            .Include(l => l.VehicleType)
            .Include(l => l.LicenseEndorsements).ThenInclude(le => le.Endorsement)
            .Where(l => !l.IsDeleted);

        if (request.DriverId.HasValue)
            query = query.Where(l => l.DriverId == request.DriverId.Value);

        // Pull into memory for status filtering (status is computed, not stored)
        var all = await query.OrderBy(l => l.ValidTill).ToListAsync();

        // Resolve status for each license
        var withStatus = new List<(License license, string status)>();
        foreach (var l in all)
        {
            var status = await _statusResolver.GetStatusAsync(l);
            withStatus.Add((l, status));
        }

        // Filter by status if requested
        if (!string.IsNullOrWhiteSpace(request.Status))
            withStatus = withStatus.Where(x => x.status.Equals(request.Status, StringComparison.OrdinalIgnoreCase)).ToList();

        var total = withStatus.Count;
        var paged = withStatus
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var dtos = paged.Select(x => ToDto(x.license, x.status)).ToList();

        return new PagedResult<LicenseDto>
        {
            Items = dtos,
            TotalCount = total,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }

    public async Task<LicenseDto> CreateAsync(CreateLicenseRequest request, int createdByUserId)
    {
        // Validate driver exists
        var driverExists = await _db.Drivers.AnyAsync(d => d.DriverId == request.DriverId && !d.IsDeleted);
        if (!driverExists)
            throw new InvalidOperationException($"Driver {request.DriverId} not found.");

        if (request.ValidTill <= request.IssueDate)
            throw new InvalidOperationException("ValidTill must be after IssueDate.");

        var license = new License
        {
            DriverId = request.DriverId,
            LicenseNo = request.LicenseNo,
            IssueDate = request.IssueDate,
            ValidTill = request.ValidTill,
            VehicleTypeId = request.VehicleTypeId,
            CreatedBy = createdByUserId
        };

        _db.Licenses.Add(license);
        await _db.SaveChangesAsync();

        // Attach endorsements
        if (request.EndorsementIds.Any())
        {
            foreach (var endorsementId in request.EndorsementIds.Distinct())
            {
                _db.LicenseEndorsements.Add(new LicenseEndorsement
                {
                    LicenseId = license.LicenseId,
                    EndorsementId = endorsementId
                });
            }
            await _db.SaveChangesAsync();
        }

        var created = await GetByIdAsync(license.LicenseId)
            ?? throw new InvalidOperationException("Failed to reload created license.");

        // Notify Manager that a new license was added
        await _notifications.RaiseAsync(
            entityTypeName: "License",
            entityId: license.LicenseId,
            title: "New license added",
            message: $"License {license.LicenseNo} has been added for driver {created.DriverName}.",
            dueDate: license.ValidTill,
            targetRole: "HOD");

        return created;
    }

    public async Task<LicenseDto> UpdateAsync(int licenseId, UpdateLicenseRequest request, int updatedByUserId)
    {
        var license = await _db.Licenses
            .Include(l => l.LicenseEndorsements)
            .FirstOrDefaultAsync(l => l.LicenseId == licenseId && !l.IsDeleted)
            ?? throw new InvalidOperationException($"License {licenseId} not found.");

        if (request.ValidTill <= request.IssueDate)
            throw new InvalidOperationException("ValidTill must be after IssueDate.");

        license.LicenseNo = request.LicenseNo;
        license.IssueDate = request.IssueDate;
        license.ValidTill = request.ValidTill;
        license.VehicleTypeId = request.VehicleTypeId;
        license.UpdatedBy = updatedByUserId;

        // Replace endorsements: remove old, add new
        foreach (var old in license.LicenseEndorsements.ToList())
            _db.LicenseEndorsements.Remove(old);

        foreach (var endorsementId in request.EndorsementIds.Distinct())
        {
            _db.LicenseEndorsements.Add(new LicenseEndorsement
            {
                LicenseId = licenseId,
                EndorsementId = endorsementId
            });
        }

        await _db.SaveChangesAsync();

        return await GetByIdAsync(licenseId)
            ?? throw new InvalidOperationException("Failed to reload updated license.");
    }

    public async Task DeleteAsync(int licenseId, int deletedByUserId)
    {
        var license = await _db.Licenses
            .FirstOrDefaultAsync(l => l.LicenseId == licenseId && !l.IsDeleted)
            ?? throw new InvalidOperationException($"License {licenseId} not found.");

        license.DeletedBy = deletedByUserId;
        _db.Licenses.Remove(license); // SaveChangesAsync override converts to soft delete
        await _db.SaveChangesAsync();
    }

    // ---- mapping ----

    private async Task<LicenseDto> ToDto(License license)
    {
        var status = await _statusResolver.GetStatusAsync(license);
        return ToDto(license, status);
    }

    private static LicenseDto ToDto(License license, string status) => new()
    {
        LicenseId = license.LicenseId,
        DriverId = license.DriverId,
        DriverName = license.Driver?.FullName ?? string.Empty,
        LicenseNo = license.LicenseNo,
        IssueDate = license.IssueDate,
        ValidTill = license.ValidTill,
        VehicleTypeName = license.VehicleType?.Name ?? string.Empty,
        Endorsements = license.LicenseEndorsements
            .Where(le => le.Endorsement is not null)
            .Select(le => le.Endorsement!.Name)
            .ToList(),
        Status = status,
        HasDocument = !string.IsNullOrWhiteSpace(license.LicenceFilePath)
    };

    public async Task<string?> GetDocumentPathAsync(int licenseId)
    {
        var license = await _db.Licenses.FirstOrDefaultAsync(l => l.LicenseId == licenseId && !l.IsDeleted)
            ?? throw new InvalidOperationException($"License {licenseId} not found.");
        return license.LicenceFilePath;
    }

    public async Task SetDocumentPathAsync(int licenseId, string? relativePath, int updatedByUserId)
    {
        var license = await _db.Licenses.Include(l => l.Driver).FirstOrDefaultAsync(l => l.LicenseId == licenseId && !l.IsDeleted)
            ?? throw new InvalidOperationException($"License {licenseId} not found.");

        license.LicenceFilePath = relativePath;
        license.UpdatedBy = updatedByUserId;

        await _db.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(relativePath))
        {
            await _notifications.RaiseAsync(
                entityTypeName: "Document",
                entityId: licenseId,
                title: "Driving Licence document uploaded",
                message: $"Licence document uploaded for driver {license.Driver?.FullName ?? "Unknown"} (Licence No: {license.LicenseNo}).",
                dueDate: DateTime.UtcNow);
        }
    }
}

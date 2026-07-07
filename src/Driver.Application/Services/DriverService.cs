using Microsoft.EntityFrameworkCore;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;
using DriverDms.Domain.Entities;

namespace DriverDms.Application.Services;

public class DriverService : IDriverService
{
    private readonly IApplicationDbContext _db;

    public DriverService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<DriverDto?> GetByIdAsync(int id)
    {
        var driver = await _db.Drivers
            .Include(d => d.BloodGroup)
            .Include(d => d.CurrentStatus)
            .Include(d => d.TransporterHistory).ThenInclude(h => h.Transporter)
            .FirstOrDefaultAsync(d => d.DriverId == id && !d.IsDeleted);

        return driver is null ? null : ToDto(driver);
    }

    public async Task<PagedResult<DriverDto>> SearchAsync(DriverSearchRequest request)
    {
        var query = _db.Drivers
            .Include(d => d.BloodGroup)
            .Include(d => d.CurrentStatus)
            .Include(d => d.TransporterHistory).ThenInclude(h => h.Transporter)
            .Where(d => !d.IsDeleted)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim();
            query = query.Where(d =>
                d.DriverCode.Contains(term) ||
                d.FullName.Contains(term) ||
                d.Mobile.Contains(term));
        }

        if (request.StatusId.HasValue)
            query = query.Where(d => d.CurrentStatusId == request.StatusId.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(d => d.FullName)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        return new PagedResult<DriverDto>
        {
            Items = items.Select(ToDto).ToList(),
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }

    public async Task<DriverDto> CreateAsync(CreateDriverRequest request, int createdByUserId)
    {
        // Default status: Active (seed row is assumed to be DriverStatusTypeId = 1 -
        // adjust after seeding if your seed order differs)
        var activeStatus = await _db.DriverStatusTypes.FirstAsync(s => s.Name == "Active");

        var driver = new DriverDms.Domain.Entities.Driver
        {
            DriverCode = await GenerateDriverCodeAsync(),
            FullName = request.FullName,
            FatherName = request.FatherName,
            DateOfBirth = request.DateOfBirth,
            Mobile = request.Mobile,
            Address = request.Address,
            BloodGroupId = request.BloodGroupId,
            AadhaarLast4 = request.AadhaarNo is { Length: >= 4 } a ? a[^4..] : null,
            AadhaarNoEncrypted = request.AadhaarNo, // TODO: encrypt before storing - see design doc §2 PII note
            EmergencyContactName = request.EmergencyContactName,
            EmergencyContactRelation = request.EmergencyContactRelation,
            EmergencyContactPhone = request.EmergencyContactPhone,
            CurrentStatusId = activeStatus.DriverStatusTypeId,
            CreatedBy = createdByUserId
        };

        _db.Drivers.Add(driver);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(driver.DriverId)
            ?? throw new InvalidOperationException("Driver was created but could not be reloaded.");
    }

    public async Task<DriverDto> UpdateAsync(int driverId, UpdateDriverRequest request, int updatedByUserId)
    {
        var driver = await _db.Drivers.FirstOrDefaultAsync(d => d.DriverId == driverId && !d.IsDeleted)
            ?? throw new KeyNotFoundException($"Driver {driverId} not found.");

        // DriverCode, status, and Aadhaar are intentionally not editable here:
        // DriverCode is immutable once generated, status changes go through
        // UpdateStatusAsync (which also writes history), and Aadhaar isn't
        // re-collected on an edit form per the PII handling note in the design doc.
        driver.FullName = request.FullName;
        driver.FatherName = request.FatherName;
        driver.DateOfBirth = request.DateOfBirth;
        driver.Mobile = request.Mobile;
        driver.Address = request.Address;
        driver.BloodGroupId = request.BloodGroupId;
        driver.EmergencyContactName = request.EmergencyContactName;
        driver.EmergencyContactRelation = request.EmergencyContactRelation;
        driver.EmergencyContactPhone = request.EmergencyContactPhone;
        driver.Remarks = request.Remarks;
        driver.UpdatedBy = updatedByUserId;

        await _db.SaveChangesAsync();

        return await GetByIdAsync(driverId)
            ?? throw new InvalidOperationException("Driver was updated but could not be reloaded.");
    }

    public async Task UpdateStatusAsync(int driverId, int newStatusId, string? reason, int changedByUserId)
    {
        var driver = await _db.Drivers.FirstOrDefaultAsync(d => d.DriverId == driverId && !d.IsDeleted)
            ?? throw new KeyNotFoundException($"Driver {driverId} not found.");

        driver.CurrentStatusId = newStatusId;
        driver.UpdatedBy = changedByUserId;
        driver.UpdatedAt = DateTime.UtcNow;

        _db.DriverStatusHistories.Add(new DriverStatusHistory
        {
            DriverId = driverId,
            DriverStatusTypeId = newStatusId,
            Reason = reason,
            ChangedBy = changedByUserId
        });

        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(int driverId, int deletedByUserId)
    {
        var driver = await _db.Drivers.FirstOrDefaultAsync(d => d.DriverId == driverId && !d.IsDeleted)
            ?? throw new KeyNotFoundException($"Driver {driverId} not found.");

        // A hard Remove() here becomes a soft delete automatically - see
        // DriverDmsContext.ApplyAuditAndSoftDeleteConventions(), which intercepts
        // EntityState.Deleted and flips it to IsDeleted/DeletedAt instead.
        driver.DeletedBy = deletedByUserId;
        _db.Drivers.Remove(driver);
        await _db.SaveChangesAsync();
    }

  private async Task<string> GenerateDriverCodeAsync()
{
    var year = DateTime.UtcNow.Year;

    var lastDriverCode = await _db.Drivers
        .Where(d => d.DriverCode.StartsWith($"DRV-{year}-"))
        .OrderByDescending(d => d.DriverCode)
        .Select(d => d.DriverCode)
        .FirstOrDefaultAsync();

    Console.WriteLine("==================================");
    Console.WriteLine($"Last Driver Code = {lastDriverCode}");
    Console.WriteLine("==================================");

    int nextNumber = 1;

    if (!string.IsNullOrWhiteSpace(lastDriverCode))
    {
        var parts = lastDriverCode.Split('-');

        if (parts.Length == 3 && int.TryParse(parts[2], out int currentNumber))
        {
            nextNumber = currentNumber + 1;
        }
    }

    Console.WriteLine($"Next Number = {nextNumber}");

    return $"DRV-{year}-{nextNumber:D6}";
}
    private static DriverDto ToDto(DriverDms.Domain.Entities.Driver d) => new()
    {
        DriverId = d.DriverId,
        DriverCode = d.DriverCode,
        FullName = d.FullName,
        FatherName = d.FatherName,
        DateOfBirth = d.DateOfBirth,
        Mobile = d.Mobile,
        Address = d.Address,
        BloodGroupName = d.BloodGroup?.Name,
        AadhaarLast4 = d.AadhaarLast4,
        EmergencyContactName = d.EmergencyContactName,
        EmergencyContactRelation = d.EmergencyContactRelation,
        EmergencyContactPhone = d.EmergencyContactPhone,
        Remarks = d.Remarks,
        CurrentStatusName = d.CurrentStatus?.Name ?? string.Empty,
        CurrentTransporterName = d.CurrentTransporter?.Transporter?.Name
    };
}

using Microsoft.EntityFrameworkCore;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;
using DriverDms.Domain.Entities;

namespace DriverDms.Application.Services;

public class DriverService : IDriverService
{
    private readonly IApplicationDbContext _db;
    private readonly IFileStorageService _fileStorage;
    private readonly IIdentityService _identityService;
    private readonly INotificationService _notifications;

    public DriverService(IApplicationDbContext db, IFileStorageService fileStorage, IIdentityService identityService, INotificationService notifications)
    {
        _db = db;
        _fileStorage = fileStorage;
        _identityService = identityService;
        _notifications = notifications;
    }

    public async Task<DriverDto?> GetByIdAsync(int id)
    {
        var driver = await _db.Drivers
            .Include(d => d.BloodGroup)
            .Include(d => d.CurrentStatus)
            .Include(d => d.TransporterHistory).ThenInclude(h => h.Transporter)
            .Include(d => d.Licenses)
            .FirstOrDefaultAsync(d => d.DriverId == id && !d.IsDeleted);

        return driver is null ? null : ToDto(driver);
    }

    public async Task<PagedResult<DriverDto>> SearchAsync(DriverSearchRequest request)
    {
        var query = _db.Drivers
            .Include(d => d.BloodGroup)
            .Include(d => d.CurrentStatus)
            .Include(d => d.TransporterHistory).ThenInclude(h => h.Transporter)
            .Include(d => d.Licenses)
            .Where(d => !d.IsDeleted)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim();
            query = query.Where(d =>
                d.DriverCode.Contains(term) ||
                d.FullName.Contains(term) ||
                d.Mobile.Contains(term) ||
                d.Licenses.Any(l => l.LicenseNo.Contains(term)) ||
                d.Incidents.Any(i => i.Description.Contains(term) || (i.Location != null && i.Location.Contains(term)) || (i.IncidentType != null && i.IncidentType.Name.Contains(term))));
        }

        if (request.StatusId.HasValue)
            query = query.Where(d => d.CurrentStatusId == request.StatusId.Value);

        if (!string.IsNullOrWhiteSpace(request.ApprovalStatus))
            query = query.Where(d => d.ApprovalStatus == request.ApprovalStatus);

        if (!string.IsNullOrWhiteSpace(request.LicenseNo))
        {
            var licenseTerm = request.LicenseNo.Trim();
            query = query.Where(d => d.Licenses.Any(l => l.LicenseNo.Contains(licenseTerm)));
        }

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

    /// <inheritdoc />
    public async Task<DriverDto> CreateAsync(CreateDriverRequest request, int createdByUserId, string callerRole)
    {
        var activeStatus = await _db.DriverStatusTypes.FirstAsync(s => s.Name == "Active");

        bool isPrivileged = callerRole is "System Administrator" or "HOD";
        var approvalStatus = isPrivileged ? "Approved" : "PendingApproval";

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
            AadhaarNoEncrypted = request.AadhaarNo,
            EmergencyContactName = request.EmergencyContactName,
            EmergencyContactRelation = request.EmergencyContactRelation,
            EmergencyContactPhone = request.EmergencyContactPhone,
            CurrentStatusId = activeStatus.DriverStatusTypeId,
            ApprovalStatus = approvalStatus,
            ApprovedBy = isPrivileged ? createdByUserId : null,
            ApprovedDate = isPrivileged ? DateTime.UtcNow : null,
            CreatedBy = createdByUserId
        };

        _db.Drivers.Add(driver);
        await _db.SaveChangesAsync();

        // For employees: create an approval request assigned to a real Manager
        if (!isPrivileged)
        {
            var managerId = await _identityService.GetFirstManagerIdAsync();
            _db.DriverApprovals.Add(new DriverApproval
            {
                DriverId = driver.DriverId,
                RequestedByUserId = createdByUserId,
                AssignedToManagerId = managerId,
                Status = "PendingApproval",
                RequestedDate = DateTime.UtcNow,
                CreatedBy = createdByUserId
            });
            await _db.SaveChangesAsync();
        }

        // Notify Manager that a new driver record was created
        await _notifications.RaiseAsync(
            entityTypeName: "System",
            entityId: driver.DriverId,
            title: "New driver record created",
            message: $"Driver {driver.FullName} ({driver.DriverCode}) has been added to the system.",
            dueDate: DateTime.UtcNow,
            targetRole: "HOD");

        return await GetByIdAsync(driver.DriverId)
            ?? throw new InvalidOperationException("Driver was created but could not be reloaded.");
    }

    /// <inheritdoc />
    public async Task<DriverDto> CreateWithLicenseAsync(
        CreateDriverWithLicenseRequest request,
        int createdByUserId,
        string callerRole,
        IFormFileProxy? photo,
        IFormFileProxy? licenseDocument)
    {
        var activeStatus = await _db.DriverStatusTypes.FirstAsync(s => s.Name == "Active");

        bool isPrivileged = callerRole is "System Administrator" or "HOD";
        var approvalStatus = isPrivileged ? "Approved" : "PendingApproval";

        // ── 1. Save Driver ──────────────────────────────────────────────────────────
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
            AadhaarNoEncrypted = request.AadhaarNo,
            EmergencyContactName = request.EmergencyContactName,
            EmergencyContactRelation = request.EmergencyContactRelation,
            EmergencyContactPhone = request.EmergencyContactPhone,
            CurrentStatusId = activeStatus.DriverStatusTypeId,
            ApprovalStatus = approvalStatus,
            ApprovedBy = isPrivileged ? createdByUserId : null,
            ApprovedDate = isPrivileged ? DateTime.UtcNow : null,
            CreatedBy = createdByUserId
        };

        _db.Drivers.Add(driver);
        await _db.SaveChangesAsync(); // get DriverId assigned

        // ── 2. Save driver photo (optional) ────────────────────────────────────────
        if (photo is not null)
        {
            await using var photoStream = photo.OpenReadStream();
            var photoPath = await _fileStorage.SaveAsync(
                new FileUploadInput
                {
                    Content = photoStream,
                    OriginalFileName = photo.FileName,
                    ContentType = photo.ContentType,
                    Length = photo.Length
                },
                "drivers/photos",
                new[] { ".jpg", ".jpeg", ".png" },
                5 * 1024 * 1024);

            driver.DriverPhotoPath = photoPath;
            await _db.SaveChangesAsync();

            await _notifications.RaiseAsync(
                entityTypeName: "Document",
                entityId: driver.DriverId,
                title: "Driver Photo uploaded",
                message: $"Photo uploaded for driver {driver.FullName}.",
                dueDate: DateTime.UtcNow);
        }

        // ── 3. Save License (optional — only when LicenseNo is provided) ───────────
        if (!string.IsNullOrWhiteSpace(request.LicenseNo)
            && request.LicenseIssueDate.HasValue
            && request.LicenseValidTill.HasValue
            && request.VehicleTypeId.HasValue)
        {
            if (request.LicenseValidTill.Value <= request.LicenseIssueDate.Value)
                throw new InvalidOperationException("License ValidTill must be after IssueDate.");

            var license = new License
            {
                DriverId = driver.DriverId,
                LicenseNo = request.LicenseNo,
                IssueDate = request.LicenseIssueDate.Value,
                ValidTill = request.LicenseValidTill.Value,
                VehicleTypeId = request.VehicleTypeId.Value,
                CreatedBy = createdByUserId
            };

            _db.Licenses.Add(license);
            await _db.SaveChangesAsync(); // get LicenseId assigned

            // Endorsements
            foreach (var eid in request.EndorsementIds.Distinct())
            {
                _db.LicenseEndorsements.Add(new LicenseEndorsement
                {
                    LicenseId = license.LicenseId,
                    EndorsementId = eid
                });
            }

            // License document (optional)
            if (licenseDocument is not null)
            {
                await using var docStream = licenseDocument.OpenReadStream();
                var docPath = await _fileStorage.SaveAsync(
                    new FileUploadInput
                    {
                        Content = docStream,
                        OriginalFileName = licenseDocument.FileName,
                        ContentType = licenseDocument.ContentType,
                        Length = licenseDocument.Length
                    },
                    "licenses/documents",
                    new[] { ".pdf", ".jpg", ".jpeg", ".png" },
                    10 * 1024 * 1024);

                license.LicenceFilePath = docPath;
                await _db.SaveChangesAsync();

                await _notifications.RaiseAsync(
                    entityTypeName: "Document",
                    entityId: license.LicenseId,
                    title: "Driving Licence document uploaded",
                    message: $"Licence document uploaded for driver {driver.FullName} (Licence No: {license.LicenseNo}).",
                    dueDate: DateTime.UtcNow);
            }
            else
            {
                await _db.SaveChangesAsync();
            }
        }

        // ── 4. Approval request for Employees — assigned to first available Manager ──
        if (!isPrivileged)
        {
            var managerId = await _identityService.GetFirstManagerIdAsync();
            _db.DriverApprovals.Add(new DriverApproval
            {
                DriverId = driver.DriverId,
                RequestedByUserId = createdByUserId,
                AssignedToManagerId = managerId,
                Status = "PendingApproval",
                RequestedDate = DateTime.UtcNow,
                CreatedBy = createdByUserId
            });
            await _db.SaveChangesAsync();
        }

        // Notify Manager that a new driver record was created
        await _notifications.RaiseAsync(
            entityTypeName: "System",
            entityId: driver.DriverId,
            title: "New driver record created",
            message: $"Driver {driver.FullName} ({driver.DriverCode}) has been added to the system.",
            dueDate: DateTime.UtcNow,
            targetRole: "HOD");

        return await GetByIdAsync(driver.DriverId)
            ?? throw new InvalidOperationException("Driver was created but could not be reloaded.");
    }

    public async Task<DriverDto> UpdateAsync(int driverId, UpdateDriverRequest request, int updatedByUserId)
    {
        var driver = await _db.Drivers.FirstOrDefaultAsync(d => d.DriverId == driverId && !d.IsDeleted)
            ?? throw new KeyNotFoundException($"Driver {driverId} not found.");

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

        // ── Apology-letter gate: a Blacklisted driver can only be moved to a
        // different status once at least one corrective action on one of their
        // incidents has a letter-of-apology / supporting attachment uploaded.
        // (The block itself is automatic and needs no gate - see IncidentService.CreateAsync.)
        var blacklistedStatus = await _db.DriverStatusTypes.FirstOrDefaultAsync(s => s.Name == "Blacklisted");
        if (blacklistedStatus is not null
            && driver.CurrentStatusId == blacklistedStatus.DriverStatusTypeId
            && newStatusId != blacklistedStatus.DriverStatusTypeId)
        {
            var hasApologyAttachment = await _db.CorrectiveActions
                .Where(c => !c.IsDeleted && c.Incident != null && c.Incident.DriverId == driverId)
                .AnyAsync(c => c.AttachmentPath != null && c.AttachmentPath != "");

            if (!hasApologyAttachment)
            {
                throw new InvalidOperationException(
                    "This driver is blacklisted. A letter of apology must be attached to a corrective " +
                    "action on one of their incidents before the status can be changed.");
            }
        }

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

        driver.DeletedBy = deletedByUserId;
        _db.Drivers.Remove(driver);
        await _db.SaveChangesAsync();
    }

    public async Task<string?> GetPhotoPathAsync(int driverId)
    {
        var driver = await _db.Drivers.FirstOrDefaultAsync(d => d.DriverId == driverId && !d.IsDeleted)
            ?? throw new KeyNotFoundException($"Driver {driverId} not found.");
        return driver.DriverPhotoPath;
    }

    public async Task SetPhotoPathAsync(int driverId, string? relativePath, int updatedByUserId)
    {
        var driver = await _db.Drivers.FirstOrDefaultAsync(d => d.DriverId == driverId && !d.IsDeleted)
            ?? throw new KeyNotFoundException($"Driver {driverId} not found.");

        driver.DriverPhotoPath = relativePath;
        driver.UpdatedBy = updatedByUserId;
        driver.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(relativePath))
        {
            await _notifications.RaiseAsync(
                entityTypeName: "Document",
                entityId: driverId,
                title: "Driver Photo uploaded",
                message: $"Photo uploaded for driver {driver.FullName}.",
                dueDate: DateTime.UtcNow);
        }
    }

    private async Task<string> GenerateDriverCodeAsync()
    {
        var year = DateTime.UtcNow.Year;

        var lastDriverCode = await _db.Drivers
            .Where(d => d.DriverCode.StartsWith($"DRV-{year}-"))
            .OrderByDescending(d => d.DriverCode)
            .Select(d => d.DriverCode)
            .FirstOrDefaultAsync();

        int nextNumber = 1;

        if (!string.IsNullOrWhiteSpace(lastDriverCode))
        {
            var parts = lastDriverCode.Split('-');
            if (parts.Length == 3 && int.TryParse(parts[2], out int currentNumber))
                nextNumber = currentNumber + 1;
        }

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
        CurrentTransporterName = d.CurrentTransporter?.Transporter?.Name,
        LicenseNo = d.Licenses.OrderByDescending(l => l.ValidTill).FirstOrDefault()?.LicenseNo,
        ApprovalStatus = d.ApprovalStatus,
        ApprovedBy = d.ApprovedBy,
        ApprovedDate = d.ApprovedDate,
        HasPhoto = !string.IsNullOrWhiteSpace(d.DriverPhotoPath)
    };
}

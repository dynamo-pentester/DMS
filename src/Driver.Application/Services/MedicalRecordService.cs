using Microsoft.EntityFrameworkCore;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;
using DriverDms.Domain.Entities;

namespace DriverDms.Application.Services;

public class MedicalRecordService : IMedicalRecordService
{
    private readonly IApplicationDbContext _db;
    private readonly MedicalStatusResolver _statusResolver;
    private readonly INotificationService _notifications;

    public MedicalRecordService(IApplicationDbContext db, MedicalStatusResolver statusResolver, INotificationService notifications)
    {
        _db = db;
        _statusResolver = statusResolver;
        _notifications = notifications;
    }

    public async Task<MedicalRecordDto?> GetByIdAsync(int medicalRecordId)
    {
        var record = await _db.MedicalRecords
            .Include(m => m.Driver)
            .Include(m => m.FitnessStatus)
            .FirstOrDefaultAsync(m => m.MedicalRecordId == medicalRecordId && !m.IsDeleted);

        return record is null ? null : await ToDto(record);
    }

    public async Task<PagedResult<MedicalRecordDto>> SearchAsync(MedicalRecordSearchRequest request)
    {
        var query = _db.MedicalRecords
            .Include(m => m.Driver)
            .Include(m => m.FitnessStatus)
            .Where(m => !m.IsDeleted);

        if (request.DriverId.HasValue)
            query = query.Where(m => m.DriverId == request.DriverId.Value);

        if (!string.IsNullOrWhiteSpace(request.LicenseNo))
        {
            var licenseTerm = request.LicenseNo.Trim();
            query = query.Where(m => m.Driver != null && m.Driver.Licenses.Any(l => l.LicenseNo.Contains(licenseTerm)));
        }

        // Pull into memory for status filtering (status is computed, not stored -
        // same reasoning as LicenseService).
        var all = await query.OrderBy(m => m.ValidTill).ToListAsync();

        var withStatus = new List<(MedicalRecord record, string status)>();
        foreach (var m in all)
        {
            var status = await _statusResolver.GetStatusAsync(m);
            withStatus.Add((m, status));
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
            withStatus = withStatus.Where(x => x.status.Equals(request.Status, StringComparison.OrdinalIgnoreCase)).ToList();

        var total = withStatus.Count;
        var paged = withStatus
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var dtos = paged.Select(x => ToDto(x.record, x.status)).ToList();

        return new PagedResult<MedicalRecordDto>
        {
            Items = dtos,
            TotalCount = total,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }

    public async Task<MedicalRecordDto> CreateAsync(CreateMedicalRecordRequest request, int createdByUserId)
    {
        var driverExists = await _db.Drivers.AnyAsync(d => d.DriverId == request.DriverId && !d.IsDeleted);
        if (!driverExists)
            throw new InvalidOperationException($"Driver {request.DriverId} not found.");

        if (request.ValidTill <= request.ExamDate)
            throw new InvalidOperationException("ValidTill must be after ExamDate.");

        var record = new MedicalRecord
        {
            DriverId = request.DriverId,
            ExamDate = request.ExamDate,
            FitnessStatusId = request.FitnessStatusId,
            BP = request.BP,
            VisionTestPass = request.VisionTestPass,
            AlcoholTestPass = request.AlcoholTestPass,
            ChronicIllness = request.ChronicIllness,
            ChronicIllnessRemarks = request.ChronicIllnessRemarks,
            ValidTill = request.ValidTill,
            CreatedBy = createdByUserId
        };

        _db.MedicalRecords.Add(record);
        await _db.SaveChangesAsync();

        var created = await GetByIdAsync(record.MedicalRecordId)
            ?? throw new InvalidOperationException("Failed to reload created medical record.");

        // Notify Manager that a new medical record was added
        await _notifications.RaiseAsync(
            entityTypeName: "Medical",
            entityId: record.MedicalRecordId,
            title: "New medical record added",
            message: $"Medical fitness record for driver {created.DriverName} has been added (valid till {record.ValidTill:d}).",
            dueDate: record.ValidTill,
            targetRole: "HOD");

        return created;
    }

    public async Task<MedicalRecordDto> UpdateAsync(int medicalRecordId, UpdateMedicalRecordRequest request, int updatedByUserId)
    {
        var record = await _db.MedicalRecords
            .FirstOrDefaultAsync(m => m.MedicalRecordId == medicalRecordId && !m.IsDeleted)
            ?? throw new InvalidOperationException($"Medical record {medicalRecordId} not found.");

        if (request.ValidTill <= request.ExamDate)
            throw new InvalidOperationException("ValidTill must be after ExamDate.");

        record.ExamDate = request.ExamDate;
        record.FitnessStatusId = request.FitnessStatusId;
        record.BP = request.BP;
        record.VisionTestPass = request.VisionTestPass;
        record.AlcoholTestPass = request.AlcoholTestPass;
        record.ChronicIllness = request.ChronicIllness;
        record.ChronicIllnessRemarks = request.ChronicIllnessRemarks;
        record.ValidTill = request.ValidTill;
        record.UpdatedBy = updatedByUserId;

        await _db.SaveChangesAsync();

        return await GetByIdAsync(medicalRecordId)
            ?? throw new InvalidOperationException("Failed to reload updated medical record.");
    }

    public async Task DeleteAsync(int medicalRecordId, int deletedByUserId)
    {
        var record = await _db.MedicalRecords
            .FirstOrDefaultAsync(m => m.MedicalRecordId == medicalRecordId && !m.IsDeleted)
            ?? throw new InvalidOperationException($"Medical record {medicalRecordId} not found.");

        record.DeletedBy = deletedByUserId;
        _db.MedicalRecords.Remove(record); // SaveChangesAsync override converts to soft delete
        await _db.SaveChangesAsync();
    }

    // ---- mapping ----

    private async Task<MedicalRecordDto> ToDto(MedicalRecord record)
    {
        var status = await _statusResolver.GetStatusAsync(record);
        return ToDto(record, status);
    }

    private static MedicalRecordDto ToDto(MedicalRecord record, string status) => new()
    {
        MedicalRecordId = record.MedicalRecordId,
        DriverId = record.DriverId,
        DriverName = record.Driver?.FullName ?? string.Empty,
        ExamDate = record.ExamDate,
        FitnessStatusName = record.FitnessStatus?.Name ?? string.Empty,
        BP = record.BP,
        VisionTestPass = record.VisionTestPass,
        AlcoholTestPass = record.AlcoholTestPass,
        ChronicIllness = record.ChronicIllness,
        ChronicIllnessRemarks = record.ChronicIllnessRemarks,
        ValidTill = record.ValidTill,
        Status = status,
        HasCertificate = !string.IsNullOrWhiteSpace(record.MedicalCertificatePath)
    };

    public async Task<string?> GetCertificatePathAsync(int medicalRecordId)
    {
        var record = await _db.MedicalRecords.FirstOrDefaultAsync(m => m.MedicalRecordId == medicalRecordId && !m.IsDeleted)
            ?? throw new InvalidOperationException($"Medical record {medicalRecordId} not found.");
        return record.MedicalCertificatePath;
    }

    public async Task SetCertificatePathAsync(int medicalRecordId, string? relativePath, int updatedByUserId)
    {
        var record = await _db.MedicalRecords.Include(m => m.Driver).FirstOrDefaultAsync(m => m.MedicalRecordId == medicalRecordId && !m.IsDeleted)
            ?? throw new InvalidOperationException($"Medical record {medicalRecordId} not found.");

        record.MedicalCertificatePath = relativePath;
        record.UpdatedBy = updatedByUserId;

        await _db.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(relativePath))
        {
            await _notifications.RaiseAsync(
                entityTypeName: "Document",
                entityId: medicalRecordId,
                title: "Medical Certificate uploaded",
                message: $"Medical certificate uploaded for driver {record.Driver?.FullName ?? "Unknown"}.",
                dueDate: DateTime.UtcNow);
        }
    }
}

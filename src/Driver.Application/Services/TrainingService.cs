using Microsoft.EntityFrameworkCore;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;
using DriverDms.Domain.Entities;

namespace DriverDms.Application.Services;

public class TrainingService : ITrainingService
{
    private readonly IApplicationDbContext _db;
    private readonly TrainingStatusResolver _statusResolver;
    private readonly INotificationService _notifications;

    public TrainingService(IApplicationDbContext db, TrainingStatusResolver statusResolver, INotificationService notifications)
    {
        _db = db;
        _statusResolver = statusResolver;
        _notifications = notifications;
    }

    public async Task<TrainingDto?> GetByIdAsync(int trainingId)
    {
        var training = await _db.Trainings
            .Include(t => t.Driver)
            .Include(t => t.TrainingType)
            .FirstOrDefaultAsync(t => t.TrainingId == trainingId && !t.IsDeleted);

        return training is null ? null : await ToDto(training);
    }

    public async Task<PagedResult<TrainingDto>> SearchAsync(TrainingSearchRequest request)
    {
        var query = _db.Trainings
            .Include(t => t.Driver)
            .Include(t => t.TrainingType)
            .Where(t => !t.IsDeleted);

        if (request.DriverId.HasValue)
            query = query.Where(t => t.DriverId == request.DriverId.Value);

        if (!string.IsNullOrWhiteSpace(request.LicenseNo))
        {
            var licenseTerm = request.LicenseNo.Trim();
            query = query.Where(t => t.Driver != null && t.Driver.Licenses.Any(l => l.LicenseNo.Contains(licenseTerm)));
        }

        // Pull into memory for status filtering (status is computed, not stored -
        // same reasoning as LicenseService/MedicalRecordService).
        var all = await query.OrderBy(t => t.ValidUpto).ToListAsync();

        var withStatus = new List<(Training training, string status)>();
        foreach (var t in all)
        {
            var status = await _statusResolver.GetStatusAsync(t);
            withStatus.Add((t, status));
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
            withStatus = withStatus.Where(x => x.status.Equals(request.Status, StringComparison.OrdinalIgnoreCase)).ToList();

        var total = withStatus.Count;
        var paged = withStatus
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var dtos = paged.Select(x => ToDto(x.training, x.status)).ToList();

        return new PagedResult<TrainingDto>
        {
            Items = dtos,
            TotalCount = total,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }

    public async Task<TrainingDto> CreateAsync(CreateTrainingRequest request, int createdByUserId)
    {
        var driverExists = await _db.Drivers.AnyAsync(d => d.DriverId == request.DriverId && !d.IsDeleted);
        if (!driverExists)
            throw new InvalidOperationException($"Driver {request.DriverId} not found.");

        if (request.ValidUpto <= request.DateCompleted)
            throw new InvalidOperationException("ValidUpto must be after DateCompleted.");

        var training = new Training
        {
            DriverId = request.DriverId,
            TrainingTypeId = request.TrainingTypeId,
            DateCompleted = request.DateCompleted,
            ValidUpto = request.ValidUpto,
            TrainerName = request.TrainerName,
            CreatedBy = createdByUserId
        };

        _db.Trainings.Add(training);
        await _db.SaveChangesAsync();

        var created = await GetByIdAsync(training.TrainingId)
            ?? throw new InvalidOperationException("Failed to reload created training record.");

        // Notify Manager that a new training record was added
        await _notifications.RaiseAsync(
            entityTypeName: "Training",
            entityId: training.TrainingId,
            title: "New training record added",
            message: $"Training '{created.TrainingTypeName}' for driver {created.DriverName} has been recorded (valid till {training.ValidUpto:d}).",
            dueDate: training.ValidUpto,
            targetRole: "HOD");

        return created;
    }

    public async Task<TrainingDto> UpdateAsync(int trainingId, UpdateTrainingRequest request, int updatedByUserId)
    {
        var training = await _db.Trainings
            .FirstOrDefaultAsync(t => t.TrainingId == trainingId && !t.IsDeleted)
            ?? throw new InvalidOperationException($"Training record {trainingId} not found.");

        if (request.ValidUpto <= request.DateCompleted)
            throw new InvalidOperationException("ValidUpto must be after DateCompleted.");

        training.TrainingTypeId = request.TrainingTypeId;
        training.DateCompleted = request.DateCompleted;
        training.ValidUpto = request.ValidUpto;
        training.TrainerName = request.TrainerName;
        training.UpdatedBy = updatedByUserId;

        await _db.SaveChangesAsync();

        return await GetByIdAsync(trainingId)
            ?? throw new InvalidOperationException("Failed to reload updated training record.");
    }

    public async Task DeleteAsync(int trainingId, int deletedByUserId)
    {
        var training = await _db.Trainings
            .FirstOrDefaultAsync(t => t.TrainingId == trainingId && !t.IsDeleted)
            ?? throw new InvalidOperationException($"Training record {trainingId} not found.");

        training.DeletedBy = deletedByUserId;
        _db.Trainings.Remove(training); // SaveChangesAsync override converts to soft delete
        await _db.SaveChangesAsync();
    }

    // ---- mapping ----

    private async Task<TrainingDto> ToDto(Training training)
    {
        var status = await _statusResolver.GetStatusAsync(training);
        return ToDto(training, status);
    }

    private static TrainingDto ToDto(Training training, string status) => new()
    {
        TrainingId = training.TrainingId,
        DriverId = training.DriverId,
        DriverName = training.Driver?.FullName ?? string.Empty,
        TrainingTypeName = training.TrainingType?.Name ?? string.Empty,
        DateCompleted = training.DateCompleted,
        ValidUpto = training.ValidUpto,
        TrainerName = training.TrainerName,
        Status = status
    };
}

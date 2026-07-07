using Microsoft.EntityFrameworkCore;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;
using DriverDms.Domain.Entities;

namespace DriverDms.Application.Services;

public class PlantMovementService : IPlantMovementService
{
    private readonly IApplicationDbContext _db;

    public PlantMovementService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PlantMovementDto?> GetByIdAsync(int movementId)
    {
        var movement = await LoadFullQuery()
            .FirstOrDefaultAsync(p => p.MovementId == movementId && !p.IsDeleted);
        return movement is null ? null : ToDto(movement);
    }

    public async Task<PagedResult<PlantMovementDto>> SearchAsync(PlantMovementSearchRequest request)
    {
        var query = LoadFullQuery().Where(p => !p.IsDeleted);

        if (request.DriverId.HasValue)
            query = query.Where(p => p.DriverId == request.DriverId.Value);

        if (request.OnSiteOnly == true)
            query = query.Where(p => p.DateOfExit == null);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(p => p.DateOfEntry)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        return new PagedResult<PlantMovementDto>
        {
            Items = items.Select(ToDto).ToList(),
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }

    public async Task<PlantMovementDto> RecordEntryAsync(CreatePlantMovementRequest request, int authorizedByUserId)
    {
        var driverExists = await _db.Drivers.AnyAsync(d => d.DriverId == request.DriverId && !d.IsDeleted);
        if (!driverExists)
            throw new InvalidOperationException($"Driver {request.DriverId} not found.");

        var movement = new PlantMovement
        {
            DriverId = request.DriverId,
            VehicleNo = request.VehicleNo,
            DateOfEntry = request.DateOfEntry ?? DateTime.UtcNow,
            PurposeTypeId = request.PurposeTypeId,
            GateNumberId = request.GateNumberId,
            EntryAuthorizedBy = authorizedByUserId,
            CreatedBy = authorizedByUserId
        };

        _db.PlantMovements.Add(movement);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(movement.MovementId)
            ?? throw new InvalidOperationException("Failed to reload created movement.");
    }

    public async Task<PlantMovementDto> RecordExitAsync(int movementId, RecordExitRequest request)
    {
        var movement = await _db.PlantMovements.FirstOrDefaultAsync(p => p.MovementId == movementId && !p.IsDeleted)
            ?? throw new InvalidOperationException($"Plant movement {movementId} not found.");

        if (movement.DateOfExit is not null)
            throw new InvalidOperationException($"Movement {movementId} already has an exit recorded.");

        var exitTime = request.DateOfExit ?? DateTime.UtcNow;
        if (exitTime < movement.DateOfEntry)
            throw new InvalidOperationException("Exit time cannot be before entry time.");

        movement.DateOfExit = exitTime;
        await _db.SaveChangesAsync();

        return await GetByIdAsync(movementId)
            ?? throw new InvalidOperationException("Failed to reload updated movement.");
    }

    private IQueryable<PlantMovement> LoadFullQuery() => _db.PlantMovements
        .Include(p => p.Driver)
        .Include(p => p.PurposeType)
        .Include(p => p.GateNumber);

    private static PlantMovementDto ToDto(PlantMovement m) => new()
    {
        MovementId = m.MovementId,
        DriverId = m.DriverId,
        DriverName = m.Driver?.FullName ?? string.Empty,
        VehicleNo = m.VehicleNo,
        DateOfEntry = m.DateOfEntry,
        DateOfExit = m.DateOfExit,
        PurposeTypeName = m.PurposeType?.Name ?? string.Empty,
        GateNumberName = m.GateNumber?.Name ?? string.Empty,
        IsOnSite = m.DateOfExit is null
    };
}

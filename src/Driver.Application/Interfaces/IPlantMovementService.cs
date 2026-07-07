using DriverDms.Application.DTOs;

namespace DriverDms.Application.Interfaces;

public interface IPlantMovementService
{
    Task<PlantMovementDto?> GetByIdAsync(int movementId);
    Task<PagedResult<PlantMovementDto>> SearchAsync(PlantMovementSearchRequest request);
    Task<PlantMovementDto> RecordEntryAsync(CreatePlantMovementRequest request, int authorizedByUserId);
    Task<PlantMovementDto> RecordExitAsync(int movementId, RecordExitRequest request);
}

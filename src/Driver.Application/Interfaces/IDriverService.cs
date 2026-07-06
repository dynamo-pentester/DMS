using DriverDms.Application.DTOs;

namespace DriverDms.Application.Interfaces;

public interface IDriverService
{
    Task<DriverDto?> GetByIdAsync(int id);
    Task<PagedResult<DriverDto>> SearchAsync(DriverSearchRequest request);
    Task<DriverDto> CreateAsync(CreateDriverRequest request, int createdByUserId);
    Task<DriverDto> UpdateAsync(int driverId, UpdateDriverRequest request, int updatedByUserId);
    Task UpdateStatusAsync(int driverId, int newStatusId, string? reason, int changedByUserId);
    Task DeleteAsync(int driverId, int deletedByUserId);
}

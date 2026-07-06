using DriverDms.Application.DTOs;

namespace DriverDms.Application.Interfaces;

public interface ITransporterService
{
    Task<TransporterDto?> GetByIdAsync(int id);
    Task<PagedResult<TransporterDto>> SearchAsync(TransporterSearchRequest request);
    Task<TransporterDto> CreateAsync(CreateTransporterRequest request, int createdByUserId);
    Task<TransporterDto> UpdateAsync(int transporterId, UpdateTransporterRequest request, int updatedByUserId);
    Task DeleteAsync(int transporterId, int deletedByUserId);

    // Assignment history is tracked via DriverTransporterHistory - only one row per
    // driver can have IsCurrent = true at a time (enforced by a filtered unique index).
    Task<DriverTransporterAssignmentDto> AssignDriverAsync(int transporterId, AssignDriverRequest request, int assignedByUserId);
    Task UnassignDriverAsync(int transporterId, int driverId, int unassignedByUserId);
    Task<IReadOnlyList<DriverTransporterAssignmentDto>> GetAssignmentHistoryAsync(int transporterId);
}

using DriverDms.Application.DTOs;

namespace DriverDms.Application.Interfaces;

public interface IIncidentService
{
    Task<IncidentDto?> GetByIdAsync(int incidentId);
    Task<PagedResult<IncidentDto>> SearchAsync(IncidentSearchRequest request);
    Task<IncidentDto> CreateAsync(CreateIncidentRequest request, int createdByUserId);
    Task<IncidentDto> UpdateAsync(int incidentId, UpdateIncidentRequest request, int updatedByUserId);
    Task DeleteAsync(int incidentId, int deletedByUserId);
    Task<CorrectiveActionDto> AddCorrectiveActionAsync(int incidentId, AddCorrectiveActionRequest request, int createdByUserId);
}

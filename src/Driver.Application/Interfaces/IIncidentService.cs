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

    /// <summary>Relative storage path of the incident report, or null if none uploaded.</summary>
    Task<string?> GetReportPathAsync(int incidentId);

    /// <summary>Sets (or clears, if null) the incident's stored report path.</summary>
    Task SetReportPathAsync(int incidentId, string? relativePath, int updatedByUserId);

    /// <summary>Relative storage path of a corrective action's attachment, or null if none uploaded.</summary>
    Task<string?> GetCorrectiveActionAttachmentPathAsync(int incidentId, int correctiveActionId);

    /// <summary>Sets (or clears, if null) a corrective action's stored attachment path.</summary>
    Task SetCorrectiveActionAttachmentPathAsync(int incidentId, int correctiveActionId, string? relativePath, int updatedByUserId);

    /// <summary>Relative storage path of a corrective action's apology document, or null if none uploaded.</summary>
    Task<string?> GetApologyDocumentPathAsync(int correctiveActionId);

    /// <summary>Sets the corrective action's stored apology document path.</summary>
    Task SetApologyDocumentPathAsync(int correctiveActionId, string path, int updatedByUserId);
}

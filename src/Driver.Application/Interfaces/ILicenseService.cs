using DriverDms.Application.DTOs;

namespace DriverDms.Application.Interfaces;

public interface ILicenseService
{
    Task<LicenseDto?> GetByIdAsync(int licenseId);
    Task<PagedResult<LicenseDto>> SearchAsync(LicenseSearchRequest request);
    Task<LicenseDto> CreateAsync(CreateLicenseRequest request, int createdByUserId);
    Task<LicenseDto> UpdateAsync(int licenseId, UpdateLicenseRequest request, int updatedByUserId);
    Task DeleteAsync(int licenseId, int deletedByUserId);

    /// <summary>Relative storage path of the license's scanned document, or null if none uploaded.</summary>
    Task<string?> GetDocumentPathAsync(int licenseId);

    /// <summary>Sets (or clears, if null) the license's stored document path.</summary>
    Task SetDocumentPathAsync(int licenseId, string? relativePath, int updatedByUserId);
}

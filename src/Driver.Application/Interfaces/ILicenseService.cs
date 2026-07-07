using DriverDms.Application.DTOs;

namespace DriverDms.Application.Interfaces;

public interface ILicenseService
{
    Task<LicenseDto?> GetByIdAsync(int licenseId);
    Task<PagedResult<LicenseDto>> SearchAsync(LicenseSearchRequest request);
    Task<LicenseDto> CreateAsync(CreateLicenseRequest request, int createdByUserId);
    Task<LicenseDto> UpdateAsync(int licenseId, UpdateLicenseRequest request, int updatedByUserId);
    Task DeleteAsync(int licenseId, int deletedByUserId);
}

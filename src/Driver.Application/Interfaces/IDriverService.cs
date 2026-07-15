using DriverDms.Application.DTOs;

namespace DriverDms.Application.Interfaces;

public interface IDriverService
{
    Task<DriverDto?> GetByIdAsync(int id);
    Task<PagedResult<DriverDto>> SearchAsync(DriverSearchRequest request);

    /// <summary>
    /// Creates a driver. callerRole is used to set ApprovalStatus:
    ///   Admin/Manager → "Approved" immediately.
    ///   Employee       → "PendingApproval" + creates a DriverApproval request.
    /// </summary>
    Task<DriverDto> CreateAsync(CreateDriverRequest request, int createdByUserId, string callerRole);

    /// <summary>
    /// Transactional create of Driver + License in a single SaveChanges call.
    /// Used by the 2-step creation wizard (POST /api/drivers/with-license).
    /// </summary>
    Task<DriverDto> CreateWithLicenseAsync(CreateDriverWithLicenseRequest request, int createdByUserId, string callerRole, IFormFileProxy? photo, IFormFileProxy? licenseDocument);

    Task<DriverDto> UpdateAsync(int driverId, UpdateDriverRequest request, int updatedByUserId);
    Task UpdateStatusAsync(int driverId, int newStatusId, string? reason, int changedByUserId);
    Task DeleteAsync(int driverId, int deletedByUserId);

    /// <summary>Relative storage path of the driver's photo, or null if none uploaded.</summary>
    Task<string?> GetPhotoPathAsync(int driverId);

    /// <summary>Sets (or clears, if null) the driver's stored photo path.</summary>
    Task SetPhotoPathAsync(int driverId, string? relativePath, int updatedByUserId);
}

/// <summary>
/// Thin proxy so IDriverService can accept file inputs without taking a direct
/// dependency on IFormFile (which lives in the ASP.NET Core assembly, breaking the
/// Application → Domain dependency rule).
/// </summary>
public interface IFormFileProxy
{
    Stream OpenReadStream();
    string FileName { get; }
    string ContentType { get; }
    long Length { get; }
}

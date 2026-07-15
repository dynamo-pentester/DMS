using DriverDms.Application.DTOs;

namespace DriverDms.Application.Interfaces;

public interface IMedicalRecordService
{
    Task<MedicalRecordDto?> GetByIdAsync(int medicalRecordId);
    Task<PagedResult<MedicalRecordDto>> SearchAsync(MedicalRecordSearchRequest request);
    Task<MedicalRecordDto> CreateAsync(CreateMedicalRecordRequest request, int createdByUserId);
    Task<MedicalRecordDto> UpdateAsync(int medicalRecordId, UpdateMedicalRecordRequest request, int updatedByUserId);
    Task DeleteAsync(int medicalRecordId, int deletedByUserId);

    /// <summary>Relative storage path of the medical certificate, or null if none uploaded.</summary>
    Task<string?> GetCertificatePathAsync(int medicalRecordId);

    /// <summary>Sets (or clears, if null) the medical record's stored certificate path.</summary>
    Task SetCertificatePathAsync(int medicalRecordId, string? relativePath, int updatedByUserId);
}

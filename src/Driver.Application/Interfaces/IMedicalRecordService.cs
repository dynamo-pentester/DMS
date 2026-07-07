using DriverDms.Application.DTOs;

namespace DriverDms.Application.Interfaces;

public interface IMedicalRecordService
{
    Task<MedicalRecordDto?> GetByIdAsync(int medicalRecordId);
    Task<PagedResult<MedicalRecordDto>> SearchAsync(MedicalRecordSearchRequest request);
    Task<MedicalRecordDto> CreateAsync(CreateMedicalRecordRequest request, int createdByUserId);
    Task<MedicalRecordDto> UpdateAsync(int medicalRecordId, UpdateMedicalRecordRequest request, int updatedByUserId);
    Task DeleteAsync(int medicalRecordId, int deletedByUserId);
}

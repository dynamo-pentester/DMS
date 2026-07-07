using DriverDms.Application.DTOs;

namespace DriverDms.Application.Interfaces;

public interface ITrainingService
{
    Task<TrainingDto?> GetByIdAsync(int trainingId);
    Task<PagedResult<TrainingDto>> SearchAsync(TrainingSearchRequest request);
    Task<TrainingDto> CreateAsync(CreateTrainingRequest request, int createdByUserId);
    Task<TrainingDto> UpdateAsync(int trainingId, UpdateTrainingRequest request, int updatedByUserId);
    Task DeleteAsync(int trainingId, int deletedByUserId);
}

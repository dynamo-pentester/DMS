using DriverDms.Domain.Common;

namespace DriverDms.Domain.Entities;

public class Training : BaseEntity
{
    public int TrainingId { get; set; }
    public int DriverId { get; set; }
    public Driver? Driver { get; set; }
    public int TrainingTypeId { get; set; }
    public TrainingType? TrainingType { get; set; }
    public DateTime DateCompleted { get; set; }
    public DateTime ValidUpto { get; set; }
    public string? TrainerName { get; set; }

    // Same reasoning as License.IsExpired / MedicalRecord.IsExpired (design doc §6.3):
    // "expiring soon" needs the configurable reminder window, which depends on
    // SystemConfiguration - that logic lives in TrainingStatusResolver, not here.
    public bool IsExpired => ValidUpto < DateTime.UtcNow;
}

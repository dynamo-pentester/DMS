using DriverDms.Domain.Common;

namespace DriverDms.Domain.Entities;

public class MedicalRecord : BaseEntity
{
    public int MedicalRecordId { get; set; }
    public int DriverId { get; set; }
    public Driver? Driver { get; set; }
    public DateTime ExamDate { get; set; }
    public int FitnessStatusId { get; set; }
    public FitnessStatus? FitnessStatus { get; set; }
    public string? BP { get; set; }
    public bool VisionTestPass { get; set; }
    public bool AlcoholTestPass { get; set; }
    public bool ChronicIllness { get; set; }
    public string? ChronicIllnessRemarks { get; set; }
    public DateTime ValidTill { get; set; }

    // Relative path only (e.g. "medical-certificates/<guid>.pdf") - see Driver.DriverPhotoPath note.
    public string? MedicalCertificatePath { get; set; }

    // Deliberately narrow, same reasoning as License.IsExpired (design doc §6.3):
    // "expiring soon" needs the configurable reminder window, which depends on
    // SystemConfiguration - that logic lives in MedicalStatusResolver, not here.
    public bool IsExpired => ValidTill < DateTime.UtcNow;
}

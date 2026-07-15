namespace DriverDms.Application.DTOs;

public class MedicalRecordDto
{
    public int MedicalRecordId { get; set; }
    public int DriverId { get; set; }
    public string DriverName { get; set; } = default!;
    public DateTime ExamDate { get; set; }
    public string FitnessStatusName { get; set; } = default!;
    public string? BP { get; set; }
    public bool VisionTestPass { get; set; }
    public bool AlcoholTestPass { get; set; }
    public bool ChronicIllness { get; set; }
    public string? ChronicIllnessRemarks { get; set; }
    public DateTime ValidTill { get; set; }
    /// <summary>Valid | Expiring | Expired — computed by MedicalStatusResolver</summary>
    public string Status { get; set; } = default!;

    // True when a certificate has been uploaded via POST /api/medical-records/{id}/certificate.
    // The raw storage path is never exposed to the client - it's fetched via that same route.
    public bool HasCertificate { get; set; }
}

public class CreateMedicalRecordRequest
{
    public int DriverId { get; set; }
    public DateTime ExamDate { get; set; }
    public int FitnessStatusId { get; set; }
    public string? BP { get; set; }
    public bool VisionTestPass { get; set; }
    public bool AlcoholTestPass { get; set; }
    public bool ChronicIllness { get; set; }
    public string? ChronicIllnessRemarks { get; set; }
    public DateTime ValidTill { get; set; }
}

public class UpdateMedicalRecordRequest
{
    public DateTime ExamDate { get; set; }
    public int FitnessStatusId { get; set; }
    public string? BP { get; set; }
    public bool VisionTestPass { get; set; }
    public bool AlcoholTestPass { get; set; }
    public bool ChronicIllness { get; set; }
    public string? ChronicIllnessRemarks { get; set; }
    public DateTime ValidTill { get; set; }
}

public class MedicalRecordSearchRequest
{
    public int? DriverId { get; set; }
    /// <summary>Filter by status: Valid | Expiring | Expired</summary>
    public string? Status { get; set; }
    public string? LicenseNo { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;
}

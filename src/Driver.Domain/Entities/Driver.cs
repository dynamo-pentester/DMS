using DriverDms.Domain.Common;

namespace DriverDms.Domain.Entities;

public class Driver : BaseEntity
{
    public int DriverId { get; set; }

    // Format: DRV-YYYY-NNNNNN, generated in the application layer (§4.3)
    public string DriverCode { get; set; } = default!;

    public string FullName { get; set; } = default!;
    public string? FatherName { get; set; }
    public DateTime DateOfBirth { get; set; }
    public string Mobile { get; set; } = default!;
    public string? Address { get; set; }

    public int? BloodGroupId { get; set; }
    public BloodGroup? BloodGroup { get; set; }

    // Optional/masked per the Excel's own note - encrypted at rest, never returned
    // in full via the API. AadhaarLast4 is the only part exposed for display/lookup.
    public string? AadhaarNoEncrypted { get; set; }
    public string? AadhaarLast4 { get; set; }

    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string? EmergencyContactPhone { get; set; }

    public string? Remarks { get; set; }

    // Relative path only (e.g. "drivers/photos/<guid>.jpg") - the physical file lives
    // on disk under FileStorage:RootPath, never in this database column. Nullable/
    // additive: existing drivers simply have no photo until one is uploaded.
    public string? DriverPhotoPath { get; set; }

    public int CurrentStatusId { get; set; }
    public DriverStatusType? CurrentStatus { get; set; }

    // Approval workflow — separate from operational CurrentStatusId.
    // "Approved" | "PendingApproval" | "Rejected"
    public string ApprovalStatus { get; set; } = "Approved";
    public int? ApprovedBy { get; set; }    // UserId of the manager who acted
    public DateTime? ApprovedDate { get; set; }

    public ICollection<DriverApproval> DriverApprovals { get; set; } = new List<DriverApproval>();

    public ICollection<License> Licenses { get; set; } = new List<License>();
    public ICollection<MedicalRecord> MedicalRecords { get; set; } = new List<MedicalRecord>();
    public ICollection<Incident> Incidents { get; set; } = new List<Incident>();
    public ICollection<PlantMovement> PlantMovements { get; set; } = new List<PlantMovement>();
    public ICollection<Training> Trainings { get; set; } = new List<Training>();
    public ICollection<DriverStatusHistory> StatusHistory { get; set; } = new List<DriverStatusHistory>();
    public ICollection<DriverTransporterHistory> TransporterHistory { get; set; } = new List<DriverTransporterHistory>();

    // NOT mapped - convenience only. Current transporter comes from history,
    // not a direct FK (see design doc §4.4 changelog for why that FK was removed).
    public DriverTransporterHistory? CurrentTransporter
        => TransporterHistory.FirstOrDefault(t => t.IsCurrent);
}

public class DriverStatusHistory
{
    public int StatusHistoryId { get; set; }
    public int DriverId { get; set; }
    public Driver? Driver { get; set; }
    public int DriverStatusTypeId { get; set; }
    public DriverStatusType? DriverStatusType { get; set; }
    public string? Reason { get; set; }
    public int? ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; }
}

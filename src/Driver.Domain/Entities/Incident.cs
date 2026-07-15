using DriverDms.Domain.Common;

namespace DriverDms.Domain.Entities;

public class Incident : BaseEntity
{
    public int IncidentId { get; set; }
    public int DriverId { get; set; }
    public Driver? Driver { get; set; }
    public DateTime IncidentDate { get; set; }
    public int IncidentTypeId { get; set; }
    public IncidentType? IncidentType { get; set; }
    public string Description { get; set; } = default!;
    public int SeverityLevelId { get; set; }
    public SeverityLevel? SeverityLevel { get; set; }
    public string? Location { get; set; }
    public bool RootCauseCompleted { get; set; }

    // Captured at report time from the driver's current transporter (auto-filled on
    // the frontend), or overridden with the newly reported one when TransporterChanged
    // is true. Purely informational - does not itself alter DriverTransporterHistory.
    public string? TransporterName { get; set; }
    public bool TransporterChanged { get; set; }

    // Relative path only (e.g. "incident-reports/<guid>.pdf") - see Driver.DriverPhotoPath note.
    public string? IncidentReportPath { get; set; }

    public ICollection<CorrectiveAction> CorrectiveActions { get; set; } = new List<CorrectiveAction>();
}

public class CorrectiveAction : BaseEntity
{
    public int CorrectiveActionId { get; set; }
    public int IncidentId { get; set; }
    public Incident? Incident { get; set; }
    public string ActionTaken { get; set; } = default!;
    public int? PenaltyTypeId { get; set; }
    public PenaltyType? PenaltyType { get; set; }
    public DateTime ActionDate { get; set; }

    // Relative path only (e.g. "corrective-actions/<guid>.pdf") - see Driver.DriverPhotoPath
    // note. Used for the letter-of-apology / supporting-photo attachment on a corrective
    // action. Required (alongside HOD/Admin review) before a Blacklisted driver can be
    // unblocked - see DriverService.UpdateStatusAsync.
    public string? AttachmentPath { get; set; }

    // Relative path only (e.g. "incident-reports/{incidentId}/corrective-actions/<guid>.pdf") -
    // see Driver.DriverPhotoPath note. Stores the formal apology document uploaded when
    // a corrective action is recorded. Namespaced under the parent incident folder so all
    // apology documents for a given incident are co-located on disk without a DB lookup.
    public string? ApologyDocumentPath { get; set; }
}

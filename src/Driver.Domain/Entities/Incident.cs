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
}

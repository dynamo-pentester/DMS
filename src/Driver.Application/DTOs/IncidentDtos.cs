namespace DriverDms.Application.DTOs;

public class IncidentDto
{
    public int IncidentId { get; set; }
    public int DriverId { get; set; }
    public string DriverName { get; set; } = default!;
    public DateTime IncidentDate { get; set; }
    public string IncidentTypeName { get; set; } = default!;
    public string Description { get; set; } = default!;
    public string SeverityLevelName { get; set; } = default!;
    public string? Location { get; set; }
    public bool RootCauseCompleted { get; set; }
    public List<CorrectiveActionDto> CorrectiveActions { get; set; } = new();

    // See Incident.TransporterName/TransporterChanged.
    public string? TransporterName { get; set; }
    public bool TransporterChanged { get; set; }

    // True when a report has been uploaded via POST /api/incidents/{id}/report.
    // The raw storage path is never exposed to the client - it's fetched via that same route.
    public bool HasReport { get; set; }
}

public class CorrectiveActionDto
{
    public int CorrectiveActionId { get; set; }
    public int IncidentId { get; set; }
    public string ActionTaken { get; set; } = default!;
    public string? PenaltyTypeName { get; set; }
    public DateTime ActionDate { get; set; }

    // True when a letter-of-apology / supporting photo has been uploaded via
    // POST /api/incidents/{incidentId}/corrective-actions/{correctiveActionId}/attachment.
    // The raw storage path is never exposed to the client - it's fetched via that same route.
    public bool HasAttachment { get; set; }

    // True when a formal apology document has been uploaded via
    // POST /api/incidents/{id}/corrective-actions (inline at creation time) or the
    // dedicated GET /api/incidents/{id}/corrective-actions/{correctiveActionId}/apology-document.
    // The raw storage path is never exposed to the client.
    public bool HasApologyDocument { get; set; }
}

public class CreateIncidentRequest
{
    public int DriverId { get; set; }
    public DateTime IncidentDate { get; set; }
    public int IncidentTypeId { get; set; }
    public string Description { get; set; } = default!;

    /// <summary>
    /// Preferred: numeric FK (1=Low, 2=Medium, 3=High). When zero/unset the
    /// service will resolve it from <see cref="Severity"/> instead.
    /// </summary>
    public int SeverityLevelId { get; set; }

    /// <summary>
    /// The frontend sends the severity as a name string ("Low" / "Medium" / "High").
    /// The service maps this to SeverityLevelId when SeverityLevelId is 0.
    /// </summary>
    public string? Severity { get; set; }

    public string? Location { get; set; }

    // Extra fields sent by the frontend — accepted here to avoid model-binding
    // errors; persisted to dedicated columns once the schema is extended.
    public bool FaultAtDriver { get; set; }
    public int FatalitiesCount { get; set; }
    public int InjuriesCount { get; set; }

    /// <summary>
    /// Auto-filled from the driver's current transporter on the frontend. If the
    /// employee reports the driver has since moved to a different contractor,
    /// TransporterChanged is set true and this holds the newly reported name instead.
    /// </summary>
    public string? TransporterName { get; set; }
    public bool TransporterChanged { get; set; }
}

public class UpdateIncidentRequest
{
    public DateTime IncidentDate { get; set; }
    public int IncidentTypeId { get; set; }
    public string Description { get; set; } = default!;
    public int SeverityLevelId { get; set; }
    public string? Location { get; set; }
    public bool RootCauseCompleted { get; set; }
}

public class AddCorrectiveActionRequest
{
    public string ActionTaken { get; set; } = default!;
    public int? PenaltyTypeId { get; set; }
    public DateTime? ActionDate { get; set; }
}

public class IncidentSearchRequest
{
    public int? DriverId { get; set; }
    public int? SeverityLevelId { get; set; }
    public bool? RootCauseCompleted { get; set; }

    // Filters to incidents whose driver holds a license whose number contains this text.
    // Used by the License ID selector on the Incidents filter drawer.
    public string? LicenseNo { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;
}

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
}

public class CorrectiveActionDto
{
    public int CorrectiveActionId { get; set; }
    public int IncidentId { get; set; }
    public string ActionTaken { get; set; } = default!;
    public string? PenaltyTypeName { get; set; }
    public DateTime ActionDate { get; set; }
}

public class CreateIncidentRequest
{
    public int DriverId { get; set; }
    public DateTime IncidentDate { get; set; }
    public int IncidentTypeId { get; set; }
    public string Description { get; set; } = default!;
    public int SeverityLevelId { get; set; }
    public string? Location { get; set; }
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
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;
}

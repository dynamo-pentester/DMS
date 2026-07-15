namespace DriverDms.Application.DTOs;

public class TransporterDto
{
    public int TransporterId { get; set; }
    public string Name { get; set; } = default!;
    public string? ContactPerson { get; set; }
    public string? Mobile { get; set; }
    public string? Address { get; set; }
    public DateTime? AgreementValidTill { get; set; }
    public bool IsActive { get; set; }
    public int CurrentDriverCount { get; set; }
}

public class CreateTransporterRequest
{
    public string Name { get; set; } = default!;
    public string? ContactPerson { get; set; }
    public string? Mobile { get; set; }
    public string? Address { get; set; }
    public DateTime? AgreementValidTill { get; set; }
}

public class UpdateTransporterRequest
{
    public string Name { get; set; } = default!;
    public string? ContactPerson { get; set; }
    public string? Mobile { get; set; }
    public string? Address { get; set; }
    public DateTime? AgreementValidTill { get; set; }
    public bool IsActive { get; set; }
}

public class DriverTransporterAssignmentDto
{
    public int AssignmentId { get; set; }
    public int DriverId { get; set; }
    public string DriverName { get; set; } = default!;
    public int TransporterId { get; set; }
    public string TransporterName { get; set; } = default!;
    public DateTime AssignmentDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsCurrent { get; set; }
}

public class AssignDriverRequest
{
    public int DriverId { get; set; }
    public DateTime? AssignmentDate { get; set; } // defaults to now if not supplied
}

public class TransporterSearchRequest
{
    public string? SearchTerm { get; set; } // matches Name, ContactPerson, or Mobile
    public bool? IsActive { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;
}


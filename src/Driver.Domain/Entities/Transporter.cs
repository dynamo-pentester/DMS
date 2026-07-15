using DriverDms.Domain.Common;

namespace DriverDms.Domain.Entities;

public class Transporter : BaseEntity
{
    public int TransporterId { get; set; }
    public string Name { get; set; } = default!;
    public string? ContactPerson { get; set; }
    public string? Mobile { get; set; }
    public string? Address { get; set; }
    public DateTime? AgreementValidTill { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<DriverTransporterHistory> DriverAssignments { get; set; } = new List<DriverTransporterHistory>();
}

public class DriverTransporterHistory : BaseEntity
{
    public int AssignmentId { get; set; }
    public int DriverId { get; set; }
    public Driver? Driver { get; set; }
    public int TransporterId { get; set; }
    public Transporter? Transporter { get; set; }
    public DateTime AssignmentDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsCurrent { get; set; }
}

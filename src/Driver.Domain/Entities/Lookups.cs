namespace DriverDms.Domain.Entities;

// Master/lookup tables - deliberately plain, no BaseEntity (no soft delete/concurrency
// needed for reference data per §4.2/§4.10 of the design doc).

public class VehicleType
{
    public int VehicleTypeId { get; set; }
    public string Name { get; set; } = default!;
    public bool IsActive { get; set; } = true;
}

public class Endorsement
{
    public int EndorsementId { get; set; }
    public string Name { get; set; } = default!;
    public bool IsActive { get; set; } = true;
}

public class BloodGroup
{
    public int BloodGroupId { get; set; }
    public string Name { get; set; } = default!;
}

public class FitnessStatus
{
    public int FitnessStatusId { get; set; }
    public string Name { get; set; } = default!;
    // Seed: Fit, Fit with remarks, Unfit
}

public class DriverStatusType
{
    public int DriverStatusTypeId { get; set; }
    public string Name { get; set; } = default!;
    // Seed: Active, Suspended, OnMedicalHold, Retired
}

public class IncidentType
{
    public int IncidentTypeId { get; set; }
    public string Name { get; set; } = default!;
    // Seed: Incident, Near Miss, Violation - matches the Excel's original "Type" column
    // and design doc §4.2. Confirm with Ramco whether these three categories match how
    // their mine safety team actually classifies events before treating as final.
}

public class SeverityLevel
{
    public int SeverityLevelId { get; set; }
    public string Name { get; set; } = default!;
    // Seed: Low, Medium, High - per design doc §4.2. A mine safety operation may want a
    // finer-grained scale (e.g. DGMS-style Near Miss/First Aid/Lost Time/Fatal) - flagged
    // as a placeholder starting point, same treatment as the Roles seed list.
}

public class PenaltyType
{
    public int PenaltyTypeId { get; set; }
    public string Name { get; set; } = default!;
    // Seed: Warning, Suspension, Retraining - per design doc §4.2
}

public class PurposeType
{
    public int PurposeTypeId { get; set; }
    public string Name { get; set; } = default!;
    // Seed: Loading, Unloading, Maintenance - per design doc §4.2 / original Excel
}

public class GateNumber
{
    public int GateNumberId { get; set; }
    public string Name { get; set; } = default!;
    // Placeholder seed (Gate 1/2/3) - confirm actual gate count/naming with Ramco's
    // mine site before treating as final, same treatment as Roles/IncidentTypes.
}

public class TrainingType
{
    public int TrainingTypeId { get; set; }
    public string Name { get; set; } = default!;
    // Seed: Induction, Refresher, Defensive Driving, PEP Talk - per design doc §4.2
}

public class NotificationEntityType
{
    public int NotificationEntityTypeId { get; set; }
    public string Name { get; set; } = default!;
    // Seed: License, Medical, Training, Incident, Document, System - per design doc §4.8
}

public class NotificationStatus
{
    public int NotificationStatusId { get; set; }
    public string Name { get; set; } = default!;
    // Seed: Pending, Sent, Dismissed, Expired - per design doc §4.8
}

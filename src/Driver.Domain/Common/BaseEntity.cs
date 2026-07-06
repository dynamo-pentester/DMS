using System.ComponentModel.DataAnnotations;

namespace DriverDms.Domain.Common;

/// <summary>
/// Every business entity (Drivers, Licenses, MedicalRecords, Trainings, Incidents,
/// CorrectiveActions, PlantMovements, Documents, Transporters, DriverTransporterHistory)
/// inherits this. Lookup/master tables (VehicleTypes, BloodGroups, etc.) do NOT -
/// they don't need soft delete or concurrency tokens per the design doc (§4.10/§6.3).
/// </summary>
public abstract class BaseEntity
{
    // Default intentionally omitted: SaveChangesAsync sets CreatedAt = DateTime.UtcNow
    // on every Added entity. Setting it here caused EF Core's PendingModelChangesWarning
    // because the snapshot differed on every build (dynamic value in model definition).
    public DateTime CreatedAt { get; set; }
    public int? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }
    public int? UpdatedBy { get; set; }

    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public int? DeletedBy { get; set; }

    /// <summary>
    /// SQL Server rowversion. EF Core throws DbUpdateConcurrencyException on a stale
    /// save instead of silently overwriting - this is what stops "HR and Safety edit
    /// the same driver at once, last save wins" from happening quietly.
    /// Initialized to empty array so the InMemory provider (used in tests) doesn't
    /// throw a nullability error - SQL Server overwrites this with the real value anyway.
    /// </summary>
    [Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}

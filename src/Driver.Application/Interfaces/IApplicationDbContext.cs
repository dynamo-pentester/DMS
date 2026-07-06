using Microsoft.EntityFrameworkCore;
using DriverDms.Domain.Entities;

namespace DriverDms.Application.Interfaces;

/// <summary>
/// Application depends on this abstraction, not on Driver.Infrastructure directly -
/// keeps the dependency rule intact (Application -> Domain only, per §6.1 of the design doc).
/// DriverDmsContext (Infrastructure) implements this.
/// </summary>
public interface IApplicationDbContext
{
    DbSet<DriverDms.Domain.Entities.Driver> Drivers { get; }
    DbSet<DriverStatusHistory> DriverStatusHistories { get; }
    DbSet<Transporter> Transporters { get; }
    DbSet<DriverTransporterHistory> DriverTransporterHistories { get; }
    DbSet<License> Licenses { get; }
    DbSet<LicenseEndorsement> LicenseEndorsements { get; }
    DbSet<VehicleType> VehicleTypes { get; }
    DbSet<Endorsement> Endorsements { get; }
    DbSet<BloodGroup> BloodGroups { get; }
    DbSet<FitnessStatus> FitnessStatuses { get; }
    DbSet<MedicalRecord> MedicalRecords { get; }
    DbSet<Incident> Incidents { get; }
    DbSet<CorrectiveAction> CorrectiveActions { get; }
    DbSet<IncidentType> IncidentTypes { get; }
    DbSet<SeverityLevel> SeverityLevels { get; }
    DbSet<PenaltyType> PenaltyTypes { get; }
    DbSet<PlantMovement> PlantMovements { get; }
    DbSet<PurposeType> PurposeTypes { get; }
    DbSet<GateNumber> GateNumbers { get; }
    DbSet<Training> Trainings { get; }
    DbSet<TrainingType> TrainingTypes { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<NotificationEntityType> NotificationEntityTypes { get; }
    DbSet<NotificationStatus> NotificationStatuses { get; }
    DbSet<DriverStatusType> DriverStatusTypes { get; }
    DbSet<SystemConfiguration> SystemConfigurations { get; }
    DbSet<AuditLog> AuditLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

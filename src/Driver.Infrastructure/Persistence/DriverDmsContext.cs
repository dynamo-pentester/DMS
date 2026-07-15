using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using DriverDms.Application.Interfaces;
using DriverDms.Domain.Common;
using DriverDms.Domain.Entities;
using DriverDms.Infrastructure.Identity;

namespace DriverDms.Infrastructure.Persistence;

public class DriverDmsContext
    : IdentityDbContext<ApplicationUser, IdentityRole<int>, int>, IApplicationDbContext
{
    public DriverDmsContext(DbContextOptions<DriverDmsContext> options) : base(options) { }

    public DbSet<DriverDms.Domain.Entities.Driver> Drivers => Set<DriverDms.Domain.Entities.Driver>();
    public DbSet<DriverStatusHistory> DriverStatusHistories => Set<DriverStatusHistory>();
    public DbSet<Transporter> Transporters => Set<Transporter>();
    public DbSet<DriverTransporterHistory> DriverTransporterHistories => Set<DriverTransporterHistory>();
    public DbSet<License> Licenses => Set<License>();
    public DbSet<LicenseEndorsement> LicenseEndorsements => Set<LicenseEndorsement>();
    public DbSet<VehicleType> VehicleTypes => Set<VehicleType>();
    public DbSet<Endorsement> Endorsements => Set<Endorsement>();
    public DbSet<BloodGroup> BloodGroups => Set<BloodGroup>();
    public DbSet<FitnessStatus> FitnessStatuses => Set<FitnessStatus>();
    public DbSet<MedicalRecord> MedicalRecords => Set<MedicalRecord>();
    public DbSet<Incident> Incidents => Set<Incident>();
    public DbSet<CorrectiveAction> CorrectiveActions => Set<CorrectiveAction>();
    public DbSet<IncidentType> IncidentTypes => Set<IncidentType>();
    public DbSet<SeverityLevel> SeverityLevels => Set<SeverityLevel>();
    public DbSet<PenaltyType> PenaltyTypes => Set<PenaltyType>();
    public DbSet<PlantMovement> PlantMovements => Set<PlantMovement>();
    public DbSet<PurposeType> PurposeTypes => Set<PurposeType>();
    public DbSet<GateNumber> GateNumbers => Set<GateNumber>();
    public DbSet<Training> Trainings => Set<Training>();
    public DbSet<TrainingType> TrainingTypes => Set<TrainingType>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<NotificationEntityType> NotificationEntityTypes => Set<NotificationEntityType>();
    public DbSet<NotificationStatus> NotificationStatuses => Set<NotificationStatus>();
    public DbSet<DriverStatusType> DriverStatusTypes => Set<DriverStatusType>();
    public DbSet<SystemConfiguration> SystemConfigurations => Set<SystemConfiguration>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<DriverApproval> DriverApprovals => Set<DriverApproval>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // ---- Driver ----
        builder.Entity<DriverDms.Domain.Entities.Driver>(e =>
        {
            e.HasKey(d => d.DriverId);
            e.HasIndex(d => d.DriverCode).IsUnique();
            e.HasIndex(d => d.Mobile);
            e.HasQueryFilter(d => !d.IsDeleted); // soft delete - §4 note

            e.HasOne(d => d.BloodGroup).WithMany().HasForeignKey(d => d.BloodGroupId);
            e.HasOne(d => d.CurrentStatus).WithMany().HasForeignKey(d => d.CurrentStatusId);

            e.Property(d => d.DateOfBirth).HasColumnType("date");
        });

        builder.Entity<DriverApproval>(e =>
        {
            e.HasKey(a => a.Id);
            e.HasOne(a => a.Driver)
                .WithMany(d => d.DriverApprovals)
                .HasForeignKey(a => a.DriverId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasQueryFilter(a => !a.IsDeleted && !a.Driver!.IsDeleted);
        });

        builder.Entity<DriverStatusHistory>(e =>
        {
            e.HasKey(h => h.StatusHistoryId);
            e.HasOne(h => h.Driver).WithMany(d => d.StatusHistory).HasForeignKey(h => h.DriverId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(h => h.DriverStatusType).WithMany().HasForeignKey(h => h.DriverStatusTypeId)
                .OnDelete(DeleteBehavior.Restrict);
            // Cascades the parent Driver's soft-delete filter down to its history rows.
            // Without this, EF warns that Driver has a filter but DriverStatusHistory
            // (a required-navigation child with no filter of its own) doesn't match it -
            // meaning a soft-deleted driver's status history would stay fully visible
            // and joinable even though the driver "doesn't exist" everywhere else.
            e.HasQueryFilter(h => !h.Driver!.IsDeleted);
        });

        // ---- Transporter / History ----
        builder.Entity<Transporter>(e =>
        {
            e.HasKey(t => t.TransporterId);
            e.HasQueryFilter(t => !t.IsDeleted);
        });

        builder.Entity<DriverTransporterHistory>(e =>
        {
            e.HasKey(h => h.AssignmentId);
            e.HasQueryFilter(h => !h.IsDeleted);
            e.HasOne(h => h.Driver).WithMany(d => d.TransporterHistory).HasForeignKey(h => h.DriverId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(h => h.Transporter).WithMany(t => t.DriverAssignments).HasForeignKey(h => h.TransporterId)
                .OnDelete(DeleteBehavior.Restrict);

            // Only one current transporter per driver at a time - enforced in the DB,
            // not just in application logic (design doc §4.11).
            e.HasIndex(h => h.DriverId).IsUnique().HasFilter("[IsCurrent] = 1");
        });

        // ---- License / Endorsements (M:N) ----
        builder.Entity<License>(e =>
        {
            e.HasKey(l => l.LicenseId);
            e.HasQueryFilter(l => !l.IsDeleted);
            e.HasIndex(l => l.LicenseNo).IsUnique();
            e.HasIndex(l => l.ValidTill);
            e.HasOne(l => l.Driver).WithMany(d => d.Licenses).HasForeignKey(l => l.DriverId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(l => l.VehicleType).WithMany().HasForeignKey(l => l.VehicleTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            // ValidTill > IssueDate constraint, per design doc §4.11
            e.ToTable(t => t.HasCheckConstraint("CK_License_ValidTill", "[ValidTill] > [IssueDate]"));
        });

        builder.Entity<LicenseEndorsement>(e =>
        {
            e.HasKey(le => new { le.LicenseId, le.EndorsementId });
            e.HasOne(le => le.License).WithMany(l => l.LicenseEndorsements).HasForeignKey(le => le.LicenseId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(le => le.Endorsement).WithMany().HasForeignKey(le => le.EndorsementId)
                .OnDelete(DeleteBehavior.Restrict);
            // Same fix as DriverStatusHistory above - cascades License's soft-delete
            // filter so a deleted license's endorsement rows don't linger visible.
            e.HasQueryFilter(le => !le.License!.IsDeleted);
        });

        // ---- Medical Records ----
        builder.Entity<MedicalRecord>(e =>
        {
            e.HasKey(m => m.MedicalRecordId);
            e.HasQueryFilter(m => !m.IsDeleted);
            e.HasIndex(m => m.ValidTill);
            e.HasOne(m => m.Driver).WithMany(d => d.MedicalRecords).HasForeignKey(m => m.DriverId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(m => m.FitnessStatus).WithMany().HasForeignKey(m => m.FitnessStatusId)
                .OnDelete(DeleteBehavior.Restrict);

            // ValidTill > ExamDate, same reasoning as License's ValidTill > IssueDate check (§4.11)
            e.ToTable(t => t.HasCheckConstraint("CK_MedicalRecord_ValidTill", "[ValidTill] > [ExamDate]"));
        });

        // ---- Incidents / Corrective Actions (Safety domain) ----
        builder.Entity<Incident>(e =>
        {
            e.HasKey(i => i.IncidentId);
            e.HasQueryFilter(i => !i.IsDeleted);
            e.HasIndex(i => i.IncidentDate);
            e.HasOne(i => i.Driver).WithMany(d => d.Incidents).HasForeignKey(i => i.DriverId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(i => i.IncidentType).WithMany().HasForeignKey(i => i.IncidentTypeId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(i => i.SeverityLevel).WithMany().HasForeignKey(i => i.SeverityLevelId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<CorrectiveAction>(e =>
        {
            e.HasKey(c => c.CorrectiveActionId);
            e.HasQueryFilter(c => !c.IsDeleted);
            // One incident can accumulate multiple corrective actions over time
            // (e.g. an initial warning, then a later suspension) - deliberately NOT
            // a 1:1 relationship even though an earlier draft ERD showed it that way.
            e.HasOne(c => c.Incident).WithMany(i => i.CorrectiveActions).HasForeignKey(c => c.IncidentId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(c => c.PenaltyType).WithMany().HasForeignKey(c => c.PenaltyTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---- Plant Movement (Operations domain) ----
        builder.Entity<PlantMovement>(e =>
        {
            e.HasKey(p => p.MovementId);
            e.HasQueryFilter(p => !p.IsDeleted);
            e.HasIndex(p => p.DateOfEntry);
            e.HasIndex(p => p.VehicleNo);
            e.HasOne(p => p.Driver).WithMany(d => d.PlantMovements).HasForeignKey(p => p.DriverId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(p => p.PurposeType).WithMany().HasForeignKey(p => p.PurposeTypeId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(p => p.GateNumber).WithMany().HasForeignKey(p => p.GateNumberId)
                .OnDelete(DeleteBehavior.Restrict);

            // Per design doc §4.11 - DateOfExit >= DateOfEntry, only when exit is recorded
            // (a driver still on-site has DateOfExit = null, which is valid and expected).
            e.ToTable(t => t.HasCheckConstraint("CK_PlantMovement_DateOfExit",
                "[DateOfExit] IS NULL OR [DateOfExit] >= [DateOfEntry]"));
        });

        // ---- Training (Safety domain - PEP Talk / Induction / Refresher) ----
        builder.Entity<Training>(e =>
        {
            e.HasKey(t => t.TrainingId);
            e.HasQueryFilter(t => !t.IsDeleted);
            e.HasIndex(t => t.ValidUpto);
            e.HasOne(t => t.Driver).WithMany(d => d.Trainings).HasForeignKey(t => t.DriverId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(t => t.TrainingType).WithMany().HasForeignKey(t => t.TrainingTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            // ValidUpto > DateCompleted, same reasoning as License/MedicalRecord (§4.11)
            e.ToTable(tb => tb.HasCheckConstraint("CK_Training_ValidUpto", "[ValidUpto] > [DateCompleted]"));
        });

        // ---- Notifications (Documents & Alerts domain, §4.8) ----
        builder.Entity<Notification>(e =>
        {
            e.HasKey(n => n.NotificationId);
            e.HasIndex(n => n.NotificationStatusId);
            e.HasOne(n => n.NotificationEntityType).WithMany().HasForeignKey(n => n.NotificationEntityTypeId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(n => n.NotificationStatus).WithMany().HasForeignKey(n => n.NotificationStatusId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---- SystemConfiguration ----
        builder.Entity<SystemConfiguration>(e => e.HasKey(c => c.ConfigKey));

        // ---- Seed lookups & config (id-based rows only - safe for repeatable migrations) ----
        builder.Entity<DriverStatusType>().HasData(
            new DriverStatusType { DriverStatusTypeId = 1, Name = "Active" },
            new DriverStatusType { DriverStatusTypeId = 2, Name = "Suspended" },
            new DriverStatusType { DriverStatusTypeId = 3, Name = "OnMedicalHold" },
            new DriverStatusType { DriverStatusTypeId = 4, Name = "Retired" },
            new DriverStatusType { DriverStatusTypeId = 5, Name = "Blacklisted" }
        );

        builder.Entity<VehicleType>().HasData(
            new VehicleType { VehicleTypeId = 1, Name = "LMV" },
            new VehicleType { VehicleTypeId = 2, Name = "HMV" },
            new VehicleType { VehicleTypeId = 3, Name = "Trailer" },
            new VehicleType { VehicleTypeId = 4, Name = "Tanker" }
        );

        builder.Entity<BloodGroup>().HasData(
            new BloodGroup { BloodGroupId = 1, Name = "A+" },
            new BloodGroup { BloodGroupId = 2, Name = "A-" },
            new BloodGroup { BloodGroupId = 3, Name = "B+" },
            new BloodGroup { BloodGroupId = 4, Name = "B-" },
            new BloodGroup { BloodGroupId = 5, Name = "AB+" },
            new BloodGroup { BloodGroupId = 6, Name = "AB-" },
            new BloodGroup { BloodGroupId = 7, Name = "O+" },
            new BloodGroup { BloodGroupId = 8, Name = "O-" }
        );

        builder.Entity<Endorsement>().HasData(
            new Endorsement { EndorsementId = 1, Name = "Hazmat", IsActive = false },
            new Endorsement { EndorsementId = 2, Name = "Passenger", IsActive = false },
            new Endorsement { EndorsementId = 3, Name = "Tanker", IsActive = false },
            new Endorsement { EndorsementId = 4, Name = "Air Brakes", IsActive = false },
            new Endorsement { EndorsementId = 5, Name = "Dumper" },
            new Endorsement { EndorsementId = 6, Name = "Bulker" },
            new Endorsement { EndorsementId = 7, Name = "Cement Truck" },
            new Endorsement { EndorsementId = 8, Name = "Taurus" },
            new Endorsement { EndorsementId = 9, Name = "Trailer" },
            new Endorsement { EndorsementId = 10, Name = "Diesel Bowser" },
            new Endorsement { EndorsementId = 11, Name = "EME" },
            new Endorsement { EndorsementId = 12, Name = "LV" },
            new Endorsement { EndorsementId = 13, Name = "Other" }
        );

        builder.Entity<FitnessStatus>().HasData(
            new FitnessStatus { FitnessStatusId = 1, Name = "Fit" },
            new FitnessStatus { FitnessStatusId = 2, Name = "Fit with remarks" },
            new FitnessStatus { FitnessStatusId = 3, Name = "Unfit" }
        );

        // Placeholder starting point, same treatment as the Roles seed list - confirm
        // with Ramco's mine safety team whether these categories match how they
        // actually classify events before treating as final (design doc §5 pattern).
        builder.Entity<IncidentType>().HasData(
            new IncidentType { IncidentTypeId = 1, Name = "Incident" },
            new IncidentType { IncidentTypeId = 2, Name = "Near Miss" },
            new IncidentType { IncidentTypeId = 3, Name = "Violation" }
        );

        builder.Entity<SeverityLevel>().HasData(
            new SeverityLevel { SeverityLevelId = 1, Name = "Low" },
            new SeverityLevel { SeverityLevelId = 2, Name = "Medium" },
            new SeverityLevel { SeverityLevelId = 3, Name = "High" }
        );

        builder.Entity<PenaltyType>().HasData(
            new PenaltyType { PenaltyTypeId = 1, Name = "Warning" },
            new PenaltyType { PenaltyTypeId = 2, Name = "Suspension" },
            new PenaltyType { PenaltyTypeId = 3, Name = "Retraining" }
        );

        builder.Entity<PurposeType>().HasData(
            new PurposeType { PurposeTypeId = 1, Name = "Loading" },
            new PurposeType { PurposeTypeId = 2, Name = "Unloading" },
            new PurposeType { PurposeTypeId = 3, Name = "Maintenance" }
        );

        // Placeholder - confirm actual gate count/naming with Ramco's mine site.
        builder.Entity<GateNumber>().HasData(
            new GateNumber { GateNumberId = 1, Name = "Gate 1" },
            new GateNumber { GateNumberId = 2, Name = "Gate 2" },
            new GateNumber { GateNumberId = 3, Name = "Gate 3" }
        );

        builder.Entity<TrainingType>().HasData(
            new TrainingType { TrainingTypeId = 1, Name = "Induction" },
            new TrainingType { TrainingTypeId = 2, Name = "Refresher" },
            new TrainingType { TrainingTypeId = 3, Name = "Defensive Driving" },
            new TrainingType { TrainingTypeId = 4, Name = "PEP Talk" }
        );

        builder.Entity<NotificationEntityType>().HasData(
            new NotificationEntityType { NotificationEntityTypeId = 1, Name = "License" },
            new NotificationEntityType { NotificationEntityTypeId = 2, Name = "Medical" },
            new NotificationEntityType { NotificationEntityTypeId = 3, Name = "Training" },
            new NotificationEntityType { NotificationEntityTypeId = 4, Name = "Incident" },
            new NotificationEntityType { NotificationEntityTypeId = 5, Name = "Document" },
            new NotificationEntityType { NotificationEntityTypeId = 6, Name = "System" }
        );

        builder.Entity<NotificationStatus>().HasData(
            new NotificationStatus { NotificationStatusId = 1, Name = "Pending" },
            new NotificationStatus { NotificationStatusId = 2, Name = "Sent" },
            new NotificationStatus { NotificationStatusId = 3, Name = "Dismissed" },
            new NotificationStatus { NotificationStatusId = 4, Name = "Expired" }
        );

        builder.Entity<SystemConfiguration>().HasData(
            new SystemConfiguration { ConfigKey = "LicenseReminderDays", ConfigValue = "30", Description = "Days before License.ValidTill to raise a notification" },
            new SystemConfiguration { ConfigKey = "MedicalReminderDays", ConfigValue = "30", Description = "Confirm actual value with client - Excel didn't specify one (design doc §5)" },
            new SystemConfiguration { ConfigKey = "TrainingReminderDays", ConfigValue = "30", Description = "Confirm actual value with client - Excel didn't specify one (design doc §5)" }
        );
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditAndSoftDeleteConventions();
        return base.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Stamps CreatedAt/UpdatedAt automatically and converts a hard Delete into a
    /// soft delete (IsDeleted/DeletedAt) for every BaseEntity - so callers don't have
    /// to remember to do this by hand on every service method.
    /// </summary>
    private void ApplyAuditAndSoftDeleteConventions()
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Deleted:
                    entry.State = EntityState.Modified;
                    entry.Entity.IsDeleted = true;
                    entry.Entity.DeletedAt = DateTime.UtcNow;
                    break;
            }
        }
    }
}

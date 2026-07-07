using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using DriverDms.Application.Interfaces;
using DriverDms.Domain.Interfaces;
using DriverDms.Infrastructure.Persistence;

namespace DriverDms.Infrastructure.Jobs;

/// <summary>
/// Scheduled via Hangfire in Program.cs:
///   RecurringJob.AddOrUpdate&lt;ExpiryAlertJob&gt;("expiry-check", j => j.RunAsync(), Cron.Daily);
/// Reads the reminder window from SystemConfiguration - never hardcode the day count here
/// again (see design doc §6.6/§0.0 v1.5 changelog for why that mattered).
///
/// Persists real Notification rows via INotificationService.RaiseAsync (§4.8), which
/// dedupes so this daily run doesn't create a fresh row every day for the same
/// still-expiring record. Email/SMS delivery is NOT wired here - IEmailNotificationSender
/// exists but is deliberately unused (see its own doc comment); this job's job is only
/// to raise the in-app notification record, same as the rest of the API surface today.
/// </summary>
public class ExpiryAlertJob
{
    private readonly DriverDmsContext _db;
    private readonly ISystemConfigService _config;
    private readonly INotificationService _notifications;
    private readonly ILogger<ExpiryAlertJob> _logger;

    public ExpiryAlertJob(
        DriverDmsContext db,
        ISystemConfigService config,
        INotificationService notifications,
        ILogger<ExpiryAlertJob> logger)
    {
        _db = db;
        _config = config;
        _notifications = notifications;
        _logger = logger;
    }

    public async Task RunAsync()
    {
        await CheckLicensesAsync();
        await CheckMedicalRecordsAsync();
        await CheckTrainingsAsync();
    }

    private async Task CheckLicensesAsync()
    {
        var reminderDays = await _config.GetIntAsync("LicenseReminderDays", fallback: 30);
        var cutoff = DateTime.UtcNow.AddDays(reminderDays);

        var expiring = await _db.Licenses
            .Include(l => l.Driver)
            .Where(l => l.ValidTill <= cutoff && l.ValidTill > DateTime.UtcNow)
            .ToListAsync();

        foreach (var lic in expiring)
        {
            await _notifications.RaiseAsync(
                entityTypeName: "License",
                entityId: lic.LicenseId,
                title: $"License {lic.LicenseNo} expiring soon",
                message: $"{lic.Driver?.FullName ?? "Unknown driver"}'s license {lic.LicenseNo} expires on {lic.ValidTill:d}.",
                dueDate: lic.ValidTill);

            _logger.LogInformation("Raised expiry notification for License {LicenseNo}", lic.LicenseNo);
        }
    }

    private async Task CheckMedicalRecordsAsync()
    {
        var reminderDays = await _config.GetIntAsync("MedicalReminderDays", fallback: 30);
        var cutoff = DateTime.UtcNow.AddDays(reminderDays);

        var expiring = await _db.MedicalRecords
            .Include(m => m.Driver)
            .Where(m => m.ValidTill <= cutoff && m.ValidTill > DateTime.UtcNow)
            .ToListAsync();

        foreach (var record in expiring)
        {
            await _notifications.RaiseAsync(
                entityTypeName: "Medical",
                entityId: record.MedicalRecordId,
                title: "Medical fitness record expiring soon",
                message: $"{record.Driver?.FullName ?? "Unknown driver"}'s medical fitness record expires on {record.ValidTill:d}.",
                dueDate: record.ValidTill);

            _logger.LogInformation("Raised expiry notification for MedicalRecord {MedicalRecordId}", record.MedicalRecordId);
        }
    }

    private async Task CheckTrainingsAsync()
    {
        var reminderDays = await _config.GetIntAsync("TrainingReminderDays", fallback: 30);
        var cutoff = DateTime.UtcNow.AddDays(reminderDays);

        var expiring = await _db.Trainings
            .Include(t => t.Driver)
            .Include(t => t.TrainingType)
            .Where(t => t.ValidUpto <= cutoff && t.ValidUpto > DateTime.UtcNow)
            .ToListAsync();

        foreach (var training in expiring)
        {
            await _notifications.RaiseAsync(
                entityTypeName: "Training",
                entityId: training.TrainingId,
                title: $"{training.TrainingType?.Name ?? "Training"} expiring soon",
                message: $"{training.Driver?.FullName ?? "Unknown driver"}'s {training.TrainingType?.Name ?? "training"} expires on {training.ValidUpto:d}.",
                dueDate: training.ValidUpto);

            _logger.LogInformation("Raised expiry notification for Training {TrainingId}", training.TrainingId);
        }
    }
}

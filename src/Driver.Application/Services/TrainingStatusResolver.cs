using DriverDms.Domain.Entities;
using DriverDms.Domain.Interfaces;

namespace DriverDms.Application.Services;

/// <summary>
/// Same reasoning as LicenseStatusResolver/MedicalStatusResolver: Training.IsExpired
/// needs no config, "expiring soon" does (TrainingReminderDays), so that comparison
/// lives here - both the API and ExpiryAlertJob should go through this.
/// </summary>
public class TrainingStatusResolver
{
    private readonly ISystemConfigService _config;

    public TrainingStatusResolver(ISystemConfigService config)
    {
        _config = config;
    }

    public async Task<string> GetStatusAsync(Training training)
    {
        if (training.IsExpired) return "Expired";

        var reminderDays = await _config.GetIntAsync("TrainingReminderDays", fallback: 30);
        return training.ValidUpto <= DateTime.UtcNow.AddDays(reminderDays) ? "Expiring" : "Valid";
    }
}

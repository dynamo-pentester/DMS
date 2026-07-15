using DriverDms.Domain.Entities;
using DriverDms.Domain.Interfaces;

namespace DriverDms.Application.Services;

/// <summary>
/// Same reasoning as LicenseStatusResolver: MedicalRecord.IsExpired needs no config,
/// "expiring soon" does (MedicalReminderDays), so that comparison lives here - both
/// the API and ExpiryAlertJob should go through this rather than duplicating it.
/// </summary>
public class MedicalStatusResolver
{
    private readonly ISystemConfigService _config;

    public MedicalStatusResolver(ISystemConfigService config)
    {
        _config = config;
    }

    public async Task<string> GetStatusAsync(MedicalRecord record)
    {
        if (record.IsExpired) return "Expired";

        var reminderDays = await _config.GetIntAsync("MedicalReminderDays", fallback: 30);
        return record.ValidTill <= DateTime.UtcNow.AddDays(reminderDays) ? "Expiring" : "Valid";
    }
}

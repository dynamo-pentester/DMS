using DriverDms.Domain.Entities;
using DriverDms.Domain.Interfaces;

namespace DriverDms.Application.Services;

/// <summary>
/// Owns the ONE place the configurable reminder-day threshold is read for license
/// status. License.IsExpired (Domain) needs no config; "Expiring soon" does, and that's
/// exactly why it lives here instead of on the entity. Both the API and ExpiryAlertJob
/// should go through this, not duplicate the AddDays(...) comparison themselves.
/// </summary>
public class LicenseStatusResolver
{
    private readonly ISystemConfigService _config;

    public LicenseStatusResolver(ISystemConfigService config)
    {
        _config = config;
    }

    public async Task<string> GetStatusAsync(License license)
    {
        if (license.IsExpired) return "Expired";

        var reminderDays = await _config.GetIntAsync("LicenseReminderDays", fallback: 30);
        return license.ValidTill <= DateTime.UtcNow.AddDays(reminderDays) ? "Expiring" : "Valid";
    }
}

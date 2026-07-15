using Microsoft.EntityFrameworkCore;
using DriverDms.Domain.Interfaces;
using DriverDms.Infrastructure.Persistence;

namespace DriverDms.Infrastructure.Configuration;

public class SystemConfigService : ISystemConfigService
{
    private readonly DriverDmsContext _db;

    public SystemConfigService(DriverDmsContext db)
    {
        _db = db;
    }

    public async Task<int> GetIntAsync(string key, int fallback)
    {
        var row = await _db.SystemConfigurations.AsNoTracking()
            .FirstOrDefaultAsync(c => c.ConfigKey == key);

        if (row is null) return fallback;
        return int.TryParse(row.ConfigValue, out var value) ? value : fallback;
    }

    public async Task<string?> GetStringAsync(string key)
    {
        var row = await _db.SystemConfigurations.AsNoTracking()
            .FirstOrDefaultAsync(c => c.ConfigKey == key);
        return row?.ConfigValue;
    }
}

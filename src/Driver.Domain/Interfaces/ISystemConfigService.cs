namespace DriverDms.Domain.Interfaces;

public interface ISystemConfigService
{
    Task<int> GetIntAsync(string key, int fallback);
    Task<string?> GetStringAsync(string key);
}

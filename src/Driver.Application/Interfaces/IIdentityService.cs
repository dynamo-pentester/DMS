namespace DriverDms.Application.Interfaces;

public interface IIdentityService
{
    Task<string?> GetUserFullNameAsync(int userId);

    /// <summary>
    /// Returns the integer primary-key of the first user that belongs to the
    /// "HOD" role, or 0 if no manager exists yet.
    /// Used to assign a real manager to Employee-submitted approval requests.
    /// </summary>
    Task<int> GetFirstManagerIdAsync();
}

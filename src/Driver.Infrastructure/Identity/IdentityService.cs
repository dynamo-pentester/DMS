using Microsoft.AspNetCore.Identity;
using DriverDms.Application.Interfaces;

namespace DriverDms.Infrastructure.Identity;

public class IdentityService : IIdentityService
{
    private readonly UserManager<ApplicationUser> _userManager;

    public IdentityService(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<string?> GetUserFullNameAsync(int userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        return user?.FullName ?? user?.UserName;
    }

    /// <inheritdoc />
    public async Task<int> GetFirstManagerIdAsync()
    {
        var managers = await _userManager.GetUsersInRoleAsync("HOD");
        var first = managers.FirstOrDefault();
        if (first is null) return 0;
        try { return Convert.ToInt32(first.Id); } catch { return 0; }
    }
}


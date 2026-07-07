using Microsoft.AspNetCore.Identity;

namespace DriverDms.Infrastructure.Persistence.Seed;

/// <summary>
/// Seeds the six roles from design doc §4.1. These are a starting guess pending client
/// confirmation of actual org terminology (see design doc §5, item 3/7) - reseed/rename
/// freely, that's the entire point of Roles being a table instead of hardcoded strings.
/// </summary>
public static class RoleSeeder
{
    public static readonly string[] DefaultRoles =
    {
        "System Administrator",
        "Employee",
        "Safety Officer",
        "Gate Security",
        "Transport Coordinator",
        "Manager"
    };

    public static async Task SeedAsync(RoleManager<IdentityRole<int>> roleManager)
    {
        foreach (var roleName in DefaultRoles)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
                await roleManager.CreateAsync(new IdentityRole<int>(roleName));
        }
    }
}

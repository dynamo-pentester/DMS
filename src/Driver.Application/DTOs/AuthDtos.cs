namespace DriverDms.Application.DTOs;

public class RegisterRequest
{
    public string FullName { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string Password { get; set; } = default!;
    /// <summary>
    /// Must match one of the seeded roles: SystemAdmin, FleetManager, SafetyOfficer,
    /// HRManager, TransporterCoordinator, ReadOnly
    /// </summary>
    public string Role { get; set; } = "ReadOnly";
}

public class LoginRequest
{
    public string Email { get; set; } = default!;
    public string Password { get; set; } = default!;
}

public class AuthResponse
{
    public string Token { get; set; } = default!;
    public DateTime ExpiresAt { get; set; }
    public string FullName { get; set; } = default!;
    public string Email { get; set; } = default!;
    public IList<string> Roles { get; set; } = new List<string>();
}

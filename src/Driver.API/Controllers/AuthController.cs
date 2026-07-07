using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using DriverDms.Application.DTOs;
using DriverDms.Infrastructure.Identity;
using DriverDms.Infrastructure.Persistence.Seed;

namespace DriverDms.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly SignInManager<ApplicationUser> _signIn;
    private readonly IConfiguration _config;

    public AuthController(
        UserManager<ApplicationUser> users,
        SignInManager<ApplicationUser> signIn,
        IConfiguration config)
    {
        _users = users;
        _signIn = signIn;
        _config = config;
    }

    /// <summary>
    /// Create a new user account and assign a role.
    /// Valid roles (must match RoleSeeder.DefaultRoles exactly, including spacing):
    /// "System Administrator", "HR Executive", "Safety Officer", "Gate Security",
    /// "Transport Coordinator", "Manager".
    /// (Fixed: this comment previously listed SystemAdmin/FleetManager/HRManager/ReadOnly -
    /// names that don't exist in RoleSeeder, which would break Register for anyone who
    /// trusted the comment instead of the actual seeded roles.)
    /// </summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!RoleSeeder.DefaultRoles.Contains(request.Role))
        {
            return BadRequest(new
            {
                error = $"'{request.Role}' is not a recognized role.",
                validRoles = RoleSeeder.DefaultRoles
            });
        }

        var existing = await _users.FindByEmailAsync(request.Email);
        if (existing is not null)
            return Conflict(new { error = "A user with this email already exists." });

        var user = new ApplicationUser
        {
            FullName = request.FullName,
            Email = request.Email,
            UserName = request.Email,
            IsActive = true
        };

        var result = await _users.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        var roleResult = await _users.AddToRoleAsync(user, request.Role);
        if (!roleResult.Succeeded)
            return BadRequest(new { errors = roleResult.Errors.Select(e => e.Description) });

        return Ok(new { message = $"User '{request.Email}' created and assigned role '{request.Role}'." });
    }

    /// <summary>
    /// Login with email and password. Returns a JWT token to use in the Authorize button above.
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _users.FindByEmailAsync(request.Email);
        if (user is null || !user.IsActive)
            return Unauthorized(new { error = "Invalid credentials." });

        var result = await _signIn.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (!result.Succeeded)
        {
            if (result.IsLockedOut)
                return Unauthorized(new { error = "Account is locked out. Try again later." });
            return Unauthorized(new { error = "Invalid credentials." });
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _users.UpdateAsync(user);

        var roles = await _users.GetRolesAsync(user);
        var token = BuildToken(user, roles);

        return Ok(token);
    }
    [HttpGet("test-password")]
public async Task<IActionResult> TestPassword()
{
    var user = await _users.FindByEmailAsync("admin@dms.com");

    if (user == null)
        return NotFound("User not found");

    var ok = await _users.CheckPasswordAsync(user, "Admin@123");

    return Ok(new
    {
        passwordCorrect = ok
    });
}
    [HttpPost("reset-admin-password")]
public async Task<IActionResult> ResetAdminPassword()
{
    var user = await _users.FindByEmailAsync("admin@dms.com");

    if (user == null)
        return NotFound("User not found");

    // Remove existing password
    var hasPassword = await _users.HasPasswordAsync(user);

    if (hasPassword)
    {
        var token = await _users.GeneratePasswordResetTokenAsync(user);

        var reset = await _users.ResetPasswordAsync(
            user,
            token,
            "Admin@123"
        );

        if (!reset.Succeeded)
        {
            return BadRequest(reset.Errors);
        }
    }

    return Ok(new
    {
        message = "Password reset successfully.",
        email = "admin@dms.com",
        password = "Admin@123"
    });
}
    private AuthResponse BuildToken(ApplicationUser user, IList<string> roles)
    {
        var jwtKey = _config["Jwt:Key"]!;
        var issuer  = _config["Jwt:Issuer"]!;
        var audience = _config["Jwt:Audience"]!;

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email!),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new("fullName", user.FullName),
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var key     = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds   = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddHours(8);

        var jwt = new JwtSecurityToken(
            issuer:   issuer,
            audience: audience,
            claims:   claims,
            expires:  expires,
            signingCredentials: creds
        );

        return new AuthResponse
        {
            Token     = new JwtSecurityTokenHandler().WriteToken(jwt),
            ExpiresAt = expires,
            FullName  = user.FullName,
            Email     = user.Email!,
            Roles     = roles
        };
    }
}

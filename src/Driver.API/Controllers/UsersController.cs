using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DriverDms.Infrastructure.Identity;

namespace DriverDms.API.Controllers;

/// <summary>
/// Admin-only endpoint for managing system users.
/// Exposes a paginated list of users with their assigned roles.
/// </summary>
[ApiController]
[Route("api/users")]
[Authorize(Roles = "System Administrator")]
public class UsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;

    public UsersController(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    /// <summary>
    /// Get a paginated list of all system users with their roles.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? search = null)
    {
        var query = _userManager.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            query = query.Where(u =>
                u.FullName.ToLower().Contains(lower) ||
                (u.Email != null && u.Email.ToLower().Contains(lower)));
        }

        var totalCount = await query.CountAsync();
        var users = await query
            .OrderBy(u => u.FullName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // Load roles for each user
        var result = new List<object>();
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            result.Add(new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.UserName,
                user.PhoneNumber,
                user.IsActive,
                user.LastLoginAt,
                Roles = roles
            });
        }

        return Ok(new
        {
            Items = result,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    /// <summary>
    /// Get a single user by ID.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetUser(int id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null)
            return NotFound(new { error = "User not found." });

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new
        {
            user.Id,
            user.FullName,
            user.Email,
            user.UserName,
            user.PhoneNumber,
            user.IsActive,
            user.LastLoginAt,
            Roles = roles
        });
    }

    /// <summary>
    /// Activate or deactivate a user account.
    /// </summary>
    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> SetActiveStatus(int id, [FromBody] SetUserStatusRequest request)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null)
            return NotFound(new { error = "User not found." });

        user.IsActive = request.IsActive;
        await _userManager.UpdateAsync(user);
        return NoContent();
    }

    /// <summary>
    /// Reset a user's password (admin action).
    /// </summary>
    [HttpPost("{id:int}/reset-password")]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetPasswordRequest request)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null)
            return NotFound(new { error = "User not found." });

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, request.NewPassword);

        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        user.PasswordChangedAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        return Ok(new { message = "Password reset successfully." });
    }
}

public class SetUserStatusRequest
{
    public bool IsActive { get; set; }
}

public class ResetPasswordRequest
{
    public string NewPassword { get; set; } = default!;
}

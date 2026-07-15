using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DriverDms.Infrastructure.Identity;
using DriverDms.Infrastructure.Persistence.Seed;
using DriverDms.Application.Interfaces;

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
    private readonly INotificationService _notificationService;

    public UsersController(UserManager<ApplicationUser> userManager, INotificationService notificationService)
    {
        _userManager = userManager;
        _notificationService = notificationService;
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
            var (firstName, lastName) = SplitFullName(user.FullName);
            result.Add(new
            {
                user.Id,
                user.FullName,
                FirstName = firstName,
                LastName = lastName,
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
        var (firstName, lastName) = SplitFullName(user.FullName);
        return Ok(new
        {
            user.Id,
            user.FullName,
            FirstName = firstName,
            LastName = lastName,
            user.Email,
            user.UserName,
            user.PhoneNumber,
            user.IsActive,
            user.LastLoginAt,
            Roles = roles
        });
    }

    /// <summary>
    /// Create a new system user and assign a role. This is what the "Add User" dialog
    /// in the System Administrator module submits to.
    ///
    /// ROOT CAUSE of "Add User doesn't work": this action method did not exist at all.
    /// The frontend posted to POST /api/users and always got a 404, which the modal
    /// surfaced as a generic "Failed to save user" toast. There was no broken DTO,
    /// AutoMapper, or UserManager call to fix - the endpoint was simply missing.
    ///
    /// Two related issues are also fixed here so a create fully succeeds end to end:
    ///  1. The frontend's role dropdown sends values without spaces
    ///     (e.g. "SystemAdministrator"), but RoleSeeder seeds roles WITH spaces
    ///     (e.g. "System Administrator"). ResolveRoleName() normalizes both sides
    ///     before calling AddToRoleAsync so role assignment actually succeeds.
    ///  2. ApplicationUser only has a single FullName column (existing schema, kept
    ///     as-is) but the frontend list renders row.firstName / row.lastName.
    ///     SplitFullName() bridges that without adding any database columns.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
            return BadRequest(new { error = "First name and last name are required." });

        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.UserName))
            return BadRequest(new { error = "Email and username are required." });

        if (string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { error = "Password is required." });

        var roleName = ResolveRoleName(request.Role);
        if (roleName is null)
        {
            return BadRequest(new
            {
                error = $"'{request.Role}' is not a recognized role.",
                validRoles = RoleSeeder.DefaultRoles
            });
        }

        var existingByEmail = await _userManager.FindByEmailAsync(request.Email);
        if (existingByEmail is not null)
            return Conflict(new { error = "A user with this email already exists." });

        var existingByUserName = await _userManager.FindByNameAsync(request.UserName);
        if (existingByUserName is not null)
            return Conflict(new { error = "A user with this username already exists." });

        var user = new ApplicationUser
        {
            FullName = $"{request.FirstName.Trim()} {request.LastName.Trim()}".Trim(),
            Email = request.Email,
            UserName = request.UserName,
            PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber,
            IsActive = true
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
            return BadRequest(new { errors = createResult.Errors.Select(e => e.Description) });

        var roleResult = await _userManager.AddToRoleAsync(user, roleName);
        if (!roleResult.Succeeded)
        {
            // Don't leave a role-less orphan account behind if role assignment fails.
            await _userManager.DeleteAsync(user);
            return BadRequest(new { errors = roleResult.Errors.Select(e => e.Description) });
        }

        await _notificationService.RaiseAsync(
            entityTypeName: "System",
            entityId: user.Id,
            title: "New user created",
            message: $"A new user {user.FullName} ({roleName}) has been created.",
            dueDate: DateTime.UtcNow);

        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, new
        {
            user.Id,
            user.FullName,
            FirstName = request.FirstName,
            LastName = request.LastName,
            user.Email,
            user.UserName,
            user.PhoneNumber,
            user.IsActive,
            Roles = new[] { roleName }
        });
    }

    /// <summary>
    /// Update an existing user's profile fields and role assignment.
    ///
    /// ROOT CAUSE of "Edit User doesn't work": the frontend's edit form (UsersList.tsx)
    /// posts to PUT /api/users/{id} and this action method did not exist at all - same
    /// class of bug as the missing POST above. Any fields left null/empty on the request
    /// are left unchanged (partial update), matching UpdateUserRequest being defined with
    /// all-optional properties on the frontend.
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null)
            return NotFound(new { error = "User not found." });

        if (!string.IsNullOrWhiteSpace(request.FirstName) || !string.IsNullOrWhiteSpace(request.LastName))
        {
            var (currentFirst, currentLast) = SplitFullName(user.FullName);
            var newFirst = string.IsNullOrWhiteSpace(request.FirstName) ? currentFirst : request.FirstName.Trim();
            var newLast = string.IsNullOrWhiteSpace(request.LastName) ? currentLast : request.LastName.Trim();
            user.FullName = $"{newFirst} {newLast}".Trim();
        }

        if (request.PhoneNumber is not null)
            user.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber;

        if (request.IsActive.HasValue)
            user.IsActive = request.IsActive.Value;

        string? resolvedRole = null;
        if (!string.IsNullOrWhiteSpace(request.Role))
        {
            resolvedRole = ResolveRoleName(request.Role);
            if (resolvedRole is null)
            {
                return BadRequest(new
                {
                    error = $"'{request.Role}' is not a recognized role.",
                    validRoles = RoleSeeder.DefaultRoles
                });
            }
        }

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
            return BadRequest(new { errors = updateResult.Errors.Select(e => e.Description) });

        if (resolvedRole is not null)
        {
            var currentRoles = await _userManager.GetRolesAsync(user);
            if (!currentRoles.Contains(resolvedRole) || currentRoles.Count > 1)
            {
                var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
                if (!removeResult.Succeeded)
                    return BadRequest(new { errors = removeResult.Errors.Select(e => e.Description) });

                var addResult = await _userManager.AddToRoleAsync(user, resolvedRole);
                if (!addResult.Succeeded)
                    return BadRequest(new { errors = addResult.Errors.Select(e => e.Description) });
            }
        }

        var roles = await _userManager.GetRolesAsync(user);
        var (firstName, lastName) = SplitFullName(user.FullName);
        return Ok(new
        {
            user.Id,
            user.FullName,
            FirstName = firstName,
            LastName = lastName,
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

    /// <summary>
    /// Delete a user account (admin action).
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null)
            return NotFound(new { error = "User not found." });

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        return NoContent();
    }


    /// <summary>
    /// Splits the single FullName column into (FirstName, LastName) for API responses
    /// that need both, without changing the underlying Identity schema.
    /// </summary>
    private static (string FirstName, string LastName) SplitFullName(string? fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            return (string.Empty, string.Empty);

        var parts = fullName.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        return parts.Length switch
        {
            0 => (string.Empty, string.Empty),
            1 => (parts[0], string.Empty),
            _ => (parts[0], parts[1])
        };
    }

    /// <summary>
    /// Matches a role name coming from the client against RoleSeeder.DefaultRoles,
    /// ignoring spacing/case differences (the frontend sends "SystemAdministrator";
    /// the seeded role is "System Administrator").
    /// </summary>
    private static string? ResolveRoleName(string? requestedRole)
    {
        if (string.IsNullOrWhiteSpace(requestedRole))
            return null;

        var normalizedRequested = requestedRole.Replace(" ", "").ToLowerInvariant();
        return RoleSeeder.DefaultRoles.FirstOrDefault(
            r => r.Replace(" ", "").ToLowerInvariant() == normalizedRequested);
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

public class CreateUserRequest
{
    public string FirstName { get; set; } = default!;
    public string LastName { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string UserName { get; set; } = default!;
    public string Password { get; set; } = default!;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = default!;
}

/// <summary>
/// Partial update - all fields optional. Mirrors dms-frontend/src/types/user.ts's
/// UpdateUserRequest exactly (firstName, lastName, phoneNumber, role, isActive).
/// Email/UserName are intentionally not editable here since ApplicationUser identity
/// fields have their own dedicated flows elsewhere (not in scope for this endpoint).
/// </summary>
public class UpdateUserRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
}

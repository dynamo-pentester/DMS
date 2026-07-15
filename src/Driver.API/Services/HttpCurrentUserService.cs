using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using DriverDms.Application.Interfaces;

namespace DriverDms.API.Services;

/// <summary>
/// HTTP-context-backed implementation of ICurrentUserService.
/// Returns null gracefully when there is no active request (e.g. Hangfire background job).
/// </summary>
public class HttpCurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _accessor;

    public HttpCurrentUserService(IHttpContextAccessor accessor)
    {
        _accessor = accessor;
    }

    public string? Role
    {
        get
        {
            var user = _accessor.HttpContext?.User;
            if (user is null) return null;
            return user.Claims
                .FirstOrDefault(c => c.Type == ClaimTypes.Role || c.Type == "role")
                ?.Value;
        }
    }
}

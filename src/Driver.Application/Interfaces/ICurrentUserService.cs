namespace DriverDms.Application.Interfaces;

/// <summary>
/// Abstracts the current caller's identity so that Application layer services
/// (NotificationService) don't take a direct dependency on IHttpContextAccessor
/// (which lives in Microsoft.AspNetCore.Http, an infrastructure concern).
/// The API layer registers an implementation backed by IHttpContextAccessor.
/// </summary>
public interface ICurrentUserService
{
    /// <summary>
    /// Returns the primary role name of the logged-in user (e.g. "HOD"),
    /// or null when there is no active request context (e.g. background jobs).
    /// </summary>
    string? Role { get; }
}

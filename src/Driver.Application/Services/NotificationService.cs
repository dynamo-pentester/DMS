using Microsoft.EntityFrameworkCore;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;
using DriverDms.Domain.Entities;

namespace DriverDms.Application.Services;

public class NotificationService : INotificationService
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public NotificationService(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    // Filter to only notifications the current user is allowed to see:
    //   TargetRole IS NULL  → visible to all roles (expiry alerts etc.)
    //   TargetRole = role   → visible only to that role (data-entry alerts)
    private IQueryable<Notification> ApplyRoleFilter(IQueryable<Notification> query)
    {
        var role = _currentUser.Role;
        if (role is null) return query; // background job: no filter
        return query.Where(n => n.TargetRole == null || n.TargetRole == role);
    }

    public async Task<NotificationDto?> GetByIdAsync(int notificationId)
    {
        var notification = await ApplyRoleFilter(
            _db.Notifications
               .Include(n => n.NotificationEntityType)
               .Include(n => n.NotificationStatus))
            .FirstOrDefaultAsync(n => n.NotificationId == notificationId);

        return notification is null ? null : ToDto(notification);
    }

    public async Task<PagedResult<NotificationDto>> SearchAsync(NotificationSearchRequest request)
    {
        var query = ApplyRoleFilter(
            _db.Notifications
               .Include(n => n.NotificationEntityType)
               .Include(n => n.NotificationStatus));

        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(n => n.NotificationStatus!.Name == request.Status);

        if (!string.IsNullOrWhiteSpace(request.EntityType))
            query = query.Where(n => n.NotificationEntityType!.Name == request.EntityType);

        if (request.OnlyUnread.HasValue && request.OnlyUnread.Value)
            query = query.Where(n => !n.IsRead && n.NotificationStatus!.Name != "Dismissed");

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        return new PagedResult<NotificationDto>
        {
            Items = items.Select(ToDto).ToList(),
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }

    public async Task DismissAsync(int notificationId)
    {
        var notification = await _db.Notifications.FirstOrDefaultAsync(n => n.NotificationId == notificationId)
            ?? throw new InvalidOperationException($"Notification {notificationId} not found.");

        var dismissedStatusId = await _db.NotificationStatuses
            .Where(s => s.Name == "Dismissed")
            .Select(s => s.NotificationStatusId)
            .FirstAsync();

        notification.NotificationStatusId = dismissedStatusId;
        notification.DismissedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }

    public async Task MarkAsReadAsync(int notificationId)
    {
        var notification = await _db.Notifications.FirstOrDefaultAsync(n => n.NotificationId == notificationId)
            ?? throw new InvalidOperationException($"Notification {notificationId} not found.");

        notification.IsRead = true;
        await _db.SaveChangesAsync();
    }

    public async Task MarkAllAsReadAsync()
    {
        // Only mark notifications this user is allowed to see
        var unread = await ApplyRoleFilter(_db.Notifications.Where(n => !n.IsRead)).ToListAsync();
        foreach (var n in unread)
        {
            n.IsRead = true;
        }
        await _db.SaveChangesAsync();
    }

    public async Task<int> GetUnreadCountAsync()
    {
        return await ApplyRoleFilter(
            _db.Notifications
               .Include(n => n.NotificationStatus)
               .Where(n => !n.IsRead && n.NotificationStatus!.Name != "Dismissed"))
            .CountAsync();
    }

    public async Task DeleteAsync(int notificationId)
    {
        await DismissAsync(notificationId);
    }

    public async Task<NotificationDto> RaiseAsync(
        string entityTypeName,
        int entityId,
        string title,
        string message,
        DateTime dueDate,
        string? targetRole = null)
    {
        var entityType = await _db.NotificationEntityTypes.FirstOrDefaultAsync(t => t.Name == entityTypeName)
            ?? throw new InvalidOperationException($"Unknown notification entity type '{entityTypeName}'.");

        // Dedupe: if a non-dismissed, non-expired notification already exists for this
        // exact entity + targetRole, return it instead of creating a duplicate.
        var existing = await _db.Notifications
            .Include(n => n.NotificationEntityType)
            .Include(n => n.NotificationStatus)
            .Where(n => n.NotificationEntityTypeId == entityType.NotificationEntityTypeId
                        && n.EntityId == entityId
                        && n.TargetRole == targetRole
                        && n.NotificationStatus!.Name != "Dismissed"
                        && n.NotificationStatus!.Name != "Expired")
            .FirstOrDefaultAsync();

        if (existing is not null)
            return ToDto(existing);

        var pendingStatusId = await _db.NotificationStatuses
            .Where(s => s.Name == "Pending")
            .Select(s => s.NotificationStatusId)
            .FirstAsync();

        var notification = new Notification
        {
            NotificationEntityTypeId = entityType.NotificationEntityTypeId,
            EntityId = entityId,
            Title = title,
            Message = message,
            DueDate = dueDate,
            NotificationStatusId = pendingStatusId,
            CreatedAt = DateTime.UtcNow,
            TargetRole = targetRole
        };

        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();

        // Use raw (no role filter) reload here — the creator may not be in the
        // targetRole (e.g. Employee creates an incident → Manager-targeted notification).
        // ApplyRoleFilter would hide it from the Employee and return null → error.
        return await LoadByIdRawAsync(notification.NotificationId)
            ?? throw new InvalidOperationException("Failed to reload created notification.");
    }

    // Loads a notification by ID WITHOUT any role filter.
    // Only used internally by RaiseAsync where we know the row exists.
    private async Task<NotificationDto?> LoadByIdRawAsync(int notificationId)
    {
        var notification = await _db.Notifications
            .Include(n => n.NotificationEntityType)
            .Include(n => n.NotificationStatus)
            .FirstOrDefaultAsync(n => n.NotificationId == notificationId);

        return notification is null ? null : ToDto(notification);
    }

    private static NotificationDto ToDto(Notification n) => new()
    {
        NotificationId = n.NotificationId,
        EntityTypeName = n.NotificationEntityType?.Name ?? string.Empty,
        EntityId = n.EntityId,
        Title = n.Title,
        Message = n.Message,
        DueDate = n.DueDate,
        StatusName = n.NotificationStatus?.Name ?? string.Empty,
        CreatedAt = n.CreatedAt,
        DismissedAt = n.DismissedAt,
        IsRead = n.IsRead,
        TargetRole = n.TargetRole
    };
}

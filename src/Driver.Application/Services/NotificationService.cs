using Microsoft.EntityFrameworkCore;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;
using DriverDms.Domain.Entities;

namespace DriverDms.Application.Services;

public class NotificationService : INotificationService
{
    private readonly IApplicationDbContext _db;

    public NotificationService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<NotificationDto?> GetByIdAsync(int notificationId)
    {
        var notification = await _db.Notifications
            .Include(n => n.NotificationEntityType)
            .Include(n => n.NotificationStatus)
            .FirstOrDefaultAsync(n => n.NotificationId == notificationId);

        return notification is null ? null : ToDto(notification);
    }

    public async Task<PagedResult<NotificationDto>> SearchAsync(NotificationSearchRequest request)
    {
        var query = _db.Notifications
            .Include(n => n.NotificationEntityType)
            .Include(n => n.NotificationStatus)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(n => n.NotificationStatus!.Name == request.Status);

        if (!string.IsNullOrWhiteSpace(request.EntityType))
            query = query.Where(n => n.NotificationEntityType!.Name == request.EntityType);

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

    public async Task<NotificationDto> RaiseAsync(string entityTypeName, int entityId, string title, string message, DateTime dueDate)
    {
        var entityType = await _db.NotificationEntityTypes.FirstOrDefaultAsync(t => t.Name == entityTypeName)
            ?? throw new InvalidOperationException($"Unknown notification entity type '{entityTypeName}'.");

        // Dedupe: if a non-dismissed, non-expired notification already exists for this
        // exact entity, return it instead of creating a duplicate - the daily
        // ExpiryAlertJob run would otherwise spam a new row every single day for the
        // same still-expiring record.
        var existing = await _db.Notifications
            .Include(n => n.NotificationEntityType)
            .Include(n => n.NotificationStatus)
            .Where(n => n.NotificationEntityTypeId == entityType.NotificationEntityTypeId
                        && n.EntityId == entityId
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
            CreatedAt = DateTime.UtcNow
        };

        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(notification.NotificationId)
            ?? throw new InvalidOperationException("Failed to reload created notification.");
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
        DismissedAt = n.DismissedAt
    };
}

using Microsoft.EntityFrameworkCore;
using Xunit;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;
using DriverDms.Application.Services;
using DriverDms.Domain.Entities;
using DriverDms.Infrastructure.Persistence;
using DriverDms.Infrastructure.Jobs;
using DriverDms.Domain.Interfaces;
using Microsoft.Extensions.Logging;
using Moq;

namespace DriverDms.Tests;

public class NotificationServiceTests
{
    private static DriverDmsContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<DriverDmsContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        var ctx = new DriverDmsContext(options);
        ctx.Database.EnsureCreated();
        return ctx;
    }

    [Fact]
    public async Task RaiseAsync_PreventsDuplicatesForActiveNotifications()
    {
        using var ctx = CreateContext(nameof(RaiseAsync_PreventsDuplicatesForActiveNotifications));
        var currentUser = new Mock<ICurrentUserService>();
        currentUser.Setup(c => c.Role).Returns((string?)null); // no role filter in tests
        var service = new NotificationService(ctx, currentUser.Object);

        // Raise first notification
        var first = await service.RaiseAsync(
            entityTypeName: "License",
            entityId: 101,
            title: "License expiring",
            message: "Expires soon",
            dueDate: DateTime.UtcNow.AddDays(10));

        // Raise second time
        var second = await service.RaiseAsync(
            entityTypeName: "License",
            entityId: 101,
            title: "License expiring",
            message: "Expires soon",
            dueDate: DateTime.UtcNow.AddDays(10));

        // Assert they are the same notification and no duplicate was created
        Assert.Equal(first.NotificationId, second.NotificationId);
        
        var count = await ctx.Notifications.CountAsync(n => n.EntityId == 101);
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task ExpiryAlertJob_CreatesNotificationsAndPreventsDuplicates()
    {
        using var ctx = CreateContext(nameof(ExpiryAlertJob_CreatesNotificationsAndPreventsDuplicates));
        var currentUser = new Mock<ICurrentUserService>();
        currentUser.Setup(c => c.Role).Returns((string?)null);
        var notificationsService = new NotificationService(ctx, currentUser.Object);

        // Mock Config Service to return 30 days window
        var configMock = new Mock<ISystemConfigService>();
        configMock.Setup(c => c.GetIntAsync("LicenseReminderDays", It.IsAny<int>())).ReturnsAsync(30);
        configMock.Setup(c => c.GetIntAsync("MedicalReminderDays", It.IsAny<int>())).ReturnsAsync(30);
        configMock.Setup(c => c.GetIntAsync("TrainingReminderDays", It.IsAny<int>())).ReturnsAsync(30);

        var loggerMock = new Mock<ILogger<ExpiryAlertJob>>();

        var job = new ExpiryAlertJob(ctx, configMock.Object, notificationsService, loggerMock.Object);

        // Add a driver
        var driver = new DriverDms.Domain.Entities.Driver
        {
            DriverId = 1,
            DriverCode = "DRV-2026-000001",
            FullName = "John Doe",
            Mobile = "1234567890",
            DateOfBirth = new DateTime(1985, 1, 1),
            CurrentStatusId = 1
        };
        ctx.Drivers.Add(driver);

        // Add an expiring license (expires in 10 days)
        var license = new License
        {
            LicenseId = 10,
            DriverId = 1,
            LicenseNo = "LIC-12345",
            IssueDate = DateTime.UtcNow.AddYears(-1),
            ValidTill = DateTime.UtcNow.AddDays(10),
            VehicleTypeId = 1
        };
        ctx.Licenses.Add(license);

        // Add an expiring medical record (expires in 15 days)
        var medical = new MedicalRecord
        {
            MedicalRecordId = 20,
            DriverId = 1,
            ExamDate = DateTime.UtcNow.AddMonths(-1),
            FitnessStatusId = 1,
            ValidTill = DateTime.UtcNow.AddDays(15)
        };
        ctx.MedicalRecords.Add(medical);

        // Add an expiring training record (expires in 20 days)
        var training = new Training
        {
            TrainingId = 30,
            DriverId = 1,
            DateCompleted = DateTime.UtcNow.AddMonths(-1),
            ValidUpto = DateTime.UtcNow.AddDays(20),
            TrainingTypeId = 1
        };
        ctx.Trainings.Add(training);

        await ctx.SaveChangesAsync();

        // 1. Run the job first time
        await job.RunAsync();

        // Verify notifications were raised
        var licenseNotification = await ctx.Notifications.FirstOrDefaultAsync(n => n.NotificationEntityTypeId == 1 && n.EntityId == 10);
        var medicalNotification = await ctx.Notifications.FirstOrDefaultAsync(n => n.NotificationEntityTypeId == 2 && n.EntityId == 20);
        var trainingNotification = await ctx.Notifications.FirstOrDefaultAsync(n => n.NotificationEntityTypeId == 3 && n.EntityId == 30);

        Assert.NotNull(licenseNotification);
        Assert.NotNull(medicalNotification);
        Assert.NotNull(trainingNotification);

        // 2. Run the job a second time to test deduplication
        await job.RunAsync();

        var totalNotifications = await ctx.Notifications.CountAsync();
        Assert.Equal(3, totalNotifications); // Should still be exactly 3, no duplicates!

        // 3. Dismiss the license notification, and run the job again
        await notificationsService.DismissAsync(licenseNotification.NotificationId);
        await job.RunAsync();

        // Verify a new license notification was raised since the old one is dismissed
        var newLicenseNotification = await ctx.Notifications
            .Where(n => n.NotificationEntityTypeId == 1 && n.EntityId == 10 && n.NotificationStatusId != 3) // not Dismissed
            .FirstOrDefaultAsync();

        Assert.NotNull(newLicenseNotification);
        Assert.NotEqual(licenseNotification.NotificationId, newLicenseNotification.NotificationId);
    }

    [Fact]
    public async Task ReadAndDismissActions_CorrectlyUpdateStates()
    {
        using var ctx = CreateContext(nameof(ReadAndDismissActions_CorrectlyUpdateStates));
        var currentUser = new Mock<ICurrentUserService>();
        currentUser.Setup(c => c.Role).Returns((string?)null);
        var service = new NotificationService(ctx, currentUser.Object);

        var first = await service.RaiseAsync("License", 501, "Test Alert 1", "Msg 1", DateTime.UtcNow);
        var second = await service.RaiseAsync("Medical", 502, "Test Alert 2", "Msg 2", DateTime.UtcNow);

        // Initial check
        var unreadCount = await service.GetUnreadCountAsync();
        Assert.Equal(2, unreadCount);

        // Mark first as read
        await service.MarkAsReadAsync(first.NotificationId);
        
        unreadCount = await service.GetUnreadCountAsync();
        Assert.Equal(1, unreadCount);
        
        var firstUpdated = await service.GetByIdAsync(first.NotificationId);
        Assert.True(firstUpdated!.IsRead);

        // Dismiss second
        await service.DismissAsync(second.NotificationId);

        unreadCount = await service.GetUnreadCountAsync();
        Assert.Equal(0, unreadCount);

        // Verify search filters unread
        var searchResult = await service.SearchAsync(new NotificationSearchRequest { OnlyUnread = true });
        Assert.Empty(searchResult.Items);
    }
}

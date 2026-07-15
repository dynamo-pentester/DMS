using Microsoft.EntityFrameworkCore;
using Xunit;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;
using DriverDms.Application.Services;
using DriverDms.Infrastructure.Persistence;
using Moq;

namespace DriverDms.Tests;

public class DriverServiceTests
{
    private static DriverDmsContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<DriverDmsContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        var ctx = new DriverDmsContext(options);
        ctx.Database.EnsureCreated(); // applies HasData seed rows (DriverStatusTypes, VehicleTypes, SystemConfiguration)
        return ctx;
    }

    [Fact]
    public async Task CreateAsync_GeneratesSequentialDriverCode()
    {
        using var ctx = CreateContext(nameof(CreateAsync_GeneratesSequentialDriverCode));
        var fileStorageMock = new Mock<IFileStorageService>();
        var identityServiceMock = new Mock<IIdentityService>();
        var notificationServiceMock = new Mock<INotificationService>();
        var service = new DriverService(ctx, fileStorageMock.Object, identityServiceMock.Object, notificationServiceMock.Object);

        var first = await service.CreateAsync(new CreateDriverRequest
        {
            FullName = "Test Driver One",
            Mobile = "9999999901",
            DateOfBirth = new DateTime(1990, 1, 1)
        }, createdByUserId: 1, callerRole: "System Administrator");

        var second = await service.CreateAsync(new CreateDriverRequest
        {
            FullName = "Test Driver Two",
            Mobile = "9999999902",
            DateOfBirth = new DateTime(1991, 1, 1)
        }, createdByUserId: 1, callerRole: "System Administrator");

        var year = DateTime.UtcNow.Year;
        Assert.Equal($"DRV-{year}-000001", first.DriverCode);
        Assert.Equal($"DRV-{year}-000002", second.DriverCode);
    }

    [Fact]
    public async Task DeleteAsync_SoftDeletesRatherThanRemovingRow()
    {
        using var ctx = CreateContext(nameof(DeleteAsync_SoftDeletesRatherThanRemovingRow));
        var fileStorageMock = new Mock<IFileStorageService>();
        var identityServiceMock = new Mock<IIdentityService>();
        var notificationServiceMock = new Mock<INotificationService>();
        var service = new DriverService(ctx, fileStorageMock.Object, identityServiceMock.Object, notificationServiceMock.Object);

        var created = await service.CreateAsync(new CreateDriverRequest
        {
            FullName = "To Be Deleted",
            Mobile = "9999999903",
            DateOfBirth = new DateTime(1992, 1, 1)
        }, createdByUserId: 1, callerRole: "System Administrator");

        await service.DeleteAsync(created.DriverId, deletedByUserId: 1);

        // Proves DriverDmsContext.ApplyAuditAndSoftDeleteConventions() actually intercepts
        // the delete: the row must still exist physically, just flagged IsDeleted.
        var raw = await ctx.Drivers.IgnoreQueryFilters()
            .FirstOrDefaultAsync(d => d.DriverId == created.DriverId);

        Assert.NotNull(raw);
        Assert.True(raw!.IsDeleted);
        Assert.NotNull(raw.DeletedAt);
        Assert.Equal(1, raw.DeletedBy);

        // And the normal query filter should hide it from GetByIdAsync.
        var viaService = await service.GetByIdAsync(created.DriverId);
        Assert.Null(viaService);
    }
}

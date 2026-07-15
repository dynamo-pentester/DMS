using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using DriverDms.Application.Interfaces;
using DriverDms.Domain.Interfaces;
using DriverDms.Infrastructure.Configuration;
using DriverDms.Infrastructure.Identity;
using DriverDms.Infrastructure.Jobs;
using DriverDms.Infrastructure.Persistence;
using DriverDms.Infrastructure.Storage;

namespace DriverDms.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<DriverDmsContext>(options =>
            options.UseSqlServer(config.GetConnectionString("DefaultConnection")));

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<DriverDmsContext>());

        services.AddIdentity<ApplicationUser, IdentityRole<int>>(options =>
            {
                options.Password.RequiredLength = 8;
                options.User.RequireUniqueEmail = true;
            })
            .AddEntityFrameworkStores<DriverDmsContext>()
            .AddDefaultTokenProviders();

        services.AddScoped<ISystemConfigService, SystemConfigService>();
        services.AddScoped<IApprovalService, DriverDms.Application.Services.ApprovalService>();
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<ExpiryAlertJob>();

        // Disk-based storage for driver photos / license / medical / incident documents.
        // Files are never stored in SQL Server - only the relative path is persisted.
        services.AddScoped<Application.Interfaces.IFileStorageService, FileStorageService>();

        return services;
    }
}

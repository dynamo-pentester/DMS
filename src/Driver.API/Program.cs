using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using Hangfire;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using DriverDms.Application.Interfaces;
using DriverDms.Application.Services;
using DriverDms.Application.Validators;
using DriverDms.Infrastructure;
using DriverDms.Infrastructure.Jobs;
using DriverDms.Infrastructure.Notifications;
using DriverDms.Infrastructure.Persistence.Seed;
using DriverDms.Infrastructure.Identity;
using DriverDms.API.Services;

var builder = WebApplication.CreateBuilder(args);

// ---- Serilog ----
builder.Host.UseSerilog((ctx, cfg) => cfg.ReadFrom.Configuration(ctx.Configuration));

// ---- Infrastructure (DbContext, Identity, config service, jobs) ----
builder.Services.AddInfrastructure(builder.Configuration);

// ---- Application services ----
builder.Services.AddScoped<IDriverService, DriverService>();
builder.Services.AddScoped<ILicenseService, LicenseService>();
builder.Services.AddScoped<ITransporterService, TransporterService>();
builder.Services.AddScoped<IMedicalRecordService, MedicalRecordService>();
builder.Services.AddScoped<IIncidentService, IncidentService>();
builder.Services.AddScoped<IPlantMovementService, PlantMovementService>();
builder.Services.AddScoped<ITrainingService, TrainingService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<LicenseStatusResolver>();
builder.Services.AddScoped<MedicalStatusResolver>();
builder.Services.AddScoped<TrainingStatusResolver>();

// Deliberately dead code for now - registered so the interface resolves, but nothing
// in the active flow calls SendAsync. See IEmailNotificationSender's doc comment.
builder.Services.AddScoped<IEmailNotificationSender, StubEmailNotificationSender>();
builder.Services.AddValidatorsFromAssemblyContaining<CreateDriverRequestValidator>();
builder.Services.AddFluentValidationAutoValidation();

// ---- JWT Auth ----
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key is not configured - set it via user-secrets or environment variables, not appsettings.json.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});
builder.Services.AddAuthorization();

// ---- CORS ----
// Origins are configured in appsettings.json under Cors:AllowedOrigins.
// Add your frontend dev-server URL(s) there — no code change needed.
// Auth is Bearer-header-based, so AllowCredentials() is intentionally omitted.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        if (builder.Environment.IsDevelopment() && allowedOrigins.Length == 0)
        {
            // Fallback safety net so the API isn't CORS-blocked even if someone
            // clones without editing appsettings.json first.
            policy.WithOrigins(
                    "http://localhost:3000",
                    "http://localhost:5173",
                    "http://localhost:4200")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
    });
});

// ---- Hangfire ----
builder.Services.AddHangfire(cfg => cfg
    .UseSqlServerStorage(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddHangfireServer();

// ---- Controllers / Swagger ----
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, HttpCurrentUserService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Driver.API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme       = "Bearer",
        BearerFormat = "JWT",
        In           = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description  = "Paste your JWT token here (without the 'Bearer ' prefix - Swagger adds it)"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id   = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ---- Seed roles on startup ----
using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<int>>>();
    await RoleSeeder.SeedAsync(roleManager);
}
// ---- Reset Admin Password (Run Once) ----
using (var scope = app.Services.CreateScope())
{
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var emails = new[] { "admin@dms.com", "manager@dms.com", "employee@dms.com", "safety@dms.com", "gate@dms.com", "transport@dms.com" };
    foreach (var email in emails)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user != null)
        {
            await userManager.RemovePasswordAsync(user);
            await userManager.AddPasswordAsync(user, "Admin@123");
        }
    }
}


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// UseCors must come after UseRouting and before UseAuthentication/UseAuthorization
app.UseCors("FrontendPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.UseHangfireDashboard();
RecurringJob.AddOrUpdate<ExpiryAlertJob>("expiry-check", j => j.RunAsync(), Cron.Daily);

app.MapControllers();

app.Run();
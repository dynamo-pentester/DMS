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

// ---- Hangfire ----
builder.Services.AddHangfire(cfg => cfg
    .UseSqlServerStorage(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddHangfireServer();

// ---- Controllers / Swagger ----
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Driver.API", Version = "v1" });
    // Adds the Authorize button to Swagger UI so you can paste your JWT token
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

// ---- Seed roles on startup (design doc §4.1 - reseed/rename freely, no schema impact) ----
using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<int>>>();
    await RoleSeeder.SeedAsync(roleManager);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.UseHangfireDashboard(); // lock this down behind auth before production - see README
RecurringJob.AddOrUpdate<ExpiryAlertJob>("expiry-check", j => j.RunAsync(), Cron.Daily);

app.MapControllers();

app.Run();

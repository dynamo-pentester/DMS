using System;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DriverDms.Application.Interfaces;
using DriverDms.Application.Services;

namespace DriverDms.API.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Roles = "System Administrator,Manager")]
public class ReportsController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly LicenseStatusResolver _licenseResolver;
    private readonly MedicalStatusResolver _medicalResolver;
    private readonly TrainingStatusResolver _trainingResolver;

    public ReportsController(
        IApplicationDbContext context,
        LicenseStatusResolver licenseResolver,
        MedicalStatusResolver medicalResolver,
        TrainingStatusResolver trainingResolver)
    {
        _context = context;
        _licenseResolver = licenseResolver;
        _medicalResolver = medicalResolver;
        _trainingResolver = trainingResolver;
    }

    [HttpGet("licenseexpiry")]
    public async Task<IActionResult> GetLicenseExpiryReport(
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] int? driverId)
    {
        var query = _context.Licenses
            .Include(l => l.Driver)
            .Include(l => l.VehicleType)
            .AsQueryable();

        if (dateFrom.HasValue)
            query = query.Where(l => l.ValidTill >= dateFrom.Value);
        if (dateTo.HasValue)
            query = query.Where(l => l.ValidTill <= dateTo.Value);
        if (driverId.HasValue)
            query = query.Where(l => l.DriverId == driverId.Value);

        var records = await query.ToListAsync();

        var csv = new StringBuilder();
        csv.AppendLine("Driver Code,Driver Name,License Number,Issue Date,Valid Till,Vehicle Type,Status");

        foreach (var record in records)
        {
            var status = await _licenseResolver.GetStatusAsync(record);
            csv.AppendLine($"{EscapeCsv(record.Driver?.DriverCode)},{EscapeCsv(record.Driver?.FullName)},{EscapeCsv(record.LicenseNo)},{record.IssueDate:yyyy-MM-dd},{record.ValidTill:yyyy-MM-dd},{EscapeCsv(record.VehicleType?.Name)},{status}");
        }

        var bytes = Encoding.UTF8.GetBytes(csv.ToString());
        return File(bytes, "text/csv", "LicenseExpiryReport.csv");
    }

    [HttpGet("medicalexpiry")]
    public async Task<IActionResult> GetMedicalExpiryReport(
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] int? driverId)
    {
        var query = _context.MedicalRecords
            .Include(m => m.Driver)
            .Include(m => m.FitnessStatus)
            .AsQueryable();

        if (dateFrom.HasValue)
            query = query.Where(m => m.ValidTill >= dateFrom.Value);
        if (dateTo.HasValue)
            query = query.Where(m => m.ValidTill <= dateTo.Value);
        if (driverId.HasValue)
            query = query.Where(m => m.DriverId == driverId.Value);

        var records = await query.ToListAsync();

        var csv = new StringBuilder();
        csv.AppendLine("Driver Code,Driver Name,Exam Date,Valid Till,Fitness Status,BP,Vision Test,Alcohol Test,Chronic Illness,Remarks,Status");

        foreach (var record in records)
        {
            var status = await _medicalResolver.GetStatusAsync(record);
            csv.AppendLine($"{EscapeCsv(record.Driver?.DriverCode)},{EscapeCsv(record.Driver?.FullName)},{record.ExamDate:yyyy-MM-dd},{record.ValidTill:yyyy-MM-dd},{EscapeCsv(record.FitnessStatus?.Name)},{EscapeCsv(record.BP)},{(record.VisionTestPass ? "Pass" : "Fail")},{(record.AlcoholTestPass ? "Pass" : "Fail")},{(record.ChronicIllness ? "Yes" : "No")},{EscapeCsv(record.ChronicIllnessRemarks)},{status}");
        }

        var bytes = Encoding.UTF8.GetBytes(csv.ToString());
        return File(bytes, "text/csv", "MedicalExpiryReport.csv");
    }

    [HttpGet("trainingexpiry")]
    public async Task<IActionResult> GetTrainingExpiryReport(
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] int? driverId)
    {
        var query = _context.Trainings
            .Include(t => t.Driver)
            .Include(t => t.TrainingType)
            .AsQueryable();

        if (dateFrom.HasValue)
            query = query.Where(t => t.ValidUpto >= dateFrom.Value);
        if (dateTo.HasValue)
            query = query.Where(t => t.ValidUpto <= dateTo.Value);
        if (driverId.HasValue)
            query = query.Where(t => t.DriverId == driverId.Value);

        var records = await query.ToListAsync();

        var csv = new StringBuilder();
        csv.AppendLine("Driver Code,Driver Name,Training Type,Date Completed,Valid Upto,Trainer Name,Status");

        foreach (var record in records)
        {
            var status = await _trainingResolver.GetStatusAsync(record);
            csv.AppendLine($"{EscapeCsv(record.Driver?.DriverCode)},{EscapeCsv(record.Driver?.FullName)},{EscapeCsv(record.TrainingType?.Name)},{record.DateCompleted:yyyy-MM-dd},{record.ValidUpto:yyyy-MM-dd},{EscapeCsv(record.TrainerName)},{status}");
        }

        var bytes = Encoding.UTF8.GetBytes(csv.ToString());
        return File(bytes, "text/csv", "TrainingExpiryReport.csv");
    }

    [HttpGet("incidentsummary")]
    public async Task<IActionResult> GetIncidentSummaryReport(
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] int? driverId)
    {
        var query = _context.Incidents
            .Include(i => i.Driver)
            .Include(i => i.IncidentType)
            .Include(i => i.SeverityLevel)
            .Include(i => i.CorrectiveActions)
                .ThenInclude(c => c.PenaltyType)
            .AsQueryable();

        if (dateFrom.HasValue)
            query = query.Where(i => i.IncidentDate >= dateFrom.Value);
        if (dateTo.HasValue)
            query = query.Where(i => i.IncidentDate <= dateTo.Value);
        if (driverId.HasValue)
            query = query.Where(i => i.DriverId == driverId.Value);

        var records = await query.ToListAsync();

        var csv = new StringBuilder();
        csv.AppendLine("Driver Code,Driver Name,Incident Date,Incident Type,Description,Severity Level,Location,Root Cause Completed,Corrective Actions");

        foreach (var record in records)
        {
            var correctiveActionsStr = string.Join(" | ", record.CorrectiveActions.Select(c => $"{c.ActionDate:yyyy-MM-dd}: {c.ActionTaken} ({c.PenaltyType?.Name})"));
            csv.AppendLine($"{EscapeCsv(record.Driver?.DriverCode)},{EscapeCsv(record.Driver?.FullName)},{record.IncidentDate:yyyy-MM-dd},{EscapeCsv(record.IncidentType?.Name)},{EscapeCsv(record.Description)},{EscapeCsv(record.SeverityLevel?.Name)},{EscapeCsv(record.Location)},{(record.RootCauseCompleted ? "Yes" : "No")},{EscapeCsv(correctiveActionsStr)}");
        }

        var bytes = Encoding.UTF8.GetBytes(csv.ToString());
        return File(bytes, "text/csv", "IncidentSummaryReport.csv");
    }

    private string EscapeCsv(string? value)
    {
        if (value == null) return "";
        if (value.Contains(",") || value.Contains("\"") || value.Contains("\r") || value.Contains("\n"))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }
        return value;
    }
}

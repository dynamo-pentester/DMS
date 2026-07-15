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
[Authorize(Roles = "System Administrator,HOD,Safety Officer,Transport Coordinator,Gate Security")]
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

    /// <summary>
    /// Driver Compliance Summary Report — aggregates latest license, medical, and
    /// training status per driver and computes an overall compliance flag.
    /// </summary>
    [HttpGet("drivercompliance")]
    public async Task<IActionResult> GetDriverComplianceReport(
        [FromQuery] int? driverId)
    {
        var driversQuery = _context.Drivers
            .Include(d => d.CurrentStatus)
            .Include(d => d.Licenses)
                .ThenInclude(l => l.VehicleType)
            .Include(d => d.MedicalRecords)
                .ThenInclude(m => m.FitnessStatus)
            .Include(d => d.Trainings)
                .ThenInclude(t => t.TrainingType)
            .Where(d => !d.IsDeleted)
            .AsQueryable();

        if (driverId.HasValue)
            driversQuery = driversQuery.Where(d => d.DriverId == driverId.Value);

        var drivers = await driversQuery.ToListAsync();

        var csv = new StringBuilder();
        csv.AppendLine("Driver Code,Driver Name,Driver Status,License No,License Valid Till,License Status,Medical Valid Till,Medical Status,Training Type,Training Valid Upto,Training Status,Overall Compliance");

        foreach (var driver in drivers)
        {
            var latestLicense  = driver.Licenses.OrderByDescending(l => l.ValidTill).FirstOrDefault();
            var latestMedical  = driver.MedicalRecords.OrderByDescending(m => m.ValidTill).FirstOrDefault();
            var latestTraining = driver.Trainings.OrderByDescending(t => t.ValidUpto).FirstOrDefault();

            var licenseStatus  = latestLicense  != null ? await _licenseResolver.GetStatusAsync(latestLicense)   : "No Record";
            var medicalStatus  = latestMedical  != null ? await _medicalResolver.GetStatusAsync(latestMedical)   : "No Record";
            var trainingStatus = latestTraining != null ? await _trainingResolver.GetStatusAsync(latestTraining) : "No Record";

            var overallCompliance =
                (licenseStatus == "Valid" && medicalStatus == "Valid" && trainingStatus == "Valid")
                    ? "Compliant"
                    : (licenseStatus == "No Record" || medicalStatus == "No Record" || trainingStatus == "No Record")
                        ? "Incomplete"
                        : "Non-Compliant";

            csv.AppendLine(
                $"{EscapeCsv(driver.DriverCode)}," +
                $"{EscapeCsv(driver.FullName)}," +
                $"{EscapeCsv(driver.CurrentStatus?.Name)}," +
                $"{EscapeCsv(latestLicense?.LicenseNo)}," +
                $"{(latestLicense != null ? latestLicense.ValidTill.ToString("yyyy-MM-dd") : "")}," +
                $"{licenseStatus}," +
                $"{(latestMedical != null ? latestMedical.ValidTill.ToString("yyyy-MM-dd") : "")}," +
                $"{medicalStatus}," +
                $"{EscapeCsv(latestTraining?.TrainingType?.Name)}," +
                $"{(latestTraining != null ? latestTraining.ValidUpto.ToString("yyyy-MM-dd") : "")}," +
                $"{trainingStatus}," +
                $"{overallCompliance}"
            );
        }

        var bytes = Encoding.UTF8.GetBytes(csv.ToString());
        return File(bytes, "text/csv", "DriverComplianceReport.csv");
    }

    /// <summary>
    /// Plant Movement Log Report — entry/exit records with optional date, driver,
    /// and gate (plant) filters.
    /// </summary>
    [HttpGet("plantmovement")]
    public async Task<IActionResult> GetPlantMovementReport(
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] int? driverId,
        [FromQuery] int? plantId)
    {
        var query = _context.PlantMovements
            .Include(p => p.Driver)
            .Include(p => p.PurposeType)
            .Include(p => p.GateNumber)
            .Where(p => !p.IsDeleted)
            .AsQueryable();

        if (dateFrom.HasValue)
            query = query.Where(p => p.DateOfEntry >= dateFrom.Value);
        if (dateTo.HasValue)
            query = query.Where(p => p.DateOfEntry <= dateTo.Value.AddDays(1).AddSeconds(-1));
        if (driverId.HasValue)
            query = query.Where(p => p.DriverId == driverId.Value);
        // plantId is surfaced on the frontend as a gate/plant filter
        if (plantId.HasValue)
            query = query.Where(p => p.GateNumberId == plantId.Value);

        var records = await query.OrderByDescending(p => p.DateOfEntry).ToListAsync();

        var csv = new StringBuilder();
        csv.AppendLine("Movement ID,Driver Code,Driver Name,Vehicle No,Date of Entry,Date of Exit,Duration (hrs),Purpose,Gate Number,Status");

        foreach (var record in records)
        {
            var duration = record.DateOfExit.HasValue
                ? Math.Round((record.DateOfExit.Value - record.DateOfEntry).TotalHours, 2).ToString()
                : "On Site";
            var status = record.DateOfExit.HasValue ? "Exited" : "On Site";

            csv.AppendLine(
                $"{record.MovementId}," +
                $"{EscapeCsv(record.Driver?.DriverCode)}," +
                $"{EscapeCsv(record.Driver?.FullName)}," +
                $"{EscapeCsv(record.VehicleNo)}," +
                $"{record.DateOfEntry:yyyy-MM-dd HH:mm}," +
                $"{(record.DateOfExit.HasValue ? record.DateOfExit.Value.ToString("yyyy-MM-dd HH:mm") : "")}," +
                $"{duration}," +
                $"{EscapeCsv(record.PurposeType?.Name)}," +
                $"{EscapeCsv(record.GateNumber?.Name)}," +
                $"{status}"
            );
        }

        var bytes = Encoding.UTF8.GetBytes(csv.ToString());
        return File(bytes, "text/csv", "PlantMovementLog.csv");
    }

    /// <summary>
    /// Transporter Performance Report — incident count, active driver count, and
    /// real-time compliance rate (all three of license/medical/training non-expired)
    /// per transporter.
    /// </summary>
    [HttpGet("transporterperformance")]
    public async Task<IActionResult> GetTransporterPerformanceReport(
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo)
    {
        var transporters = await _context.Transporters
            .Include(t => t.DriverAssignments)
                .ThenInclude(a => a.Driver)
                    .ThenInclude(d => d!.Incidents)
            .Include(t => t.DriverAssignments)
                .ThenInclude(a => a.Driver)
                    .ThenInclude(d => d!.Licenses)
            .Include(t => t.DriverAssignments)
                .ThenInclude(a => a.Driver)
                    .ThenInclude(d => d!.MedicalRecords)
            .Include(t => t.DriverAssignments)
                .ThenInclude(a => a.Driver)
                    .ThenInclude(d => d!.Trainings)
            .Where(t => !t.IsDeleted)
            .ToListAsync();

        var csv = new StringBuilder();
        csv.AppendLine("Transporter Name,Active Drivers,Total Incidents,Incidents in Period,Agreement Valid Till,Active Status,Compliance Rate (%)");

        foreach (var transporter in transporters)
        {
            var currentDrivers = transporter.DriverAssignments
                .Where(a => a.IsCurrent && a.Driver != null && !a.Driver.IsDeleted)
                .Select(a => a.Driver!)
                .ToList();

            var activeDriverCount = currentDrivers.Count;

            var totalIncidents = currentDrivers
                .SelectMany(d => d.Incidents)
                .Count(i => !i.IsDeleted);

            var periodIncidents = currentDrivers
                .SelectMany(d => d.Incidents)
                .Count(i => !i.IsDeleted
                    && (!dateFrom.HasValue || i.IncidentDate >= dateFrom.Value)
                    && (!dateTo.HasValue   || i.IncidentDate <= dateTo.Value));

            int compliantDrivers = 0;
            foreach (var driver in currentDrivers)
            {
                var latestLicense  = driver.Licenses.OrderByDescending(l => l.ValidTill).FirstOrDefault();
                var latestMedical  = driver.MedicalRecords.OrderByDescending(m => m.ValidTill).FirstOrDefault();
                var latestTraining = driver.Trainings.OrderByDescending(t => t.ValidUpto).FirstOrDefault();

                if (latestLicense  != null && !latestLicense.IsExpired  &&
                    latestMedical  != null && !latestMedical.IsExpired  &&
                    latestTraining != null && !latestTraining.IsExpired)
                {
                    compliantDrivers++;
                }
            }

            var complianceRate = activeDriverCount > 0
                ? Math.Round((double)compliantDrivers / activeDriverCount * 100, 1)
                : 0.0;

            csv.AppendLine(
                $"{EscapeCsv(transporter.Name)}," +
                $"{activeDriverCount}," +
                $"{totalIncidents}," +
                $"{periodIncidents}," +
                $"{(transporter.AgreementValidTill.HasValue ? transporter.AgreementValidTill.Value.ToString("yyyy-MM-dd") : "N/A")}," +
                $"{(transporter.IsActive ? "Active" : "Inactive")}," +
                $"{complianceRate}"
            );
        }

        var bytes = Encoding.UTF8.GetBytes(csv.ToString());
        return File(bytes, "text/csv", "TransporterPerformanceReport.csv");
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

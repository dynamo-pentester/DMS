using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;

namespace DriverDms.API.Controllers;

[ApiController]
[Route("api/incidents")]
[Authorize]
public class IncidentsController : ControllerBase
{
    private readonly IIncidentService _service;
    private readonly IFileStorageService _fileStorage;
    private readonly IConfiguration _configuration;

    private static readonly string[] DocumentExtensions = { ".pdf", ".jpg", ".jpeg", ".png", ".docx" };

    public IncidentsController(IIncidentService service, IFileStorageService fileStorage, IConfiguration configuration)
    {
        _service = service;
        _fileStorage = fileStorage;
        _configuration = configuration;
    }

    /// <summary>Get a single incident, including its corrective actions</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var incident = await _service.GetByIdAsync(id);
        return incident is null ? NotFound() : Ok(incident);
    }

    /// <summary>
    /// List incidents. Filter by driverId, severityLevelId, or rootCauseCompleted.
    /// e.g. GET /api/incidents?driverId=1&amp;rootCauseCompleted=false
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] IncidentSearchRequest request)
        => Ok(await _service.SearchAsync(request));

    /// <summary>
    /// Report a new incident/near-miss/violation for a driver. Accepts
    /// multipart/form-data so the incident report document can be attached in the
    /// same request - the report is optional, but when present it is validated and
    /// saved before the incident is created, so an invalid file never leaves behind
    /// an orphan incident.
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(15 * 1024 * 1024)]
    [Authorize(Roles = "System Administrator,HOD,Employee,Safety Officer")]
    public async Task<IActionResult> Create([FromForm] CreateIncidentRequest request, IFormFile? report)
    {
        var userId = GetUserId();
        try
        {
            string? newReportPath = report is not null ? await SaveReportFileAsync(report) : null;

            var incident = await _service.CreateAsync(request, userId);

            if (newReportPath is not null)
            {
                await _service.SetReportPathAsync(incident.IncidentId, newReportPath, userId);
                incident = await _service.GetByIdAsync(incident.IncidentId) ?? incident;
            }

            return CreatedAtAction(nameof(Get), new { id = incident.IncidentId }, incident);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Update incident details, including marking root cause analysis complete</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "System Administrator,HOD,Employee,Safety Officer")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateIncidentRequest request)
    {
        var userId = GetUserId();
        try
        {
            var incident = await _service.UpdateAsync(id, request, userId);
            return Ok(incident);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Soft-delete an incident</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "System Administrator,HOD")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetUserId();
        try
        {
            await _service.DeleteAsync(id, userId);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Attach a corrective action to an incident. An incident can accumulate more than
    /// one over time (e.g. an initial warning, then a later suspension) - this adds to
    /// the list rather than replacing it. When an apologyDocument file is supplied it is
    /// validated and saved BEFORE the corrective action row is created, so an invalid file
    /// never leaves behind an orphan corrective-action record (same discipline as Create).
    /// The file is stored under incident-reports/{id}/corrective-actions/ so every apology
    /// document tied to the same incident is co-located on disk.
    /// </summary>
    [HttpPost("{id:int}/corrective-actions")]
    [RequestSizeLimit(15 * 1024 * 1024)]
    [Authorize(Roles = "System Administrator,HOD,Employee,Safety Officer")]
    public async Task<IActionResult> AddCorrectiveAction(int id, [FromForm] AddCorrectiveActionRequest request, IFormFile? apologyDocument)
    {
        var userId = GetUserId();
        try
        {
            // Validate + save the file FIRST so a bad file never creates an orphan row.
            string? savedPath = apologyDocument is not null
                ? await SaveApologyDocumentFileAsync(apologyDocument, id)
                : null;

            var action = await _service.AddCorrectiveActionAsync(id, request, userId);

            if (savedPath is not null)
            {
                await _service.SetApologyDocumentPathAsync(action.CorrectiveActionId, savedPath, userId);
                // Reload so HasApologyDocument is true in the response.
                var updated = await _service.GetByIdAsync(id);
                action = updated?.CorrectiveActions
                    .FirstOrDefault(c => c.CorrectiveActionId == action.CorrectiveActionId)
                    ?? action;
            }

            return CreatedAtAction(nameof(Get), new { id }, action);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private int GetUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        return int.TryParse(claim, out var id) ? id : 0;
    }

    /// <summary>Upload (or replace) the report document for an existing incident</summary>
    [HttpPost("{id:int}/report")]
    [RequestSizeLimit(15 * 1024 * 1024)]
    [Authorize(Roles = "System Administrator,HOD,Employee,Safety Officer")]
    public async Task<IActionResult> UploadReport(int id, IFormFile file)
    {
        try
        {
            var oldPath = await _service.GetReportPathAsync(id);

            var newPath = await SaveReportFileAsync(file);

            await _service.SetReportPathAsync(id, newPath, GetUserId());
            _fileStorage.Delete(oldPath);

            return Ok(await _service.GetByIdAsync(id));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Validates and saves an incident report document to disk, returning the
    /// relative storage path. Shared by Create (inline first upload) and
    /// UploadReport (replace via View Details) so the validation/size-limit rules
    /// only live in one place.
    /// </summary>
    private async Task<string> SaveReportFileAsync(IFormFile file)
    {
        var maxBytes = _configuration.GetValue<long?>("FileStorage:MaxDocumentSizeMb") is { } mb and > 0
            ? mb * 1024 * 1024
            : 10 * 1024 * 1024;

        await using var stream = file.OpenReadStream();
        return await _fileStorage.SaveAsync(
            new FileUploadInput
            {
                Content = stream,
                OriginalFileName = file.FileName,
                ContentType = file.ContentType,
                Length = file.Length
            },
            "incident-reports",
            DocumentExtensions,
            maxBytes);
    }

    /// <summary>
    /// Validates and saves an apology document for a specific incident's corrective action.
    /// The subfolder is namespaced per incident so all apology documents for a given
    /// incident live in one place on disk: incident-reports/{incidentId}/corrective-actions/.
    /// Shared by AddCorrectiveAction (inline) and any future replace endpoint.
    /// </summary>
    private async Task<string> SaveApologyDocumentFileAsync(IFormFile file, int incidentId)
    {
        var maxBytes = _configuration.GetValue<long?>("FileStorage:MaxDocumentSizeMb") is { } mb and > 0
            ? mb * 1024 * 1024
            : 10 * 1024 * 1024;

        await using var stream = file.OpenReadStream();
        return await _fileStorage.SaveAsync(
            new FileUploadInput
            {
                Content = stream,
                OriginalFileName = file.FileName,
                ContentType = file.ContentType,
                Length = file.Length
            },
            $"incident-reports/{incidentId}/corrective-actions",
            DocumentExtensions,
            maxBytes);
    }

    /// <summary>
    /// Streams the incident report back for preview (default) or forced download
    /// (?download=true). Returns 404 if no report is on file.
    /// </summary>
    [HttpGet("{id:int}/report")]
    public async Task<IActionResult> GetReport(int id, [FromQuery] bool download = false)
    {
        string? path;
        try
        {
            path = await _service.GetReportPathAsync(id);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }

        var file = _fileStorage.OpenRead(path);
        if (file is null)
            return NotFound();

        return download
            ? File(file.Content, file.ContentType, file.DownloadFileName)
            : File(file.Content, file.ContentType);
    }

    /// <summary>
    /// Upload (or replace) the letter-of-apology / supporting photo attachment on a
    /// corrective action. Once at least one exists for a driver, an HOD/Admin can
    /// change that driver's status out of Blacklisted (see DriverService.UpdateStatusAsync).
    /// </summary>
    [HttpPost("{id:int}/corrective-actions/{correctiveActionId:int}/attachment")]
    [RequestSizeLimit(15 * 1024 * 1024)]
    [Authorize(Roles = "System Administrator,HOD,Employee,Safety Officer")]
    public async Task<IActionResult> UploadCorrectiveActionAttachment(int id, int correctiveActionId, IFormFile file)
    {
        try
        {
            var oldPath = await _service.GetCorrectiveActionAttachmentPathAsync(id, correctiveActionId);

            var maxBytes = _configuration.GetValue<long?>("FileStorage:MaxDocumentSizeMb") is { } mb and > 0
                ? mb * 1024 * 1024
                : 10 * 1024 * 1024;

            await using var stream = file.OpenReadStream();
            var newPath = await _fileStorage.SaveAsync(
                new FileUploadInput
                {
                    Content = stream,
                    OriginalFileName = file.FileName,
                    ContentType = file.ContentType,
                    Length = file.Length
                },
                "corrective-action-attachments",
                DocumentExtensions,
                maxBytes);

            await _service.SetCorrectiveActionAttachmentPathAsync(id, correctiveActionId, newPath, GetUserId());
            _fileStorage.Delete(oldPath);

            return Ok(await _service.GetByIdAsync(id));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Streams a corrective action's attachment back for preview (default) or
    /// forced download (?download=true). Returns 404 if none is on file.
    /// </summary>
    [HttpGet("{id:int}/corrective-actions/{correctiveActionId:int}/attachment")]
    public async Task<IActionResult> GetCorrectiveActionAttachment(int id, int correctiveActionId, [FromQuery] bool download = false)
    {
        string? path;
        try
        {
            path = await _service.GetCorrectiveActionAttachmentPathAsync(id, correctiveActionId);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }

        var file = _fileStorage.OpenRead(path);
        if (file is null)
            return NotFound();

        return download
            ? File(file.Content, file.ContentType, file.DownloadFileName)
            : File(file.Content, file.ContentType);
    }

    /// <summary>
    /// Streams a corrective action's apology document back for preview (default) or
    /// forced download (?download=true). Returns 404 if none is on file or if the
    /// corrective action does not belong to the given incident (IDOR guard - unlike
    /// the single-key GetReport endpoint, correctiveActionId is a second independently-
    /// guessable identifier so the parent-ownership check is mandatory here).
    /// </summary>
    [HttpGet("{id:int}/corrective-actions/{correctiveActionId:int}/apology-document")]
    public async Task<IActionResult> GetApologyDocument(int id, int correctiveActionId, [FromQuery] bool download = false)
    {
        // IDOR check: verify the corrective action belongs to this incident.
        var incident = await _service.GetByIdAsync(id);
        if (incident is null)
            return NotFound();

        var caOnThisIncident = incident.CorrectiveActions
            .FirstOrDefault(c => c.CorrectiveActionId == correctiveActionId);
        if (caOnThisIncident is null)
            return NotFound();

        string? path;
        try
        {
            path = await _service.GetApologyDocumentPathAsync(correctiveActionId);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }

        var file = _fileStorage.OpenRead(path);
        if (file is null)
            return NotFound();

        return download
            ? File(file.Content, file.ContentType, file.DownloadFileName)
            : File(file.Content, file.ContentType);
    }
}

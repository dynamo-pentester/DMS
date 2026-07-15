using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;

namespace DriverDms.API.Controllers;

[ApiController]
[Route("api/medical-records")]
[Authorize]
public class MedicalRecordsController : ControllerBase
{
    private readonly IMedicalRecordService _service;
    private readonly IFileStorageService _fileStorage;
    private readonly IConfiguration _configuration;

    private static readonly string[] DocumentExtensions = { ".pdf", ".jpg", ".jpeg", ".png", ".docx" };

    public MedicalRecordsController(IMedicalRecordService service, IFileStorageService fileStorage, IConfiguration configuration)
    {
        _service = service;
        _fileStorage = fileStorage;
        _configuration = configuration;
    }

    /// <summary>Get a single medical record by ID</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var record = await _service.GetByIdAsync(id);
        return record is null ? NotFound() : Ok(record);
    }

    /// <summary>
    /// List medical records. Filter by driverId or status (Valid | Expiring | Expired).
    /// e.g. GET /api/medical-records?driverId=1&status=Expiring
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] MedicalRecordSearchRequest request)
        => Ok(await _service.SearchAsync(request));

    /// <summary>
    /// Add a new medical/fitness record for a driver. Accepts multipart/form-data so
    /// the medical certificate can be attached in the same request - the certificate
    /// is optional, but when present it is validated and saved before the record is
    /// created, so an invalid file never leaves behind an orphan record.
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(15 * 1024 * 1024)]
    [Authorize(Roles = "System Administrator,HOD,Employee,Safety Officer")]
    public async Task<IActionResult> Create([FromForm] CreateMedicalRecordRequest request, IFormFile? certificate)
    {
        var userId = GetUserId();
        try
        {
            string? newCertificatePath = certificate is not null ? await SaveCertificateFileAsync(certificate) : null;

            var record = await _service.CreateAsync(request, userId);

            if (newCertificatePath is not null)
            {
                await _service.SetCertificatePathAsync(record.MedicalRecordId, newCertificatePath, userId);
                record = await _service.GetByIdAsync(record.MedicalRecordId) ?? record;
            }

            return CreatedAtAction(nameof(Get), new { id = record.MedicalRecordId }, record);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Update medical record details</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "System Administrator,HOD,Employee,Safety Officer")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMedicalRecordRequest request)
    {
        var userId = GetUserId();
        try
        {
            var record = await _service.UpdateAsync(id, request, userId);
            return Ok(record);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Soft-delete a medical record</summary>
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

    /// <summary>Upload (or replace) the medical certificate for an existing record</summary>
    [HttpPost("{id:int}/certificate")]
    [RequestSizeLimit(15 * 1024 * 1024)]
    [Authorize(Roles = "System Administrator,HOD,Employee,Safety Officer")]
    public async Task<IActionResult> UploadCertificate(int id, IFormFile file)
    {
        try
        {
            var oldPath = await _service.GetCertificatePathAsync(id);

            var newPath = await SaveCertificateFileAsync(file);

            await _service.SetCertificatePathAsync(id, newPath, GetUserId());
            _fileStorage.Delete(oldPath);

            return Ok(await _service.GetByIdAsync(id));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Validates and saves a medical certificate to disk, returning the relative
    /// storage path. Shared by Create (inline first upload) and UploadCertificate
    /// (replace via View Details) so the validation/size-limit rules only live
    /// in one place.
    /// </summary>
    private async Task<string> SaveCertificateFileAsync(IFormFile file)
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
            "medical-certificates",
            DocumentExtensions,
            maxBytes);
    }

    /// <summary>
    /// Streams the medical certificate back for preview (default) or forced download
    /// (?download=true). Returns 404 if no certificate is on file.
    /// </summary>
    [HttpGet("{id:int}/certificate")]
    public async Task<IActionResult> GetCertificate(int id, [FromQuery] bool download = false)
    {
        string? path;
        try
        {
            path = await _service.GetCertificatePathAsync(id);
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

    private int GetUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        return int.TryParse(claim, out var id) ? id : 0;
    }
}

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;

namespace DriverDms.API.Controllers;

[ApiController]
[Route("api/licenses")]
[Authorize]
public class LicensesController : ControllerBase
{
    private readonly ILicenseService _service;
    private readonly IFileStorageService _fileStorage;
    private readonly IConfiguration _configuration;

    private static readonly string[] DocumentExtensions = { ".pdf", ".jpg", ".jpeg", ".png", ".docx" };

    public LicensesController(ILicenseService service, IFileStorageService fileStorage, IConfiguration configuration)
    {
        _service = service;
        _fileStorage = fileStorage;
        _configuration = configuration;
    }

    /// <summary>Get a single license by ID</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var license = await _service.GetByIdAsync(id);
        return license is null ? NotFound() : Ok(license);
    }

    /// <summary>
    /// List licenses. Filter by driverId or status (Valid | Expiring | Expired).
    /// e.g. GET /api/licenses?driverId=1&status=Expiring
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] LicenseSearchRequest request)
        => Ok(await _service.SearchAsync(request));

    /// <summary>
    /// Add a new license to a driver. Accepts multipart/form-data so the scanned
    /// licence document can be attached in the same request - the document is
    /// optional, but when present it is validated and saved before the license
    /// record is created, so an invalid file never leaves behind an orphan license.
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(15 * 1024 * 1024)]
    [Authorize(Roles = "System Administrator,HOD,Employee,Safety Officer")]
    public async Task<IActionResult> Create([FromForm] CreateLicenseRequest request, IFormFile? document)
    {
        var userId = GetUserId();
        try
        {
            string? newDocumentPath = document is not null ? await SaveDocumentFileAsync(document) : null;

            var license = await _service.CreateAsync(request, userId);

            if (newDocumentPath is not null)
            {
                await _service.SetDocumentPathAsync(license.LicenseId, newDocumentPath, userId);
                license = await _service.GetByIdAsync(license.LicenseId) ?? license;
            }

            return CreatedAtAction(nameof(Get), new { id = license.LicenseId }, license);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Update license details and endorsements</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "System Administrator,HOD,Employee,Safety Officer")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateLicenseRequest request)
    {
        var userId = GetUserId();
        try
        {
            var license = await _service.UpdateAsync(id, request, userId);
            return Ok(license);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Soft-delete a license</summary>
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

    /// <summary>Upload (or replace) the scanned licence document for an existing license</summary>
    [HttpPost("{id:int}/document")]
    [RequestSizeLimit(15 * 1024 * 1024)]
    [Authorize(Roles = "System Administrator,HOD,Employee,Safety Officer")]
    public async Task<IActionResult> UploadDocument(int id, IFormFile file)
    {
        try
        {
            var oldPath = await _service.GetDocumentPathAsync(id);

            var newPath = await SaveDocumentFileAsync(file);

            await _service.SetDocumentPathAsync(id, newPath, GetUserId());
            _fileStorage.Delete(oldPath);

            return Ok(await _service.GetByIdAsync(id));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Validates and saves a licence document to disk, returning the relative
    /// storage path. Shared by Create (inline first upload) and UploadDocument
    /// (replace via View Details) so the validation/size-limit rules only live
    /// in one place.
    /// </summary>
    private async Task<string> SaveDocumentFileAsync(IFormFile file)
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
            "licenses",
            DocumentExtensions,
            maxBytes);
    }

    /// <summary>
    /// Streams the licence document back for preview (default) or forced download
    /// (?download=true). Returns 404 if no document is on file.
    /// </summary>
    [HttpGet("{id:int}/document")]
    public async Task<IActionResult> GetDocument(int id, [FromQuery] bool download = false)
    {
        string? path;
        try
        {
            path = await _service.GetDocumentPathAsync(id);
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

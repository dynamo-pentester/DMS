using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using DriverDms.Application.DTOs;
using DriverDms.Application.Interfaces;

namespace DriverDms.API.Controllers;

[ApiController]
[Route("api/drivers")]
[Authorize]
public class DriversController : ControllerBase
{
    private readonly IDriverService _service;
    private readonly IFileStorageService _fileStorage;
    private readonly IConfiguration _configuration;

    private static readonly string[] PhotoExtensions = { ".jpg", ".jpeg", ".png" };

    public DriversController(IDriverService service, IFileStorageService fileStorage, IConfiguration configuration)
    {
        _service = service;
        _fileStorage = fileStorage;
        _configuration = configuration;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var driver = await _service.GetByIdAsync(id);
        return driver is null ? NotFound() : Ok(driver);
    }

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] DriverSearchRequest request)
        => Ok(await _service.SearchAsync(request));

    /// <summary>
    /// Creates a new driver. Accepts multipart/form-data so the driver photo can be
    /// attached in the same request as the driver fields - the photo is optional,
    /// but when present it is validated and saved before the driver record is
    /// created, so an invalid file never leaves behind an orphan driver.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "System Administrator,HOD,Employee")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Create([FromForm] CreateDriverRequest request, IFormFile? photo)
    {
        var userId = GetCurrentUserId();
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? string.Empty;

        string? newPhotoPath = null;
        if (photo is not null)
        {
            try
            {
                newPhotoPath = await SavePhotoFileAsync(photo);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        var driver = await _service.CreateAsync(request, userId, role);

        if (newPhotoPath is not null)
        {
            await _service.SetPhotoPathAsync(driver.DriverId, newPhotoPath, userId);
            driver = await _service.GetByIdAsync(driver.DriverId) ?? driver;
        }

        return CreatedAtAction(nameof(Get), new { id = driver.DriverId }, driver);
    }

    [HttpPost("with-license")]
    [Authorize(Roles = "System Administrator,HOD,Employee")]
    [RequestSizeLimit(20 * 1024 * 1024)]
    public async Task<IActionResult> CreateWithLicense(
        [FromForm] CreateDriverWithLicenseRequest request,
        IFormFile? photo,
        IFormFile? licenseDocument)
    {
        var userId = GetCurrentUserId();
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? string.Empty;

        IFormFileProxy? photoProxy = photo is not null ? new FormFileProxy(photo) : null;
        IFormFileProxy? licenseDocProxy = licenseDocument is not null ? new FormFileProxy(licenseDocument) : null;

        try
        {
            var driver = await _service.CreateWithLicenseAsync(request, userId, role, photoProxy, licenseDocProxy);
            return CreatedAtAction(nameof(Get), new { id = driver.DriverId }, driver);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "System Administrator,HOD,Employee")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDriverRequest request)
        => Ok(await _service.UpdateAsync(id, request, GetCurrentUserId()));

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "System Administrator,HOD,Employee")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateDriverStatusRequest request)
    {
        try
        {
            await _service.UpdateStatusAsync(id, request.NewStatusId, request.Reason, GetCurrentUserId());
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "System Administrator,HOD")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id, GetCurrentUserId());
        return NoContent();
    }

    /// <summary>
    /// Upload (or replace) the driver's photo for an existing driver. The first
    /// photo upload normally happens inline via Create; this endpoint is used by
    /// View Details afterwards to replace it.
    /// </summary>
    [HttpPost("{id:int}/photo")]
    [Authorize(Roles = "System Administrator,HOD,Employee")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> UploadPhoto(int id, IFormFile file)
    {
        try
        {
            var oldPath = await _service.GetPhotoPathAsync(id);

            var newPath = await SavePhotoFileAsync(file);

            await _service.SetPhotoPathAsync(id, newPath, GetCurrentUserId());
            _fileStorage.Delete(oldPath);

            return Ok(await _service.GetByIdAsync(id));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Validates and saves a driver photo to disk, returning the relative storage
    /// path. Shared by Create (inline first upload) and UploadPhoto (replace via
    /// View Details) so the validation/size-limit rules only live in one place.
    /// </summary>
    private async Task<string> SavePhotoFileAsync(IFormFile file)
    {
        var maxBytes = _configuration.GetValue<long?>("FileStorage:MaxImageSizeMb") is { } mb and > 0
            ? mb * 1024 * 1024
            : 5 * 1024 * 1024;

        await using var stream = file.OpenReadStream();
        return await _fileStorage.SaveAsync(
            new FileUploadInput
            {
                Content = stream,
                OriginalFileName = file.FileName,
                ContentType = file.ContentType,
                Length = file.Length
            },
            "drivers/photos",
            PhotoExtensions,
            maxBytes);
    }

    /// <summary>
    /// Streams the driver's photo back for preview (default) or forced download
    /// (?download=true). Returns 404 if the driver has no photo on file.
    /// </summary>
    [HttpGet("{id:int}/photo")]
    public async Task<IActionResult> GetPhoto(int id, [FromQuery] bool download = false)
    {
        string? path;
        try
        {
            path = await _service.GetPhotoPathAsync(id);
        }
        catch (KeyNotFoundException ex)
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

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst("sub") ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        return claim is not null && int.TryParse(claim.Value, out var id) ? id : 0;
    }
}

public class UpdateDriverStatusRequest
{
    public int NewStatusId { get; set; }
    public string? Reason { get; set; }
}

public class FormFileProxy : IFormFileProxy
{
    private readonly IFormFile _file;
    public FormFileProxy(IFormFile file) => _file = file;
    public Stream OpenReadStream() => _file.OpenReadStream();
    public string FileName => _file.FileName;
    public string ContentType => _file.ContentType;
    public long Length => _file.Length;
}

namespace DriverDms.Application.Interfaces;

/// <summary>
/// Plain Stream/string based (no IFormFile) so Application keeps its existing
/// "no ASP.NET Core dependency" rule (see IApplicationDbContext's doc comment).
/// Driver.API extracts these fields from IFormFile before calling in.
/// </summary>
public class FileUploadInput
{
    public Stream Content { get; init; } = default!;
    public string OriginalFileName { get; init; } = default!;
    public string ContentType { get; init; } = default!;
    public long Length { get; init; }
}

public class StoredFileResult
{
    public Stream Content { get; init; } = default!;
    public string ContentType { get; init; } = default!;
    public string DownloadFileName { get; init; } = default!;
}

/// <summary>
/// Saves uploaded files to disk (never to SQL Server - only the relative path this
/// returns should ever be persisted in a *Path column) and streams them back out for
/// secure, authenticated download.
/// </summary>
public interface IFileStorageService
{
    /// <summary>
    /// Validates extension/size, generates a unique sanitized filename, saves the file
    /// under a fixed code-controlled subfolder, and returns the relative path to store
    /// in the database (e.g. "drivers/photos/&lt;guid&gt;.jpg").
    /// Throws InvalidOperationException with a user-facing message on validation failure.
    /// </summary>
    Task<string> SaveAsync(FileUploadInput file, string subFolder, IReadOnlyCollection<string> allowedExtensions, long maxSizeBytes);

    /// <summary>Opens a previously saved file for streaming back to the client. Returns null if missing/invalid.</summary>
    StoredFileResult? OpenRead(string? relativePath);

    /// <summary>Deletes a previously saved file. No-ops if the path is null/empty/missing (used by Replace).</summary>
    void Delete(string? relativePath);
}

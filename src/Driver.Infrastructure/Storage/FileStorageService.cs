using Microsoft.Extensions.Configuration;
using DriverDms.Application.Interfaces;

namespace DriverDms.Infrastructure.Storage;

/// <summary>
/// Disk-based implementation of IFileStorageService. Files never touch SQL Server -
/// see design note on IFileStorageService. Root folder is configurable via
/// FileStorage:RootPath (appsettings.json); defaults to "&lt;content root&gt;/uploads"
/// so a fresh clone works with zero configuration.
/// </summary>
public class FileStorageService : IFileStorageService
{
    private readonly string _rootPath;

    private static readonly Dictionary<string, string> MimeTypesByExtension = new(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".pdf"] = "application/pdf",
        [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };

    public FileStorageService(IConfiguration configuration)
    {
        var configuredRoot = configuration["FileStorage:RootPath"];
        _rootPath = string.IsNullOrWhiteSpace(configuredRoot)
            ? Path.Combine(Directory.GetCurrentDirectory(), "uploads")
            : configuredRoot;

        Directory.CreateDirectory(_rootPath);
    }

    public async Task<string> SaveAsync(FileUploadInput file, string subFolder, IReadOnlyCollection<string> allowedExtensions, long maxSizeBytes)
    {
        if (file is null || file.Content is null || file.Length <= 0)
            throw new InvalidOperationException("No file was provided.");

        if (file.Length > maxSizeBytes)
            throw new InvalidOperationException($"File exceeds the maximum allowed size of {maxSizeBytes / (1024 * 1024)} MB.");

        var extension = Path.GetExtension(file.OriginalFileName);
        if (string.IsNullOrWhiteSpace(extension) || !allowedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Unsupported file type '{extension}'. Allowed types: {string.Join(", ", allowedExtensions)}.");
        }

        if (MimeTypesByExtension.TryGetValue(extension, out var expectedMime)
            && !string.IsNullOrWhiteSpace(file.ContentType)
            && !file.ContentType.Equals(expectedMime, StringComparison.OrdinalIgnoreCase)
            && !file.ContentType.Equals("application/octet-stream", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("The file's content type does not match its extension.");
        }

        // subFolder is a fixed, code-controlled value (never raw user input), but it's
        // normalized defensively anyway.
        var safeSubFolder = subFolder.Replace("..", string.Empty).Trim('/', '\\');
        var targetDirectory = Path.Combine(_rootPath, safeSubFolder);
        Directory.CreateDirectory(targetDirectory);

        // Unique, generated filename - the client-supplied name is never used for the
        // path on disk. This is what actually prevents directory traversal / overwrite
        // attacks, not just the ".." strip above.
        var uniqueFileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var fullPath = Path.Combine(targetDirectory, uniqueFileName);

        var resolvedRoot = Path.GetFullPath(_rootPath) + Path.DirectorySeparatorChar;
        var resolvedFullPath = Path.GetFullPath(fullPath);
        if (!resolvedFullPath.StartsWith(resolvedRoot, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Invalid file path.");

        await using (var output = new FileStream(resolvedFullPath, FileMode.Create, FileAccess.Write))
        {
            if (file.Content.CanSeek)
                file.Content.Position = 0;
            await file.Content.CopyToAsync(output);
        }

        // This relative path (never the physical path) is what gets persisted in the DB.
        return Path.Combine(safeSubFolder, uniqueFileName).Replace('\\', '/');
    }

    public StoredFileResult? OpenRead(string? relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
            return null;

        var resolvedRoot = Path.GetFullPath(_rootPath) + Path.DirectorySeparatorChar;
        var fullPath = Path.GetFullPath(Path.Combine(_rootPath, relativePath));

        if (!fullPath.StartsWith(resolvedRoot, StringComparison.OrdinalIgnoreCase) || !File.Exists(fullPath))
            return null;

        var extension = Path.GetExtension(fullPath);
        var contentType = MimeTypesByExtension.TryGetValue(extension, out var mime) ? mime : "application/octet-stream";

        var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return new StoredFileResult
        {
            Content = stream,
            ContentType = contentType,
            DownloadFileName = Path.GetFileName(fullPath)
        };
    }

    public void Delete(string? relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
            return;

        var resolvedRoot = Path.GetFullPath(_rootPath) + Path.DirectorySeparatorChar;
        var fullPath = Path.GetFullPath(Path.Combine(_rootPath, relativePath));

        if (!fullPath.StartsWith(resolvedRoot, StringComparison.OrdinalIgnoreCase))
            return;

        if (File.Exists(fullPath))
            File.Delete(fullPath);
    }
}

namespace DriverDms.Shared;

public class ApiResponse<T>
{
    public bool Success { get; set; } = true;
    public T? Data { get; set; }
    public string? Message { get; set; }

    public static ApiResponse<T> Ok(T data, string? message = null) =>
        new() { Success = true, Data = data, Message = message };
}

public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
}

public class ValidationFailedException : Exception
{
    public IDictionary<string, string[]> Errors { get; }
    public ValidationFailedException(IDictionary<string, string[]> errors) : base("Validation failed.")
    {
        Errors = errors;
    }
}

namespace DriverDms.Application.DTOs;

public class TrainingDto
{
    public int TrainingId { get; set; }
    public int DriverId { get; set; }
    public string DriverName { get; set; } = default!;
    public string TrainingTypeName { get; set; } = default!;
    public DateTime DateCompleted { get; set; }
    public DateTime ValidUpto { get; set; }
    public string? TrainerName { get; set; }
    /// <summary>Valid | Expiring | Expired — computed by TrainingStatusResolver</summary>
    public string Status { get; set; } = default!;
}

public class CreateTrainingRequest
{
    public int DriverId { get; set; }
    public int TrainingTypeId { get; set; }
    public DateTime DateCompleted { get; set; }
    public DateTime ValidUpto { get; set; }
    public string? TrainerName { get; set; }
}

public class UpdateTrainingRequest
{
    public int TrainingTypeId { get; set; }
    public DateTime DateCompleted { get; set; }
    public DateTime ValidUpto { get; set; }
    public string? TrainerName { get; set; }
}

public class TrainingSearchRequest
{
    public int? DriverId { get; set; }
    /// <summary>Filter by status: Valid | Expiring | Expired</summary>
    public string? Status { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;
}

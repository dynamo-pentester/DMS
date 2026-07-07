namespace DriverDms.Application.DTOs;

public class PlantMovementDto
{
    public int MovementId { get; set; }
    public int DriverId { get; set; }
    public string DriverName { get; set; } = default!;
    public string VehicleNo { get; set; } = default!;
    public DateTime DateOfEntry { get; set; }
    public DateTime? DateOfExit { get; set; }
    public string PurposeTypeName { get; set; } = default!;
    public string GateNumberName { get; set; } = default!;
    public bool IsOnSite { get; set; }
}

public class CreatePlantMovementRequest
{
    public int DriverId { get; set; }
    public string VehicleNo { get; set; } = default!;
    public DateTime? DateOfEntry { get; set; }
    public int PurposeTypeId { get; set; }
    public int GateNumberId { get; set; }
}

public class RecordExitRequest
{
    public DateTime? DateOfExit { get; set; }
}

public class PlantMovementSearchRequest
{
    public int? DriverId { get; set; }
    public bool? OnSiteOnly { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;
}

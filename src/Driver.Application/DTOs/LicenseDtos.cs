namespace DriverDms.Application.DTOs;

public class LicenseDto
{
    public int LicenseId { get; set; }
    public int DriverId { get; set; }
    public string DriverName { get; set; } = default!;
    public string LicenseNo { get; set; } = default!;
    public DateTime IssueDate { get; set; }
    public DateTime ValidTill { get; set; }
    public string VehicleTypeName { get; set; } = default!;
    public List<string> Endorsements { get; set; } = new();
    /// <summary>Valid | Expiring | Expired — computed by LicenseStatusResolver</summary>
    public string Status { get; set; } = default!;

    // True when a scanned licence has been uploaded via POST /api/licenses/{id}/document.
    // The raw storage path is never exposed to the client - it's fetched via that same route.
    public bool HasDocument { get; set; }
}

public class CreateLicenseRequest
{
    public int DriverId { get; set; }
    public string LicenseNo { get; set; } = default!;
    public DateTime IssueDate { get; set; }
    public DateTime ValidTill { get; set; }
    public int VehicleTypeId { get; set; }
    /// <summary>Optional list of endorsement IDs to attach (e.g. Hazmat, Passenger)</summary>
    public List<int> EndorsementIds { get; set; } = new();
}

public class UpdateLicenseRequest
{
    public string LicenseNo { get; set; } = default!;
    public DateTime IssueDate { get; set; }
    public DateTime ValidTill { get; set; }
    public int VehicleTypeId { get; set; }
    public List<int> EndorsementIds { get; set; } = new();
}

public class LicenseSearchRequest
{
    public int? DriverId { get; set; }
    /// <summary>Filter by status: Valid | Expiring | Expired</summary>
    public string? Status { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;
}

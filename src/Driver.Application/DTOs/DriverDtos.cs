namespace DriverDms.Application.DTOs;

public class DriverDto
{
    public int DriverId { get; set; }
    public string DriverCode { get; set; } = default!;
    public string FullName { get; set; } = default!;
    public string? FatherName { get; set; }
    public DateTime DateOfBirth { get; set; }
    public string Mobile { get; set; } = default!;
    public string? Address { get; set; }
    public string? BloodGroupName { get; set; }
    public string? AadhaarLast4 { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? Remarks { get; set; }
    public string CurrentStatusName { get; set; } = default!;
    public string? CurrentTransporterName { get; set; }

    // Most recent (by ValidTill) license number, if any — surfaced wherever the
    // driver list/compliance view needs to show or filter by License ID.
    public string? LicenseNo { get; set; }

    // Approval workflow status: "Approved" | "PendingApproval" | "Rejected"
    public string ApprovalStatus { get; set; } = "Approved";
    public int? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }

    // True when a photo has been uploaded via POST /api/drivers/{id}/photo. The raw
    // storage path is never exposed to the client - it's fetched via that same route.
    public bool HasPhoto { get; set; }
}

public class CreateDriverRequest
{
    public string FullName { get; set; } = default!;
    public string? FatherName { get; set; }
    public DateTime DateOfBirth { get; set; }
    public string Mobile { get; set; } = default!;
    public string? Address { get; set; }
    public int? BloodGroupId { get; set; }
    public string? AadhaarNo { get; set; }  // raw input - encrypted before storage
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string? EmergencyContactPhone { get; set; }
}

public class UpdateDriverRequest
{
    public string FullName { get; set; } = default!;
    public string? FatherName { get; set; }
    public DateTime DateOfBirth { get; set; }
    public string Mobile { get; set; } = default!;
    public string? Address { get; set; }
    public int? BloodGroupId { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? Remarks { get; set; }
}

public class DriverSearchRequest
{
    public string? SearchTerm { get; set; }   // matches DriverCode, FullName, or Mobile
    public int? StatusId { get; set; }
    public string? ApprovalStatus { get; set; }

    // Filters to drivers who hold a license whose number contains this text.
    // Used by the License ID selector on the Drivers list filter.
    public string? LicenseNo { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;
}

/// <summary>
/// Used by POST /api/drivers/with-license — creates Driver + License in a single transaction.
/// Step 2 (license fields) is optional; if LicenseNo is absent, only the driver is created.
/// </summary>
public class CreateDriverWithLicenseRequest
{
    // --- Driver fields ---
    public string FullName { get; set; } = default!;
    public string? FatherName { get; set; }
    public DateTime DateOfBirth { get; set; }
    public string Mobile { get; set; } = default!;
    public string? Address { get; set; }
    public int? BloodGroupId { get; set; }
    public string? AadhaarNo { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string? EmergencyContactPhone { get; set; }

    // --- License fields (optional) ---
    public string? LicenseNo { get; set; }
    public DateTime? LicenseIssueDate { get; set; }
    public DateTime? LicenseValidTill { get; set; }
    public int? VehicleTypeId { get; set; }
    public List<int> EndorsementIds { get; set; } = new();
}

public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; set; } = Array.Empty<T>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

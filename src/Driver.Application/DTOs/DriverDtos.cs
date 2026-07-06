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
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;
}

public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; set; } = Array.Empty<T>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

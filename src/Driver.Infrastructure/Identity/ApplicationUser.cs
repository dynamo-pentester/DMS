using Microsoft.AspNetCore.Identity;

namespace DriverDms.Infrastructure.Identity;

/// <summary>
/// Uses IdentityUser&lt;int&gt; so Identity's user IDs match BaseEntity.CreatedBy/UpdatedBy/DeletedBy
/// (int?) elsewhere in the schema. The original sample code in the design doc used the
/// default string-keyed IdentityUser, which didn't actually agree with the rest of the
/// design - fixed here rather than carried forward.
/// </summary>
public class ApplicationUser : IdentityUser<int>
{
    public string FullName { get; set; } = default!;
    public DateTime? LastLoginAt { get; set; }
    public DateTime? PasswordChangedAt { get; set; }
    public bool IsActive { get; set; } = true;
}

using DriverDms.Domain.Common;

namespace DriverDms.Domain.Entities;

public class License : BaseEntity
{
    public int LicenseId { get; set; }
    public int DriverId { get; set; }
    public Driver? Driver { get; set; }
    public string LicenseNo { get; set; } = default!;
    public DateTime IssueDate { get; set; }
    public DateTime ValidTill { get; set; }
    public int VehicleTypeId { get; set; }
    public VehicleType? VehicleType { get; set; }

    // Relative path only (e.g. "licences/<guid>.pdf") - see Driver.DriverPhotoPath note.
    public string? LicenceFilePath { get; set; }

    public ICollection<LicenseEndorsement> LicenseEndorsements { get; set; } = new List<LicenseEndorsement>();

    // Deliberately narrow: this depends ONLY on data the entity owns.
    // "Expiring soon" depends on the configurable reminder window (SystemConfiguration),
    // so that logic lives in LicenseStatusResolver (Application layer), not here -
    // see design doc §6.3 changelog for why AddDays(30) was removed from this class.
    public bool IsExpired => ValidTill < DateTime.UtcNow;
}

public class LicenseEndorsement
{
    public int LicenseId { get; set; }
    public License? License { get; set; }
    public int EndorsementId { get; set; }
    public Endorsement? Endorsement { get; set; }
}

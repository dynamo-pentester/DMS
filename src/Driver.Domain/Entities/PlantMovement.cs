using DriverDms.Domain.Common;

namespace DriverDms.Domain.Entities;

public class PlantMovement : BaseEntity
{
    public int MovementId { get; set; }
    public int DriverId { get; set; }
    public Driver? Driver { get; set; }
    public string VehicleNo { get; set; } = default!;
    public DateTime DateOfEntry { get; set; }
    public DateTime? DateOfExit { get; set; }
    public int PurposeTypeId { get; set; }
    public PurposeType? PurposeType { get; set; }
    public int GateNumberId { get; set; }
    public GateNumber? GateNumber { get; set; }

    // FK to Users (ApplicationUser.Id) - who at the gate authorized this entry.
    // Not a navigation property since Driver.Domain has no dependency on Identity/
    // ApplicationUser (that lives in Infrastructure) - stored as a plain int, same
    // pattern already used for CreatedBy/UpdatedBy on BaseEntity.
    public int? EntryAuthorizedBy { get; set; }

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public bool IsOnSite => DateOfExit is null;
}

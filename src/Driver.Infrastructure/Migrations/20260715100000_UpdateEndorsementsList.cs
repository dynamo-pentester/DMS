using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DriverDms.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateEndorsementsList : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Deactivate the old placeholder list (kept, not deleted, so any existing
            // LicenseEndorsement rows referencing these IDs stay valid) and replace it
            // with the client-specified vehicle/attachment types.
            migrationBuilder.UpdateData(
                table: "Endorsements",
                keyColumn: "EndorsementId",
                keyValues: new object[] { 1, 2, 3, 4 },
                column: "IsActive",
                values: new object[] { false, false, false, false });

            migrationBuilder.InsertData(
                table: "Endorsements",
                columns: new[] { "EndorsementId", "IsActive", "Name" },
                values: new object[,]
                {
                    { 5, true, "Dumper" },
                    { 6, true, "Bulker" },
                    { 7, true, "Cement Truck" },
                    { 8, true, "Taurus" },
                    { 9, true, "Trailer" },
                    { 10, true, "Diesel Bowser" },
                    { 11, true, "EME" },
                    { 12, true, "LV" },
                    { 13, true, "Other" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Endorsements",
                keyColumn: "EndorsementId",
                keyValues: new object[] { 5, 6, 7, 8, 9, 10, 11, 12, 13 });

            migrationBuilder.UpdateData(
                table: "Endorsements",
                keyColumn: "EndorsementId",
                keyValues: new object[] { 1, 2, 3, 4 },
                column: "IsActive",
                values: new object[] { true, true, true, true });
        }
    }
}

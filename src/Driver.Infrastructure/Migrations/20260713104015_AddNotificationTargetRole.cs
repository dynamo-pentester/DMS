using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DriverDms.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationTargetRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TargetRole",
                table: "Notifications",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TargetRole",
                table: "Notifications");
        }
    }
}

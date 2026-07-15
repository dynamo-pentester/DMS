using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DriverDms.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCorrectiveActionApologyDocument : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ApologyDocumentPath",
                table: "CorrectiveActions",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApologyDocumentPath",
                table: "CorrectiveActions");
        }
    }
}

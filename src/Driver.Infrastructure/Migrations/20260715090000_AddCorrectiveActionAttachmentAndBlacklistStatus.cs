using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DriverDms.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCorrectiveActionAttachmentAndBlacklistStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AttachmentPath",
                table: "CorrectiveActions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.InsertData(
                table: "DriverStatusTypes",
                columns: new[] { "DriverStatusTypeId", "Name" },
                values: new object[] { 5, "Blacklisted" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "DriverStatusTypes",
                keyColumn: "DriverStatusTypeId",
                keyValue: 5);

            migrationBuilder.DropColumn(
                name: "AttachmentPath",
                table: "CorrectiveActions");
        }
    }
}

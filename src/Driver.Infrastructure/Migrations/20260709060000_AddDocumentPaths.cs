using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DriverDms.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentPaths : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DriverPhotoPath",
                table: "Drivers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LicenceFilePath",
                table: "Licenses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MedicalCertificatePath",
                table: "MedicalRecords",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IncidentReportPath",
                table: "Incidents",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DriverPhotoPath",
                table: "Drivers");

            migrationBuilder.DropColumn(
                name: "LicenceFilePath",
                table: "Licenses");

            migrationBuilder.DropColumn(
                name: "MedicalCertificatePath",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "IncidentReportPath",
                table: "Incidents");
        }
    }
}

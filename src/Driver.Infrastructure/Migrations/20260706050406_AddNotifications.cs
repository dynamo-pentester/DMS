using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DriverDms.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "NotificationEntityTypes",
                columns: table => new
                {
                    NotificationEntityTypeId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationEntityTypes", x => x.NotificationEntityTypeId);
                });

            migrationBuilder.CreateTable(
                name: "NotificationStatuses",
                columns: table => new
                {
                    NotificationStatusId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationStatuses", x => x.NotificationStatusId);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    NotificationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NotificationEntityTypeId = table.Column<int>(type: "int", nullable: false),
                    EntityId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NotificationStatusId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DismissedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.NotificationId);
                    table.ForeignKey(
                        name: "FK_Notifications_NotificationEntityTypes_NotificationEntityTypeId",
                        column: x => x.NotificationEntityTypeId,
                        principalTable: "NotificationEntityTypes",
                        principalColumn: "NotificationEntityTypeId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Notifications_NotificationStatuses_NotificationStatusId",
                        column: x => x.NotificationStatusId,
                        principalTable: "NotificationStatuses",
                        principalColumn: "NotificationStatusId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "NotificationEntityTypes",
                columns: new[] { "NotificationEntityTypeId", "Name" },
                values: new object[,]
                {
                    { 1, "License" },
                    { 2, "Medical" },
                    { 3, "Training" },
                    { 4, "Incident" },
                    { 5, "Document" },
                    { 6, "System" }
                });

            migrationBuilder.InsertData(
                table: "NotificationStatuses",
                columns: new[] { "NotificationStatusId", "Name" },
                values: new object[,]
                {
                    { 1, "Pending" },
                    { 2, "Sent" },
                    { 3, "Dismissed" },
                    { 4, "Expired" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_NotificationEntityTypeId",
                table: "Notifications",
                column: "NotificationEntityTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_NotificationStatusId",
                table: "Notifications",
                column: "NotificationStatusId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "NotificationEntityTypes");

            migrationBuilder.DropTable(
                name: "NotificationStatuses");
        }
    }
}

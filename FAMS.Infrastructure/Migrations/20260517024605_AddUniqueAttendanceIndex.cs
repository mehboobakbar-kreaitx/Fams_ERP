using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FAMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueAttendanceIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_attendances_StaffId_Date",
                table: "attendances");

            migrationBuilder.DropIndex(
                name: "IX_attendances_StudentId_Date",
                table: "attendances");

            migrationBuilder.CreateIndex(
                name: "IX_attendances_StaffId_Date",
                table: "attendances",
                columns: new[] { "StaffId", "Date" },
                unique: true,
                filter: "\"StaffId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_attendances_StudentId_Date",
                table: "attendances",
                columns: new[] { "StudentId", "Date" },
                unique: true,
                filter: "\"StudentId\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_attendances_StaffId_Date",
                table: "attendances");

            migrationBuilder.DropIndex(
                name: "IX_attendances_StudentId_Date",
                table: "attendances");

            migrationBuilder.CreateIndex(
                name: "IX_attendances_StaffId_Date",
                table: "attendances",
                columns: new[] { "StaffId", "Date" });

            migrationBuilder.CreateIndex(
                name: "IX_attendances_StudentId_Date",
                table: "attendances",
                columns: new[] { "StudentId", "Date" });
        }
    }
}

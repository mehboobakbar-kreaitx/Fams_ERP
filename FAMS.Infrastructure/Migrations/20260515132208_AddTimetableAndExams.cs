using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FAMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTimetableAndExams : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "exams",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    ExamType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TermName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false),
                    PublishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CampusId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_exams", x => x.Id);
                    table.ForeignKey(
                        name: "FK_exams_classrooms_ClassId",
                        column: x => x.ClassId,
                        principalTable: "classrooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "timetable_slots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    SubjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    TeacherId = table.Column<Guid>(type: "uuid", nullable: false),
                    DayOfWeek = table.Column<int>(type: "integer", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    Room = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    TermName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CampusId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_timetable_slots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_timetable_slots_sections_SectionId",
                        column: x => x.SectionId,
                        principalTable: "sections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_timetable_slots_staff_TeacherId",
                        column: x => x.TeacherId,
                        principalTable: "staff",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_timetable_slots_subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "subjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "exam_schedule_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ExamId = table.Column<Guid>(type: "uuid", nullable: false),
                    SubjectId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExamDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    TotalMarks = table.Column<decimal>(type: "numeric(8,2)", precision: 8, scale: 2, nullable: false),
                    Hall = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CampusId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_exam_schedule_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_exam_schedule_items_exams_ExamId",
                        column: x => x.ExamId,
                        principalTable: "exams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_exam_schedule_items_subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "subjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_exam_schedule_items_ExamId_SubjectId",
                table: "exam_schedule_items",
                columns: new[] { "ExamId", "SubjectId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_exam_schedule_items_SubjectId",
                table: "exam_schedule_items",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_exams_ClassId_TermName_ExamType",
                table: "exams",
                columns: new[] { "ClassId", "TermName", "ExamType" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_timetable_slots_SectionId_TermName_DayOfWeek",
                table: "timetable_slots",
                columns: new[] { "SectionId", "TermName", "DayOfWeek" });

            migrationBuilder.CreateIndex(
                name: "IX_timetable_slots_SubjectId",
                table: "timetable_slots",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_timetable_slots_TeacherId_TermName_DayOfWeek",
                table: "timetable_slots",
                columns: new[] { "TeacherId", "TermName", "DayOfWeek" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "exam_schedule_items");

            migrationBuilder.DropTable(
                name: "timetable_slots");

            migrationBuilder.DropTable(
                name: "exams");
        }
    }
}

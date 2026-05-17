using ClosedXML.Excel;
using FAMS.Application.Common.Interfaces;
using FAMS.Application.Modules.Platform.Dashboard.Queries.GetExecutiveDashboard;
using FAMS.Application.Modules.Platform.Dashboard.Queries.GetParentDashboard;
using FAMS.Application.Modules.Platform.Dashboard.Queries.GetPrincipalDashboard;
using FAMS.Application.Modules.Platform.Dashboard.Queries.GetStudentDashboard;
using FAMS.Application.Modules.Platform.Dashboard.Queries.GetTeacherDashboard;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace FAMS.API.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;
    private readonly IFamsDbContext _db;

    public DashboardController(IMediator mediator, ICurrentUserService currentUser, IFamsDbContext db)
    {
        _mediator = mediator;
        _currentUser = currentUser;
        _db = db;
    }

    [HttpGet("executive")]
    [Authorize(Roles = "SystemAdmin,Executive")]
    public async Task<IActionResult> Executive()
    {
        var result = await _mediator.Send(new GetExecutiveDashboardQuery());
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result);
    }

    [HttpGet("principal")]
    [Authorize(Roles = "SystemAdmin,Principal")]
    public async Task<IActionResult> Principal()
    {
        if (_currentUser.CampusId is null) return Forbid();
        var result = await _mediator.Send(new GetPrincipalDashboardQuery(_currentUser.CampusId.Value));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result);
    }

    [HttpGet("teacher")]
    [Authorize(Roles = "SystemAdmin,Principal,Teacher")]
    public async Task<IActionResult> Teacher()
    {
        var email = _currentUser.UserName;
        if (string.IsNullOrWhiteSpace(email)) return Forbid();

        var staffId = await _db.StaffMembers.AsNoTracking()
            .Where(s => s.Email == email)
            .Select(s => (Guid?)s.Id)
            .FirstOrDefaultAsync();
        if (staffId is null)
            return NotFound(new { error = "No staff record linked to this user." });

        var result = await _mediator.Send(new GetTeacherDashboardQuery(staffId.Value));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result);
    }

    [HttpGet("student")]
    [Authorize(Roles = "SystemAdmin,Student")]
    public async Task<IActionResult> Student()
    {
        var email = _currentUser.UserName;
        if (string.IsNullOrWhiteSpace(email)) return Forbid();

        var studentId = await _db.Students.AsNoTracking()
            .Where(s => s.Email == email)
            .Select(s => (Guid?)s.Id)
            .FirstOrDefaultAsync();
        if (studentId is null)
            return NotFound(new { error = "No student record linked to this user." });

        var result = await _mediator.Send(new GetStudentDashboardQuery(studentId.Value));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result);
    }

    // ── Exports ──────────────────────────────────────────────────────────────

    [HttpGet("principal/export.xlsx")]
    [Authorize(Roles = "SystemAdmin,Principal")]
    public async Task<IActionResult> PrincipalExportExcel(CancellationToken ct)
    {
        if (_currentUser.CampusId is null) return Forbid();
        var r = await _mediator.Send(new GetPrincipalDashboardQuery(_currentUser.CampusId.Value), ct);
        if (!r.IsSuccess) return BadRequest(r);
        var d = r.Value!;

        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Campus Dashboard");

        ws.Cell(1, 1).Value = "Campus Dashboard Summary";
        ws.Cell(1, 1).Style.Font.Bold = true;
        ws.Cell(1, 1).Style.Font.FontSize = 14;
        ws.Cell(2, 1).Value = $"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC";

        int row = 4;
        void AddKpi(string label, object value)
        {
            ws.Cell(row, 1).Value = label;
            ws.Cell(row, 2).Value = value?.ToString() ?? "";
            ws.Cell(row, 1).Style.Font.Bold = true;
            row++;
        }

        AddKpi("Total Students", d.TotalStudents);
        AddKpi("Total Staff", d.TotalStaff);
        AddKpi("Active Classes", d.ActiveClasses);
        AddKpi("Today Attendance %", d.TodayAttendancePercent);
        AddKpi("Outstanding Fees (Rs.)", d.OutstandingFees);
        AddKpi("Pending Leaves", d.PendingLeaves);
        AddKpi("Open Applications", d.OpenApplications);
        AddKpi("Published Exams This Term", d.PublishedExamsThisTerm);

        row += 2;
        ws.Cell(row, 1).Value = "Recent Admissions";
        ws.Cell(row, 1).Style.Font.Bold = true;
        row++;
        ws.Cell(row, 1).Value = "Name"; ws.Cell(row, 2).Value = "Roll No"; ws.Cell(row, 3).Value = "Date";
        ws.Row(row).Style.Font.Bold = true;
        row++;
        foreach (var a in d.RecentAdmissions)
        {
            ws.Cell(row, 1).Value = a.Name;
            ws.Cell(row, 2).Value = a.RollNumber;
            ws.Cell(row, 3).Value = a.EnrollmentDate.ToString("yyyy-MM-dd");
            row++;
        }

        ws.Columns().AdjustToContents();
        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return File(ms.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"dashboard-{DateTime.UtcNow:yyyyMMdd}.xlsx");
    }

    [HttpGet("principal/export.pdf")]
    [Authorize(Roles = "SystemAdmin,Principal")]
    public async Task<IActionResult> PrincipalExportPdf(CancellationToken ct)
    {
        if (_currentUser.CampusId is null) return Forbid();
        var r = await _mediator.Send(new GetPrincipalDashboardQuery(_currentUser.CampusId.Value), ct);
        if (!r.IsSuccess) return BadRequest(r);
        var d = r.Value!;

        QuestPDF.Settings.License = LicenseType.Community;

        var pdf = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, QuestPDF.Infrastructure.Unit.Centimetre);
                page.DefaultTextStyle(t => t.FontSize(10));

                page.Header().Text($"Campus Dashboard — {DateTime.UtcNow:yyyy-MM-dd}")
                    .Bold().FontSize(14).FontColor(Colors.Blue.Darken3);

                page.Content().Column(col =>
                {
                    col.Spacing(6);

                    void Row(string label, string value)
                    {
                        col.Item().Row(r =>
                        {
                            r.ConstantItem(200).Text(label).Bold();
                            r.RelativeItem().Text(value);
                        });
                    }

                    Row("Total Students", d.TotalStudents.ToString());
                    Row("Total Staff", d.TotalStaff.ToString());
                    Row("Active Classes", d.ActiveClasses.ToString());
                    Row("Today Attendance", $"{d.TodayAttendancePercent:F1}%");
                    Row("Outstanding Fees", $"Rs. {d.OutstandingFees:N2}");
                    Row("Pending Leaves", d.PendingLeaves.ToString());
                    Row("Open Applications", d.OpenApplications.ToString());
                    Row("Published Exams", d.PublishedExamsThisTerm.ToString());

                    col.Item().PaddingTop(12).Text("Recent Admissions").Bold().FontSize(11);
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(c =>
                        {
                            c.RelativeColumn(3);
                            c.RelativeColumn(2);
                            c.RelativeColumn(2);
                        });
                        table.Header(h =>
                        {
                            h.Cell().Text("Name").Bold();
                            h.Cell().Text("Roll No").Bold();
                            h.Cell().Text("Enrolled").Bold();
                        });
                        foreach (var a in d.RecentAdmissions)
                        {
                            table.Cell().Text(a.Name);
                            table.Cell().Text(a.RollNumber);
                            table.Cell().Text(a.EnrollmentDate.ToString("yyyy-MM-dd"));
                        }
                    });
                });

                page.Footer().AlignRight().Text(t =>
                {
                    t.Span("Page ");
                    t.CurrentPageNumber();
                    t.Span(" of ");
                    t.TotalPages();
                });
            });
        });

        var bytes = pdf.GeneratePdf();
        return File(bytes, "application/pdf", $"dashboard-{DateTime.UtcNow:yyyyMMdd}.pdf");
    }

    [HttpGet("parent")]
    [Authorize(Roles = "SystemAdmin,Parent")]
    public async Task<IActionResult> Parent()
    {
        var email = _currentUser.UserName;
        if (string.IsNullOrWhiteSpace(email)) return Forbid();

        var parentId = await _db.Parents.AsNoTracking()
            .Where(p => p.Email == email)
            .Select(p => (Guid?)p.Id)
            .FirstOrDefaultAsync();
        if (parentId is null)
            return NotFound(new { error = "No parent record linked to this user." });

        var result = await _mediator.Send(new GetParentDashboardQuery(parentId.Value));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result);
    }
}


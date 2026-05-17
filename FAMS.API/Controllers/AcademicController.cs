using FAMS.Application.Common.Interfaces;
using FAMS.Application.Modules.Academic.Attendance.Commands.MarkAttendance;
using FAMS.Application.Modules.Academic.Attendance.Queries.GetAttendanceReport;
using FAMS.Application.Modules.Academic.Attendance.Queries.GetSectionAttendance;
using FAMS.Application.Modules.Academic.Attendance.Queries.GetStudentAttendance;
using FAMS.Application.Modules.Academic.Examinations.Commands.CreateExamSchedule;
using FAMS.Application.Modules.Academic.Examinations.Commands.GenerateAdmitCards;
using FAMS.Application.Modules.Academic.Examinations.Queries.GetExamSchedule;
using FAMS.Application.Modules.Academic.Timetable.Commands.CreateTimetable;
using FAMS.Application.Modules.Academic.Timetable.Queries.GetTimetable;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FAMS.API.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/[controller]")]
public class AcademicController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public AcademicController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    // ---------- Attendance ----------

    [HttpPost("attendance")]
    [Authorize(Roles = "SystemAdmin,Principal,Teacher,AcademicCoordinator")]
    public async Task<IActionResult> MarkAttendance([FromBody] MarkAttendanceBody body)
    {
        if (_currentUser.UserId is null || !Guid.TryParse(_currentUser.UserId, out var markedById))
            return Unauthorized();

        var result = await _mediator.Send(new MarkAttendanceCommand(
            body.SectionId, body.Date, markedById, body.Entries, body.IsOfflineEntry));
        return result.IsSuccess ? Ok(new { recorded = result.Value }) : BadRequest(result);
    }

    [HttpGet("attendance")]
    [Authorize(Roles = "SystemAdmin,Principal,Teacher,AcademicCoordinator")]
    public async Task<IActionResult> GetSectionAttendance(
        [FromQuery] Guid sectionId, [FromQuery] DateTime date)
    {
        var result = await _mediator.Send(new GetSectionAttendanceQuery(sectionId, date));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result);
    }

    [HttpGet("attendance/report")]
    [Authorize(Roles = "SystemAdmin,Principal,Teacher,AcademicCoordinator")]
    public async Task<IActionResult> AttendanceReport(
        [FromQuery] Guid sectionId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate,
        [FromQuery] Guid? studentId = null)
    {
        var result = await _mediator.Send(new GetAttendanceReportQuery(sectionId, startDate, endDate, studentId));
        return Ok(result.Value);
    }

    [HttpGet("attendance/student/{studentId:guid}")]
    public async Task<IActionResult> GetStudentAttendance(
        Guid studentId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 30)
    {
        // Students may only fetch their own records; staff roles may fetch any.
        if (_currentUser.Roles.Contains("Student") &&
            _currentUser.UserId != studentId.ToString())
            return Forbid();

        var result = await _mediator.Send(new GetStudentAttendanceQuery(studentId, pageNumber, pageSize));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result);
    }

    [HttpGet("attendance/student/{studentId:guid}/summary")]
    public async Task<IActionResult> GetStudentAttendanceSummary(
        Guid studentId,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        if (_currentUser.Roles.Contains("Student") &&
            _currentUser.UserId != studentId.ToString())
            return Forbid();

        var result = await _mediator.Send(new GetStudentAttendanceSummaryQuery(studentId, startDate, endDate));
        return result.IsSuccess ? Ok(result.Value) : NotFound(result);
    }

    // ---------- Timetable ----------

    [HttpPost("timetable")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator")]
    public async Task<IActionResult> CreateTimetable([FromBody] CreateTimetableCommand command)
    {
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(new { slotsCreated = result.Value }) : BadRequest(result);
    }

    [HttpGet("timetable")]
    public async Task<IActionResult> GetTimetable(
        [FromQuery] string? termName = null,
        [FromQuery] Guid? sectionId = null,
        [FromQuery] Guid? teacherId = null,
        [FromQuery] Guid? studentId = null)
    {
        var result = await _mediator.Send(new GetTimetableQuery(termName, sectionId, teacherId, studentId));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result);
    }

    // ---------- Examinations ----------

    [HttpPost("exams")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator")]
    public async Task<IActionResult> CreateExamSchedule([FromBody] CreateExamScheduleCommand command)
    {
        var result = await _mediator.Send(command);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetExamSchedule), new { examId = result.Value }, new { examId = result.Value })
            : BadRequest(result);
    }

    [HttpGet("exams/{examId:guid}")]
    public async Task<IActionResult> GetExamSchedule(Guid examId)
    {
        var result = await _mediator.Send(new GetExamScheduleQuery(examId));
        return result.IsSuccess ? Ok(result.Value) : NotFound(result);
    }

    [HttpPost("exams/{examId:guid}/admit-cards")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator")]
    public async Task<IActionResult> GenerateAdmitCards(Guid examId, [FromQuery] Guid? sectionId = null)
    {
        var result = await _mediator.Send(new GenerateAdmitCardsCommand(examId, sectionId));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result);
    }
}

public record MarkAttendanceBody(Guid SectionId, DateTime Date, List<AttendanceEntry> Entries, bool IsOfflineEntry = false);


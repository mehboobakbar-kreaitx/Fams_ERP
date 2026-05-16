using FAMS.Application.Common.Interfaces;
using FAMS.Application.Modules.Academic.Attendance.Commands.MarkAttendance;
using FAMS.Application.Modules.Academic.Attendance.Queries.GetAttendanceReport;
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

    [HttpGet("attendance/report")]
    public async Task<IActionResult> AttendanceReport(
        [FromQuery] Guid sectionId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate,
        [FromQuery] Guid? studentId = null)
    {
        var result = await _mediator.Send(new GetAttendanceReportQuery(sectionId, startDate, endDate, studentId));
        return Ok(result.Value);
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
        [FromQuery] string termName,
        [FromQuery] Guid? sectionId = null,
        [FromQuery] Guid? teacherId = null)
    {
        var result = await _mediator.Send(new GetTimetableQuery(termName, sectionId, teacherId));
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


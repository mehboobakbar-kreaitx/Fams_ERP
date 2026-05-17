using FAMS.Application.Common.Interfaces;
using FAMS.Application.Modules.Results.Commands.EnterMarks;
using FAMS.Application.Modules.Results.Commands.PublishResults;
using FAMS.Application.Modules.Results.Commands.UnpublishResults;
using FAMS.Application.Modules.Results.Queries.GetResultsAnalytics;
using FAMS.Application.Modules.Results.Queries.GetStudentResults;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FAMS.API.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/results")]
public class ResultsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public ResultsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpPost("marks")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator,Teacher")]
    public async Task<IActionResult> EnterMarks([FromBody] EnterMarksCommand command)
    {
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(new { saved = result.Value }) : BadRequest(result);
    }

    [HttpPost("publish")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator")]
    public async Task<IActionResult> Publish([FromBody] PublishResultsBody body)
    {
        var campusId = _currentUser.CampusId;
        var result = await _mediator.Send(new PublishResultsCommand(body.SubjectId, body.ExamType, body.TermName, campusId));
        return result.IsSuccess ? Ok(new { published = result.Value }) : BadRequest(result);
    }

    [HttpPost("unpublish")]
    [Authorize(Roles = "SystemAdmin,Principal")]
    public async Task<IActionResult> Unpublish([FromBody] UnpublishResultsCommand command)
    {
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(new { unpublished = result.Value }) : BadRequest(result);
    }

    [HttpGet("student/{studentId:guid}")]
    public async Task<IActionResult> GetForStudent(
        Guid studentId,
        [FromQuery] string? termName = null,
        [FromQuery] string? examType = null,
        [FromQuery] bool publishedOnly = true)
    {
        // Students may only fetch their own results; staff roles may fetch any student's.
        if (_currentUser.Roles.Contains("Student") &&
            _currentUser.UserId != studentId.ToString())
            return Forbid();

        var result = await _mediator.Send(new GetStudentResultsQuery(studentId, termName, examType, publishedOnly));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result);
    }

    [HttpGet("analytics")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator,Teacher,Executive")]
    public async Task<IActionResult> GetAnalytics(
        [FromQuery] Guid subjectId,
        [FromQuery] string examType,
        [FromQuery] string termName,
        [FromQuery] decimal passThreshold = 40m)
    {
        var result = await _mediator.Send(new GetResultsAnalyticsQuery(subjectId, examType, termName, passThreshold));
        return result.IsSuccess ? Ok(result.Value) : NotFound(result);
    }

    [HttpGet("student/{studentId:guid}/grade-card.pdf")]
    public async Task<IActionResult> GradeCardPdf(Guid studentId, [FromQuery] string termName,
        [FromServices] IPdfService pdf, CancellationToken ct)
    {
        if (_currentUser.Roles.Contains("Student") &&
            _currentUser.UserId != studentId.ToString())
            return Forbid();

        var bytes = await pdf.GenerateGradeCardAsync(studentId, termName, ct);
        return File(bytes, "application/pdf", $"grade-card-{studentId}-{termName}.pdf");
    }
}

public record PublishResultsBody(Guid SubjectId, string ExamType, string TermName);


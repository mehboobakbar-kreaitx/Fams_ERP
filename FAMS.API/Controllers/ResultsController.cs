using FAMS.Application.Common.Interfaces;
using FAMS.Application.Modules.Results.Commands.EnterMarks;
using FAMS.Application.Modules.Results.Commands.PublishResults;
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

    public ResultsController(IMediator mediator) => _mediator = mediator;

    [HttpPost("marks")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator,Teacher")]
    public async Task<IActionResult> EnterMarks([FromBody] EnterMarksCommand command)
    {
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(new { saved = result.Value }) : BadRequest(result);
    }

    [HttpPost("publish")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator")]
    public async Task<IActionResult> Publish([FromBody] PublishResultsCommand command)
    {
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(new { published = result.Value }) : BadRequest(result);
    }

    [HttpGet("student/{studentId:guid}")]
    public async Task<IActionResult> GetForStudent(
        Guid studentId,
        [FromQuery] string? termName = null,
        [FromQuery] string? examType = null,
        [FromQuery] bool publishedOnly = true)
    {
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
        var bytes = await pdf.GenerateGradeCardAsync(studentId, termName, ct);
        return File(bytes, "application/pdf", $"grade-card-{studentId}-{termName}.pdf");
    }
}


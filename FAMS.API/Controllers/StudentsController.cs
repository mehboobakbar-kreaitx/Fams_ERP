using FAMS.Application.Common.Interfaces;
using FAMS.Application.Modules.CRM.Commands.CreateStudent;
using FAMS.Application.Modules.CRM.Commands.DeleteStudent;
using FAMS.Application.Modules.CRM.Commands.UpdateStudent;
using FAMS.Application.Modules.CRM.Commands.UpdateStudentStatus;
using FAMS.Application.Modules.CRM.Queries.GetStudentById;
using FAMS.Application.Modules.CRM.Queries.GetStudents;
using FAMS.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FAMS.API.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/[controller]")]
public class StudentsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public StudentsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? searchTerm = null, [FromQuery] Guid? classId = null, [FromQuery] StudentStatus? status = null)
    {
        if (_currentUser.CampusId is null) return Forbid();
        var result = await _mediator.Send(new GetStudentsQuery(
            _currentUser.CampusId.Value, pageNumber, pageSize, searchTerm, classId, status));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _mediator.Send(new GetStudentByIdQuery(id));
        return result.IsSuccess ? Ok(result.Value) : NotFound(result);
    }

    [HttpPost]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator")]
    public async Task<IActionResult> Create([FromBody] CreateStudentCommand command)
    {
        if (_currentUser.CampusId is null) return Forbid();
        var sanitized = command with { CampusId = _currentUser.CampusId.Value };
        var result = await _mediator.Send(sanitized);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Value }, result.Value)
            : BadRequest(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateStudentCommand command)
    {
        if (id != command.Id) return BadRequest("Route id and body id must match.");
        var result = await _mediator.Send(command);
        return result.IsSuccess ? NoContent() : BadRequest(result);
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStudentStatusBody body)
    {
        var result = await _mediator.Send(new UpdateStudentStatusCommand(id, body.NewStatus, body.Reason));
        return result.IsSuccess ? NoContent() : BadRequest(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SystemAdmin,Principal")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _mediator.Send(new DeleteStudentCommand(id));
        return result.IsSuccess ? NoContent() : BadRequest(result);
    }
}

public record UpdateStudentStatusBody(StudentStatus NewStatus, string Reason);


using FAMS.Application.Common.Interfaces;
using FAMS.Application.Modules.Admissions.Commands.EnrollApplicant;
using FAMS.Application.Modules.Admissions.Commands.GenerateMeritList;
using FAMS.Application.Modules.Admissions.Commands.ReviewApplication;
using FAMS.Application.Modules.Admissions.Commands.SubmitApplication;
using FAMS.Application.Modules.Admissions.Queries.GetAdmissionsFunnel;
using FAMS.Application.Modules.Admissions.Queries.GetApplications;
using FAMS.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FAMS.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AdmissionsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public AdmissionsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpPost("applications")]
    [AllowAnonymous]
    public async Task<IActionResult> Submit([FromBody] SubmitApplicationCommand command)
    {
        var result = await _mediator.Send(command);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetApplications), null, new { id = result.Value })
            : BadRequest(result);
    }

    [HttpGet("applications")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator")]
    public async Task<IActionResult> GetApplications([FromQuery] ApplicationStatus? status = null,
        [FromQuery] Guid? programId = null, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
    {
        if (_currentUser.CampusId is null) return Forbid();
        var result = await _mediator.Send(new GetApplicationsQuery(
            _currentUser.CampusId.Value, status, programId, pageNumber, pageSize));
        return Ok(result.Value);
    }

    [HttpPost("applications/{id:guid}/review")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator")]
    public async Task<IActionResult> Review(Guid id, [FromBody] ReviewApplicationBody body)
    {
        if (_currentUser.UserId is null) return Unauthorized();
        if (!Guid.TryParse(_currentUser.UserId, out var reviewerId)) return Unauthorized();
        var result = await _mediator.Send(new ReviewApplicationCommand(id, body.NewStatus, body.ReviewNotes, reviewerId));
        return result.IsSuccess ? NoContent() : BadRequest(result);
    }

    [HttpPost("applications/{id:guid}/enroll")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator")]
    public async Task<IActionResult> Enroll(Guid id, [FromBody] EnrollApplicantBody body)
    {
        var result = await _mediator.Send(new EnrollApplicantCommand(
            id, body.ClassId, body.SectionId, body.RollNumber,
            body.EmergencyContactName, body.EmergencyContactPhone,
            body.ParentFirstName, body.ParentLastName, body.ParentCnic,
            body.ParentPhone, body.ParentEmail, body.ParentRelationship, body.ParentAddress));
        return result.IsSuccess ? Ok(new { studentId = result.Value }) : BadRequest(result);
    }

    [HttpPost("merit-list")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator")]
    public async Task<IActionResult> MeritList([FromBody] GenerateMeritListCommand command)
    {
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result);
    }

    [HttpGet("funnel")]
    [Authorize(Roles = "SystemAdmin,Principal,Executive")]
    public async Task<IActionResult> Funnel([FromQuery] Guid? programId = null)
    {
        if (_currentUser.CampusId is null) return Forbid();
        var result = await _mediator.Send(new GetAdmissionsFunnelQuery(_currentUser.CampusId.Value, programId));
        return Ok(result.Value);
    }
}

public record ReviewApplicationBody(ApplicationStatus NewStatus, string ReviewNotes);
public record EnrollApplicantBody(
    Guid ClassId,
    Guid SectionId,
    string RollNumber,
    string EmergencyContactName,
    string EmergencyContactPhone,
    // Optional — supply to create/link a parent and activate their portal
    string? ParentFirstName = null,
    string? ParentLastName = null,
    string? ParentCnic = null,
    string? ParentPhone = null,
    string? ParentEmail = null,
    string? ParentRelationship = null,
    string? ParentAddress = null);


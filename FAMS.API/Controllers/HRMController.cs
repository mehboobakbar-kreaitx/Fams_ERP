using FAMS.Application.Common.Interfaces;
using FAMS.Application.Modules.HRM.Leaves.Commands.ApplyLeave;
using FAMS.Application.Modules.HRM.Leaves.Commands.ReviewLeave;
using FAMS.Application.Modules.HRM.Leaves.Queries.GetLeaves;
using FAMS.Application.Modules.HRM.Staff.Commands.CreateStaff;
using FAMS.Application.Modules.HRM.Staff.Commands.DeactivateStaff;
using FAMS.Application.Modules.HRM.Staff.Commands.UpdateStaff;
using FAMS.Application.Modules.HRM.Staff.Queries.GetHrAnalytics;
using FAMS.Application.Modules.HRM.Staff.Queries.GetStaffById;
using FAMS.Application.Modules.HRM.Staff.Queries.GetStaffList;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FAMS.API.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/hrm")]
public class HRMController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public HRMController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    // ---------- Staff ----------

    [HttpGet("staff")]
    [Authorize(Roles = "SystemAdmin,Principal,HrOfficer,Executive")]
    public async Task<IActionResult> GetStaff(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? department = null,
        [FromQuery] bool? isActive = null)
    {
        if (_currentUser.CampusId is null) return Forbid();
        var result = await _mediator.Send(new GetStaffListQuery(
            _currentUser.CampusId.Value, pageNumber, pageSize, searchTerm, department, isActive));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result);
    }

    [HttpGet("staff/{id:guid}")]
    [Authorize(Roles = "SystemAdmin,Principal,HrOfficer,Executive")]
    public async Task<IActionResult> GetStaffById(Guid id)
    {
        var result = await _mediator.Send(new GetStaffByIdQuery(id));
        return result.IsSuccess ? Ok(result.Value) : NotFound(result);
    }

    [HttpPost("staff")]
    [Authorize(Roles = "SystemAdmin,Principal,HrOfficer")]
    public async Task<IActionResult> CreateStaff([FromBody] CreateStaffCommand command)
    {
        if (_currentUser.CampusId is null) return Forbid();
        var sanitized = command with { CampusId = _currentUser.CampusId.Value };
        var result = await _mediator.Send(sanitized);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetStaffById), new { id = result.Value }, new { staffId = result.Value })
            : BadRequest(result);
    }

    [HttpPut("staff/{id:guid}")]
    [Authorize(Roles = "SystemAdmin,Principal,HrOfficer")]
    public async Task<IActionResult> UpdateStaff(Guid id, [FromBody] UpdateStaffCommand command)
    {
        if (id != command.Id) return BadRequest("Route id and body id must match.");
        var result = await _mediator.Send(command);
        return result.IsSuccess ? NoContent() : BadRequest(result);
    }

    [HttpPost("staff/{id:guid}/deactivate")]
    [Authorize(Roles = "SystemAdmin,Principal")]
    public async Task<IActionResult> DeactivateStaff(Guid id, [FromBody] DeactivateStaffBody body)
    {
        var result = await _mediator.Send(new DeactivateStaffCommand(id, body.Reason));
        return result.IsSuccess ? NoContent() : BadRequest(result);
    }

    [HttpGet("analytics")]
    [Authorize(Roles = "SystemAdmin,Principal,HrOfficer,Executive")]
    public async Task<IActionResult> GetAnalytics()
    {
        if (_currentUser.CampusId is null) return Forbid();
        var result = await _mediator.Send(new GetHrAnalyticsQuery(_currentUser.CampusId.Value));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result);
    }

    // ---------- Leaves ----------

    [HttpPost("leaves")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator,Teacher,HrOfficer,Accountant,ProcurementOfficer")]
    public async Task<IActionResult> ApplyLeave([FromBody] ApplyLeaveCommand command)
    {
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(new { leaveId = result.Value }) : BadRequest(result);
    }

    [HttpPost("leaves/{id:guid}/review")]
    [Authorize(Roles = "SystemAdmin,Principal,HrOfficer")]
    public async Task<IActionResult> ReviewLeave(Guid id, [FromBody] ReviewLeaveBody body)
    {
        if (_currentUser.UserId is null || !Guid.TryParse(_currentUser.UserId, out var reviewerId))
            return Unauthorized();
        var result = await _mediator.Send(new ReviewLeaveCommand(id, body.Approved, reviewerId, body.Remarks));
        return result.IsSuccess ? NoContent() : BadRequest(result);
    }

    [HttpGet("leaves")]
    [Authorize(Roles = "SystemAdmin,Principal,HrOfficer,AcademicCoordinator,Teacher,Accountant,ProcurementOfficer")]
    public async Task<IActionResult> GetLeaves(
        [FromQuery] Guid? staffId = null,
        [FromQuery] string? status = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        if (_currentUser.CampusId is null) return Forbid();

        // Non-admin staff may only view their own leave requests.
        // Explicitly passing another user's staffId returns 403 rather than silently
        // overriding it — clearer security signal and easier to audit.
        var isAdminRole = _currentUser.Roles.Any(r => r is "SystemAdmin" or "Principal" or "HrOfficer");
        if (!isAdminRole)
        {
            if (!Guid.TryParse(_currentUser.UserId, out var selfId)) return Forbid();
            if (staffId.HasValue && staffId.Value != selfId) return Forbid();
            staffId = selfId;
        }

        var result = await _mediator.Send(new GetLeavesQuery(
            _currentUser.CampusId.Value, staffId, status, pageNumber, pageSize));
        return Ok(result.Value);
    }
}

public record DeactivateStaffBody(string Reason);
public record ReviewLeaveBody(bool Approved, string? Remarks = null);


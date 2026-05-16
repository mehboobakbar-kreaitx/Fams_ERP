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


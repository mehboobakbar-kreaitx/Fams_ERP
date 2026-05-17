using FAMS.Application.Common.Interfaces;
using FAMS.Application.Modules.Platform.Config.Commands.CreateAcademicTerm;
using FAMS.Application.Modules.Platform.Config.Commands.CreateFeeStructure;
using FAMS.Application.Modules.Platform.Config.Commands.SaveGradingScale;
using FAMS.Application.Modules.Platform.Config.Queries.GetAcademicTerms;
using FAMS.Application.Modules.Platform.Config.Queries.GetFeeStructures;
using FAMS.Application.Modules.Platform.Config.Queries.GetGradingScale;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FAMS.API.Controllers;

[ApiController]
[Authorize(Roles = "SystemAdmin")]
[Route("api/v1/config")]
public class ConfigController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IFamsDbContext _db;

    public ConfigController(IMediator mediator, IFamsDbContext db)
    {
        _mediator = mediator;
        _db = db;
    }

    // ── Programs (lookup for fee template form) ───────────────────────────────

    [HttpGet("/api/v1/programs")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator,Accountant,HrOfficer,ProcurementOfficer,Teacher,Executive")]
    public async Task<IActionResult> GetPrograms(CancellationToken ct)
    {
        var programs = await _db.Programs.AsNoTracking()
            .Where(p => p.IsActive)
            .OrderBy(p => p.Name)
            .Select(p => new { p.Id, p.Name, p.Code })
            .ToListAsync(ct);
        return Ok(programs);
    }

    // ── Academic Terms ────────────────────────────────────────────────────────

    [HttpGet("terms")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator,Accountant,HrOfficer,ProcurementOfficer,Teacher,Executive")]
    public async Task<IActionResult> GetTerms()
    {
        var result = await _mediator.Send(new GetAcademicTermsQuery());
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    [HttpPost("terms")]
    public async Task<IActionResult> CreateTerm([FromBody] CreateTermBody body)
    {
        var result = await _mediator.Send(new CreateAcademicTermCommand(body.Name, body.StartDate, body.EndDate));
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetTerms), new { id = result.Value }, new { id = result.Value })
            : BadRequest(new { error = result.Error });
    }

    // ── Fee Structures ────────────────────────────────────────────────────────

    [HttpGet("fee-templates")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator,Accountant,Executive")]
    public async Task<IActionResult> GetFeeStructures()
    {
        var result = await _mediator.Send(new GetFeeStructuresQuery());
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    [HttpPost("fee-templates")]
    public async Task<IActionResult> CreateFeeStructure([FromBody] CreateFeeStructureCommand command)
    {
        var result = await _mediator.Send(command);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetFeeStructures), new { id = result.Value }, new { id = result.Value })
            : BadRequest(new { error = result.Error });
    }

    // ── Grading Scale ─────────────────────────────────────────────────────────

    [HttpGet("grading-scales")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator,Teacher,Executive")]
    public async Task<IActionResult> GetGradingScale()
    {
        var result = await _mediator.Send(new GetGradingScaleQuery());
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    [HttpPut("grading-scales")]
    public async Task<IActionResult> SaveGradingScale([FromBody] SaveGradingScaleCommand command)
    {
        var result = await _mediator.Send(command);
        return result.IsSuccess ? NoContent() : BadRequest(new { error = result.Error });
    }

    // ── Notification Templates (static — no persistence layer yet) ───────────

    [HttpGet("notification-templates")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator")]
    public IActionResult GetNotificationTemplates()
    {
        var templates = new[]
        {
            new { @event = "StudentAbsent",        channel = "SMS, In-App", status = "Live"     },
            new { @event = "ResultsPublished",      channel = "SMS, Email",  status = "Live"     },
            new { @event = "FeeDueReminder",        channel = "SMS",         status = "Upcoming" },
            new { @event = "ApplicationStatusChanged", channel = "Email",    status = "Upcoming" },
            new { @event = "ExamReminder",          channel = "SMS",         status = "Upcoming" },
        };
        return Ok(templates);
    }
}

public record CreateTermBody(string Name, DateTime StartDate, DateTime EndDate);

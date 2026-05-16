using FAMS.Application.Common.Interfaces;
using FAMS.Application.Modules.SuperAdmin.Campuses.Commands.CreateCampus;
using FAMS.Application.Modules.SuperAdmin.Campuses.Queries.GetCampuses;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FAMS.API.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/campuses")]
public class CampusesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IFamsDbContext _db;

    public CampusesController(IMediator mediator, IFamsDbContext db)
    {
        _mediator = mediator;
        _db = db;
    }

    [HttpGet]
    [Authorize(Roles = "SystemAdmin,Executive")]
    public async Task<IActionResult> List()
    {
        var result = await _mediator.Send(new GetCampusesQuery());
        return Ok(result.Value);
    }

    [HttpPost]
    [Authorize(Roles = "SystemAdmin,Principal")]
    public async Task<IActionResult> Create([FromBody] CreateCampusCommand command)
    {
        var result = await _mediator.Send(command);
        return result.IsSuccess
            ? CreatedAtAction(nameof(List), new { id = result.Value }, new { id = result.Value })
            : BadRequest(new { error = result.Error });
    }

    // PRD §7.2 FR-ADM-01 — public application portal needs campus + program lists with no login.
    [HttpGet("public")]
    [AllowAnonymous]
    public async Task<IActionResult> PublicList()
    {
        var data = await _db.Campuses.AsNoTracking()
            .Select(c => new { c.Id, c.Name, c.Code })
            .ToListAsync();
        return Ok(data);
    }

    [HttpGet("public/programs")]
    [AllowAnonymous]
    public async Task<IActionResult> PublicPrograms()
    {
        var data = await _db.Programs.AsNoTracking()
            .Select(p => new { p.Id, p.Name, p.Code })
            .ToListAsync();
        return Ok(data);
    }
}


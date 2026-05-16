using FAMS.Application.Modules.SuperAdmin.Schools.Commands.CreateSchool;
using FAMS.Application.Modules.SuperAdmin.Schools.Commands.DeleteSchool;
using FAMS.Application.Modules.SuperAdmin.Schools.Commands.ToggleSchoolStatus;
using FAMS.Application.Modules.SuperAdmin.Schools.Commands.UpdateSchool;
using FAMS.Application.Modules.SuperAdmin.Schools.Queries.GetSchoolById;
using FAMS.Application.Modules.SuperAdmin.Schools.Queries.GetSchoolStats;
using FAMS.Application.Modules.SuperAdmin.Schools.Queries.GetSchools;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FAMS.API.Controllers;

[ApiController]
[Authorize(Roles = "SystemAdmin")]
[Route("api/v1/schools")]
public class SchoolsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SchoolsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null)
    {
        var result = await _mediator.Send(new GetSchoolsQuery(pageNumber, pageSize, search, isActive));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _mediator.Send(new GetSchoolByIdQuery(id));
        return result.IsSuccess ? Ok(result.Value) : NotFound(new { error = result.Error });
    }

    [HttpGet("{id:guid}/stats")]
    [Authorize(Roles = "SystemAdmin,Principal,Executive")]
    public async Task<IActionResult> GetStats(Guid id)
    {
        var result = await _mediator.Send(new GetSchoolStatsQuery(id));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSchoolCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.IsSuccess) return BadRequest(new { error = result.Error });

        var dto = result.Value!;
        return CreatedAtAction(nameof(GetById), new { id = dto.SchoolId }, new
        {
            id            = dto.SchoolId,
            adminEmail    = dto.AdminEmail,
            adminPassword = dto.AdminPassword,
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSchoolBody body)
    {
        var result = await _mediator.Send(new UpdateSchoolCommand(
            id, body.Name, body.City, body.Address, body.Phone, body.Email, body.Website, body.LogoUrl));
        return result.IsSuccess ? NoContent() : BadRequest(new { error = result.Error });
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> ToggleStatus(Guid id, [FromBody] ToggleStatusBody body)
    {
        var result = await _mediator.Send(new ToggleSchoolStatusCommand(id, body.IsActive));
        return result.IsSuccess ? NoContent() : BadRequest(new { error = result.Error });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _mediator.Send(new DeleteSchoolCommand(id));
        return result.IsSuccess ? NoContent() : BadRequest(new { error = result.Error });
    }
}

public record UpdateSchoolBody(
    string Name,
    string City,
    string? Address,
    string? Phone,
    string? Email,
    string? Website,
    string? LogoUrl);

public record ToggleStatusBody(bool IsActive);

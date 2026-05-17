using FAMS.Application.Modules.Admin.Audit.Queries.GetAuditLogs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FAMS.API.Controllers;

[ApiController]
[Authorize(Roles = "SystemAdmin")]
[Route("api/v1/audit")]
public class AuditController : ControllerBase
{
    private readonly IMediator _mediator;
    public AuditController(IMediator mediator) => _mediator = mediator;

    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs(
        [FromQuery] string? action = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 25)
    {
        var result = await _mediator.Send(
            new GetAuditLogsQuery(action, fromDate, toDate, pageNumber, pageSize));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result);
    }
}

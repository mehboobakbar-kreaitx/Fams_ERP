using FAMS.Application.Common.Interfaces;
using FAMS.Application.Modules.Assets.Commands.CreateAsset;
using FAMS.Application.Modules.Assets.Commands.UpdateAssetStatus;
using FAMS.Application.Modules.Assets.Queries.GetAssets;
using FAMS.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FAMS.API.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/[controller]")]
public class AssetsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public AssetsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? category = null, [FromQuery] AssetStatus? status = null,
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50)
    {
        if (_currentUser.CampusId is null) return Forbid();
        var result = await _mediator.Send(new GetAssetsQuery(
            _currentUser.CampusId.Value, category, status, pageNumber, pageSize));
        return Ok(result.Value);
    }

    [HttpPost]
    [Authorize(Roles = "SystemAdmin,Principal,ProcurementOfficer")]
    public async Task<IActionResult> Create([FromBody] CreateAssetCommand command)
    {
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(new { assetId = result.Value }) : BadRequest(result);
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "SystemAdmin,Principal,ProcurementOfficer")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateAssetStatusBody body)
    {
        var result = await _mediator.Send(new UpdateAssetStatusCommand(id, body.NewStatus));
        return result.IsSuccess ? NoContent() : BadRequest(result);
    }

    [HttpPost("{id:guid}/maintenance")]
    [Authorize(Roles = "SystemAdmin,Principal,ProcurementOfficer")]
    public async Task<IActionResult> RecordMaintenance(Guid id)
    {
        var result = await _mediator.Send(new RecordMaintenanceCommand(id));
        return result.IsSuccess ? NoContent() : BadRequest(result);
    }
}

public record UpdateAssetStatusBody(AssetStatus NewStatus);


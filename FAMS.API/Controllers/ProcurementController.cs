using FAMS.Application.Common.Interfaces;
using FAMS.Application.Modules.Procurement.PurchaseOrders.Commands.ApprovePurchaseOrder;
using FAMS.Application.Modules.Procurement.PurchaseOrders.Commands.CreatePurchaseOrder;
using FAMS.Application.Modules.Procurement.PurchaseOrders.Queries.GetPurchaseOrders;
using FAMS.Application.Modules.Procurement.Vendors.Commands.CreateVendor;
using FAMS.Application.Modules.Procurement.Vendors.Queries.GetVendors;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FAMS.API.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/procurement")]
public class ProcurementController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public ProcurementController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpPost("vendors")]
    [Authorize(Roles = "SystemAdmin,Principal,ProcurementOfficer")]
    public async Task<IActionResult> CreateVendor([FromBody] CreateVendorCommand command)
    {
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(new { vendorId = result.Value }) : BadRequest(result);
    }

    [HttpGet("vendors")]
    [Authorize(Roles = "SystemAdmin,Principal,ProcurementOfficer,Accountant")]
    public async Task<IActionResult> GetVendors([FromQuery] string? category = null, [FromQuery] bool? approved = null)
    {
        if (_currentUser.CampusId is null) return Forbid();
        var result = await _mediator.Send(new GetVendorsQuery(_currentUser.CampusId.Value, category, approved));
        return Ok(result.Value);
    }

    [HttpPost("purchase-orders")]
    [Authorize(Roles = "SystemAdmin,Principal,ProcurementOfficer")]
    public async Task<IActionResult> CreatePO([FromBody] CreatePurchaseOrderCommand command)
    {
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(new { purchaseOrderId = result.Value }) : BadRequest(result);
    }

    [HttpPost("purchase-orders/{id:guid}/approve")]
    [Authorize(Roles = "SystemAdmin,Principal")]
    public async Task<IActionResult> ApprovePO(Guid id)
    {
        if (_currentUser.UserId is null || !Guid.TryParse(_currentUser.UserId, out var approvedById))
            return Unauthorized();
        var result = await _mediator.Send(new ApprovePurchaseOrderCommand(id, approvedById));
        return result.IsSuccess ? NoContent() : BadRequest(result);
    }

    [HttpGet("purchase-orders")]
    [Authorize(Roles = "SystemAdmin,Principal,ProcurementOfficer,Accountant")]
    public async Task<IActionResult> GetPOs([FromQuery] string? status = null, [FromQuery] Guid? vendorId = null,
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
    {
        if (_currentUser.CampusId is null) return Forbid();
        var result = await _mediator.Send(new GetPurchaseOrdersQuery(
            _currentUser.CampusId.Value, status, vendorId, pageNumber, pageSize));
        return Ok(result.Value);
    }
}


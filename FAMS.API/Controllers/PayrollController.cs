using FAMS.Application.Common.Interfaces;
using FAMS.Application.Modules.Finance.Payroll.Commands.ApprovePayroll;
using FAMS.Application.Modules.Finance.Payroll.Commands.ProcessPayroll;
using FAMS.Application.Modules.Finance.Payroll.Queries.GetPayrollSummary;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FAMS.API.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/payroll")]
public class PayrollController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public PayrollController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpPost("process")]
    [Authorize(Roles = "SystemAdmin,Principal,Accountant,HrOfficer")]
    public async Task<IActionResult> Process([FromBody] ProcessPayrollBody body)
    {
        if (_currentUser.CampusId is null) return Forbid();
        var cmd = new ProcessPayrollCommand(_currentUser.CampusId.Value, body.Year, body.Month, body.Adjustments);
        var result = await _mediator.Send(cmd);
        return result.IsSuccess ? Ok(new { generated = result.Value }) : BadRequest(result);
    }

    [HttpPost("approve")]
    [Authorize(Roles = "SystemAdmin,Principal")]
    public async Task<IActionResult> Approve([FromBody] ApprovePayrollBody body)
    {
        if (_currentUser.CampusId is null || _currentUser.UserId is null) return Forbid();
        var cmd = new ApprovePayrollCommand(_currentUser.CampusId.Value, body.Year, body.Month, _currentUser.UserId);
        var result = await _mediator.Send(cmd);
        return result.IsSuccess ? Ok(new { approved = result.Value }) : BadRequest(result);
    }

    [HttpGet("summary")]
    [Authorize(Roles = "SystemAdmin,Principal,Accountant,HrOfficer,Executive")]
    public async Task<IActionResult> Summary([FromQuery] int year, [FromQuery] int month)
    {
        if (_currentUser.CampusId is null) return Forbid();
        var result = await _mediator.Send(new GetPayrollSummaryQuery(_currentUser.CampusId.Value, year, month));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result);
    }

    [HttpGet("staff/{staffId:guid}/payslip/{year:int}/{month:int}.pdf")]
    [Authorize(Roles = "SystemAdmin,Principal,Accountant,HrOfficer,Executive,Teacher,AcademicCoordinator,ProcurementOfficer")]
    public async Task<IActionResult> PayslipPdf(Guid staffId, int year, int month,
        [FromServices] IPdfService pdf, CancellationToken ct)
    {
        var bytes = await pdf.GeneratePayslipAsync(staffId, month, year, ct);
        return File(bytes, "application/pdf", $"payslip-{staffId}-{year}-{month:D2}.pdf");
    }
}

public record ProcessPayrollBody(int Year, int Month, IReadOnlyList<StaffAdjustment>? Adjustments);
public record ApprovePayrollBody(int Year, int Month);


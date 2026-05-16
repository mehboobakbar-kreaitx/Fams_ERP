using FAMS.Application.Common.Interfaces;
using FAMS.Application.Modules.Finance.Fee.Commands.ApplyLateFee;
using FAMS.Application.Modules.Finance.Fee.Commands.GenerateInvoices;
using FAMS.Application.Modules.Finance.Fee.Commands.RecordPayment;
using FAMS.Application.Modules.Finance.Fee.Queries.GetCollectionSummary;
using FAMS.Application.Modules.Finance.Fee.Queries.GetInvoices;
using FAMS.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FAMS.API.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/[controller]")]
public class FinanceController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public FinanceController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpGet("invoices")]
    public async Task<IActionResult> GetInvoices([FromQuery] Guid? studentId = null,
        [FromQuery] PaymentStatus? status = null, [FromQuery] string? termName = null,
        [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
    {
        if (_currentUser.CampusId is null) return Forbid();
        var result = await _mediator.Send(new GetInvoicesQuery(
            _currentUser.CampusId.Value, studentId, status, termName, pageNumber, pageSize));
        return Ok(result.Value);
    }

    [HttpPost("invoices/generate")]
    [Authorize(Roles = "SystemAdmin,Principal,Accountant")]
    public async Task<IActionResult> GenerateInvoices([FromBody] GenerateInvoicesBody body)
    {
        if (_currentUser.CampusId is null) return Forbid();
        var result = await _mediator.Send(new GenerateInvoicesCommand(
            _currentUser.CampusId.Value, body.TermName, body.DueDate, body.DefaultTermFee));
        return result.IsSuccess ? Ok(new { invoicesGenerated = result.Value }) : BadRequest(result);
    }

    [HttpPost("payments")]
    [Authorize(Roles = "SystemAdmin,Principal,Accountant")]
    public async Task<IActionResult> RecordPayment([FromBody] RecordPaymentBody body)
    {
        if (_currentUser.UserId is null || !Guid.TryParse(_currentUser.UserId, out var receivedById))
            return Unauthorized();
        var result = await _mediator.Send(new RecordPaymentCommand(
            body.InvoiceId, body.Amount, body.PaymentMethod, body.TransactionId, receivedById));
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetInvoices), new { id = result.Value }, new { paymentId = result.Value })
            : BadRequest(result);
    }

    [HttpPost("invoices/apply-late-fee")]
    [Authorize(Roles = "SystemAdmin,Principal,Accountant")]
    public async Task<IActionResult> ApplyLateFee([FromBody] ApplyLateFeeBody body)
    {
        if (_currentUser.CampusId is null) return Forbid();
        var result = await _mediator.Send(new ApplyLateFeeCommand(
            _currentUser.CampusId.Value, body.LateFeeAmount, body.IsPercentage));
        return result.IsSuccess ? Ok(new { invoicesUpdated = result.Value }) : BadRequest(result);
    }

    [HttpGet("collection-summary")]
    [Authorize(Roles = "SystemAdmin,Principal,Accountant,Executive")]
    public async Task<IActionResult> CollectionSummary([FromQuery] string? termName = null)
    {
        if (_currentUser.CampusId is null) return Forbid();
        var result = await _mediator.Send(new GetCollectionSummaryQuery(_currentUser.CampusId.Value, termName));
        return Ok(result.Value);
    }

    [HttpGet("payments/{paymentId:guid}/receipt.pdf")]
    public async Task<IActionResult> ReceiptPdf(Guid paymentId, [FromServices] IPdfService pdf, CancellationToken ct)
    {
        var bytes = await pdf.GenerateFeeReceiptAsync(paymentId, ct);
        return File(bytes, "application/pdf", $"fee-receipt-{paymentId}.pdf");
    }
}

public record GenerateInvoicesBody(string TermName, DateTime DueDate, decimal DefaultTermFee);
public record RecordPaymentBody(Guid InvoiceId, decimal Amount, string PaymentMethod, string? TransactionId);
public record ApplyLateFeeBody(decimal LateFeeAmount, bool IsPercentage);


using FAMS.Application.Common.Exceptions;
using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FAMS.Application.Modules.Finance.Fee.Commands.RecordPayment;

public class RecordPaymentCommandHandler : IRequestHandler<RecordPaymentCommand, Result<Guid>>
{
    private readonly IFamsDbContext _db;
    private readonly IPdfService _pdf;
    private readonly IEmailService _email;
    private readonly ILogger<RecordPaymentCommandHandler> _logger;

    public RecordPaymentCommandHandler(IFamsDbContext db, IPdfService pdf, IEmailService email,
        ILogger<RecordPaymentCommandHandler> logger)
    {
        _db = db;
        _pdf = pdf;
        _email = email;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(RecordPaymentCommand request, CancellationToken cancellationToken)
    {
        var invoice = await _db.FeeInvoices
            .Include(i => i.Student).ThenInclude(s => s.Campus)
            .Include(i => i.Student).ThenInclude(s => s.Parent)
            .FirstOrDefaultAsync(i => i.Id == request.InvoiceId, cancellationToken)
            ?? throw new NotFoundException(nameof(FeeInvoice), request.InvoiceId);

        if (request.Amount > invoice.Balance)
            return Result<Guid>.Failure($"Payment amount ({request.Amount}) exceeds remaining balance ({invoice.Balance}).");

        var sequence = await _db.FeePayments.CountAsync(p => p.CampusId == invoice.CampusId, cancellationToken) + 1;
        var receiptNumber = $"REC-{invoice.Student.Campus.Code}-{DateTime.UtcNow:yyyyMM}-{sequence:D5}";

        var payment = FeePayment.Create(invoice.Id, request.Amount, request.PaymentMethod,
            receiptNumber, request.ReceivedById, request.TransactionId);
        payment.CampusId = invoice.CampusId;

        invoice.ApplyPayment(request.Amount);

        _db.FeePayments.Add(payment);
        await _db.SaveChangesAsync(cancellationToken);

        if (invoice.Student.Parent?.Email is { Length: > 0 } parentEmail)
        {
            try
            {
                var body = $"<p>Dear {invoice.Student.Parent.FirstName},</p>" +
                           $"<p>Payment of <strong>Rs. {request.Amount:N2}</strong> received for {invoice.Student.FirstName} {invoice.Student.LastName}.</p>" +
                           $"<p>Receipt #: {receiptNumber}<br/>Invoice #: {invoice.InvoiceNumber}<br/>Remaining balance: Rs. {invoice.Balance:N2}</p>";
                await _email.SendAsync(parentEmail, $"FAMS — Payment Receipt {receiptNumber}", body, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to email receipt to parent {Email}", parentEmail);
            }
        }

        return Result<Guid>.Success(payment.Id);
    }
}

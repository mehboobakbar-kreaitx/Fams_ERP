using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FAMS.Application.Modules.Finance.Fee.Commands.ApplyLateFee;

public class ApplyLateFeeCommandHandler : IRequestHandler<ApplyLateFeeCommand, Result<int>>
{
    private readonly IFamsDbContext _db;
    private readonly ISmsService _sms;
    private readonly ILogger<ApplyLateFeeCommandHandler> _logger;

    public ApplyLateFeeCommandHandler(IFamsDbContext db, ISmsService sms, ILogger<ApplyLateFeeCommandHandler> logger)
    {
        _db = db;
        _sms = sms;
        _logger = logger;
    }

    public async Task<Result<int>> Handle(ApplyLateFeeCommand request, CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow.Date;
        var overdueInvoices = await _db.FeeInvoices
            .Include(i => i.Student).ThenInclude(s => s.Parent)
            .Where(i => i.CampusId == request.CampusId
                && i.DueDate < today
                && i.Status != PaymentStatus.Paid
                && i.Status != PaymentStatus.Waived
                && i.LateFee == 0)
            .ToListAsync(cancellationToken);

        foreach (var invoice in overdueInvoices)
        {
            var fee = request.IsPercentage
                ? Math.Round(invoice.TotalAmount * request.LateFeeAmount / 100m, 2)
                : request.LateFeeAmount;
            invoice.ApplyLateFee(fee);

            if (invoice.Student.Parent?.Phone is { Length: > 0 } phone)
            {
                try
                {
                    var msg = $"FAMS: Late fee Rs.{fee:N0} applied on overdue invoice {invoice.InvoiceNumber} for {invoice.Student.FirstName}. Balance Rs.{invoice.Balance:N0}.";
                    await _sms.SendAsync(phone, msg, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Late-fee SMS failed for {Phone}", phone);
                }
            }
        }

        await _db.SaveChangesAsync(cancellationToken);
        return Result<int>.Success(overdueInvoices.Count);
    }
}

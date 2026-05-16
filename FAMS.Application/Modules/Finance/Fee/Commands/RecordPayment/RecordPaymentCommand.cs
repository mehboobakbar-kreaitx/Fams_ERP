using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Finance.Fee.Commands.RecordPayment;

public record RecordPaymentCommand(
    Guid InvoiceId,
    decimal Amount,
    string PaymentMethod,
    string? TransactionId,
    Guid ReceivedById) : IRequest<Result<Guid>>;

using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Finance.Fee.Commands.GenerateInvoices;

public record GenerateInvoicesCommand(
    Guid CampusId,
    string TermName,
    DateTime DueDate,
    decimal DefaultTermFee) : IRequest<Result<int>>;

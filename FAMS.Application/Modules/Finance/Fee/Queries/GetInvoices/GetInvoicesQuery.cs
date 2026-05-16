using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;

namespace FAMS.Application.Modules.Finance.Fee.Queries.GetInvoices;

public record GetInvoicesQuery(
    Guid CampusId,
    Guid? StudentId = null,
    PaymentStatus? Status = null,
    string? TermName = null,
    int PageNumber = 1,
    int PageSize = 20) : IRequest<Result<PaginatedList<InvoiceDto>>>;

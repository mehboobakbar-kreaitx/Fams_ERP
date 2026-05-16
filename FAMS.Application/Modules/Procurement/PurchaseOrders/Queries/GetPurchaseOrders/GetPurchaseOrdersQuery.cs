using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Procurement.PurchaseOrders.Queries.GetPurchaseOrders;

public record GetPurchaseOrdersQuery(
    Guid CampusId,
    string? Status = null,
    Guid? VendorId = null,
    int PageNumber = 1,
    int PageSize = 20) : IRequest<Result<PaginatedList<PurchaseOrderDto>>>;

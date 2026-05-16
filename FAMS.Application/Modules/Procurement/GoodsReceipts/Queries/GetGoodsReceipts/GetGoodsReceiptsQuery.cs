using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Procurement.GoodsReceipts.Queries.GetGoodsReceipts;

public record GetGoodsReceiptsQuery(
    Guid CampusId,
    Guid? PurchaseOrderId = null,
    int PageNumber = 1,
    int PageSize = 20) : IRequest<Result<PaginatedList<GoodsReceiptDto>>>;

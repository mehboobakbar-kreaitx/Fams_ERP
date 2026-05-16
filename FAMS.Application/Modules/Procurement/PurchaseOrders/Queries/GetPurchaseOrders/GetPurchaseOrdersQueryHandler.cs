using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Procurement.PurchaseOrders.Queries.GetPurchaseOrders;

public class GetPurchaseOrdersQueryHandler : IRequestHandler<GetPurchaseOrdersQuery, Result<PaginatedList<PurchaseOrderDto>>>
{
    private readonly IFamsDbContext _db;

    public GetPurchaseOrdersQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<PaginatedList<PurchaseOrderDto>>> Handle(GetPurchaseOrdersQuery request, CancellationToken cancellationToken)
    {
        var query = _db.PurchaseOrders.AsNoTracking().Include(p => p.Vendor).Include(p => p.LineItems)
            .Where(p => p.CampusId == request.CampusId);
        if (!string.IsNullOrWhiteSpace(request.Status)) query = query.Where(p => p.Status == request.Status);
        if (request.VendorId.HasValue) query = query.Where(p => p.VendorId == request.VendorId.Value);

        var projected = query
            .OrderByDescending(p => p.OrderDate)
            .Select(p => new PurchaseOrderDto(p.Id, p.PONumber, p.VendorId, p.Vendor.Name,
                p.OrderDate, p.ExpectedDelivery, p.TotalAmount, p.Status, p.LineItems.Count));

        var paged = await PaginatedList<PurchaseOrderDto>.CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken);
        return Result<PaginatedList<PurchaseOrderDto>>.Success(paged);
    }
}

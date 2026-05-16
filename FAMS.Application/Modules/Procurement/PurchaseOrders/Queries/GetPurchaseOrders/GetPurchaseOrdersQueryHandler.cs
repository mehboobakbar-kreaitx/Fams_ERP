using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Procurement.PurchaseOrders.Queries.GetPurchaseOrders;

public class GetPurchaseOrdersQueryHandler : IRequestHandler<GetPurchaseOrdersQuery, Result<PaginatedList<PurchaseOrderDto>>>
{
    private readonly IFamsDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetPurchaseOrdersQueryHandler(IFamsDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Result<PaginatedList<PurchaseOrderDto>>> Handle(GetPurchaseOrdersQuery request, CancellationToken cancellationToken)
    {
        if (_currentUser.SchoolId.HasValue &&
            !await _db.Campuses.AnyAsync(c => c.Id == request.CampusId, cancellationToken))
            return Result<PaginatedList<PurchaseOrderDto>>.Failure("Campus not found or not accessible.");

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

using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Procurement.GoodsReceipts.Queries.GetGoodsReceipts;

public class GetGoodsReceiptsQueryHandler
    : IRequestHandler<GetGoodsReceiptsQuery, Result<PaginatedList<GoodsReceiptDto>>>
{
    private readonly IFamsDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetGoodsReceiptsQueryHandler(IFamsDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Result<PaginatedList<GoodsReceiptDto>>> Handle(
        GetGoodsReceiptsQuery request, CancellationToken cancellationToken)
    {
        if (_currentUser.SchoolId.HasValue &&
            !await _db.Campuses.AnyAsync(c => c.Id == request.CampusId, cancellationToken))
            return Result<PaginatedList<GoodsReceiptDto>>.Failure("Campus not found or not accessible.");

        var query = _db.GoodsReceipts.AsNoTracking()
            .Where(g => g.CampusId == request.CampusId);
        if (request.PurchaseOrderId.HasValue)
            query = query.Where(g => g.PurchaseOrderId == request.PurchaseOrderId.Value);

        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 200);
        var totalCount = await query.CountAsync(cancellationToken);

        var receipts = await query
            .OrderByDescending(g => g.ReceivedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var ids = receipts.Select(r => r.Id).ToList();
        var poIds = receipts.Select(r => r.PurchaseOrderId).Distinct().ToList();
        var receiverIds = receipts.Select(r => r.ReceivedById).Distinct().ToList();

        var poNumbers = await _db.PurchaseOrders.AsNoTracking()
            .Where(p => poIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p.PONumber, cancellationToken);

        var receiverNames = await _db.StaffMembers.AsNoTracking()
            .Where(s => receiverIds.Contains(s.Id))
            .ToDictionaryAsync(s => s.Id, s => s.FirstName + " " + s.LastName, cancellationToken);

        var lineRows = await _db.GoodsReceiptLineItems.AsNoTracking()
            .Where(l => ids.Contains(l.GoodsReceiptId))
            .Join(_db.POLineItems, l => l.POLineItemId, po => po.Id,
                (l, po) => new
                {
                    l.Id, l.GoodsReceiptId, l.POLineItemId, po.Description, OrderedQty = po.Quantity,
                    l.QuantityReceived, l.QuantityRejected, l.Condition
                })
            .ToListAsync(cancellationToken);

        var dtos = receipts.Select(r => new GoodsReceiptDto(
            r.Id, r.ReceiptNumber, r.PurchaseOrderId,
            poNumbers.GetValueOrDefault(r.PurchaseOrderId, string.Empty),
            r.ReceivedById,
            receiverNames.GetValueOrDefault(r.ReceivedById, string.Empty),
            r.ReceivedAt, r.DeliveryNoteRef, r.Notes,
            lineRows.Where(l => l.GoodsReceiptId == r.Id)
                .Select(l => new GoodsReceiptLineItemDto(
                    l.Id, l.POLineItemId, l.Description, l.OrderedQty,
                    l.QuantityReceived, l.QuantityRejected, l.Condition))
                .ToList()))
            .ToList();

        return Result<PaginatedList<GoodsReceiptDto>>.Success(
            new PaginatedList<GoodsReceiptDto>(dtos, totalCount, pageNumber, pageSize));
    }
}

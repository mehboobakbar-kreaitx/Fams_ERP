using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Procurement.Requisitions.Queries.GetRequisitions;

public class GetRequisitionsQueryHandler
    : IRequestHandler<GetRequisitionsQuery, Result<PaginatedList<RequisitionDto>>>
{
    private readonly IFamsDbContext _db;

    public GetRequisitionsQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<PaginatedList<RequisitionDto>>> Handle(
        GetRequisitionsQuery request, CancellationToken cancellationToken)
    {
        var query = _db.PurchaseRequisitions.AsNoTracking()
            .Where(p => p.CampusId == request.CampusId);

        if (request.Status.HasValue)
            query = query.Where(p => p.Status == request.Status.Value);
        if (request.RequestedById.HasValue)
            query = query.Where(p => p.RequestedById == request.RequestedById.Value);

        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Clamp(request.PageSize, 1, 200);

        var totalCount = await query.CountAsync(cancellationToken);

        var prList = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new
            {
                p.Id, p.RequisitionNumber, p.RequestedById, p.Department, p.Justification,
                p.NeededBy, p.EstimatedTotal, p.Status, p.ReviewedAt, p.ReviewNotes,
                p.LinkedPurchaseOrderId, p.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var ids = prList.Select(p => p.Id).ToList();

        var requesterIds = prList.Select(p => p.RequestedById).Distinct().ToList();
        var requesterNames = await _db.StaffMembers.AsNoTracking()
            .Where(s => requesterIds.Contains(s.Id))
            .ToDictionaryAsync(s => s.Id, s => s.FirstName + " " + s.LastName, cancellationToken);

        var lineItems = await _db.RequisitionLineItems.AsNoTracking()
            .Where(l => ids.Contains(l.RequisitionId))
            .Select(l => new
            {
                l.Id, l.RequisitionId, l.Description, l.Quantity, l.EstimatedUnitPrice, l.Unit
            })
            .ToListAsync(cancellationToken);

        var items = prList.Select(p => new RequisitionDto(
            p.Id, p.RequisitionNumber, p.RequestedById,
            requesterNames.GetValueOrDefault(p.RequestedById, string.Empty),
            p.Department, p.Justification, p.NeededBy, p.EstimatedTotal, p.Status,
            p.ReviewedAt, p.ReviewNotes, p.LinkedPurchaseOrderId, p.CreatedAt,
            lineItems.Where(l => l.RequisitionId == p.Id)
                .Select(l => new RequisitionLineItemDto(
                    l.Id, l.Description, l.Quantity, l.EstimatedUnitPrice, l.Unit,
                    l.Quantity * l.EstimatedUnitPrice))
                .ToList()))
            .ToList();

        return Result<PaginatedList<RequisitionDto>>.Success(
            new PaginatedList<RequisitionDto>(items, totalCount, pageNumber, pageSize));
    }
}

using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Procurement.GoodsReceipts.Commands.RecordGoodsReceipt;

public class RecordGoodsReceiptCommandHandler : IRequestHandler<RecordGoodsReceiptCommand, Result<Guid>>
{
    private readonly IFamsDbContext _db;

    public RecordGoodsReceiptCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<Guid>> Handle(RecordGoodsReceiptCommand request, CancellationToken cancellationToken)
    {
        var po = await _db.PurchaseOrders
            .Include(p => p.LineItems)
            .FirstOrDefaultAsync(p => p.Id == request.PurchaseOrderId, cancellationToken);
        if (po is null)
            return Result<Guid>.Failure($"Purchase order '{request.PurchaseOrderId}' not found.");
        if (po.Status != "Approved")
            return Result<Guid>.Failure($"Purchase order must be Approved to record goods receipt (current: {po.Status}).");

        var poLineIds = po.LineItems.Select(li => li.Id).ToHashSet();
        var unknownLines = request.Lines.Where(l => !poLineIds.Contains(l.POLineItemId)).ToList();
        if (unknownLines.Count > 0)
            return Result<Guid>.Failure($"Line item(s) not in this PO: {string.Join(", ", unknownLines.Select(l => l.POLineItemId))}.");

        var sequence = await _db.GoodsReceipts.CountAsync(cancellationToken) + 1;
        var number = $"GRN-{DateTime.UtcNow:yyyyMM}-{sequence:D5}";

        var receipt = GoodsReceipt.Create(number, request.PurchaseOrderId,
            request.ReceivedById, request.DeliveryNoteRef, request.Notes);
        receipt.CampusId = po.CampusId;
        _db.GoodsReceipts.Add(receipt);
        await _db.SaveChangesAsync(cancellationToken);

        foreach (var line in request.Lines)
        {
            var entity = GoodsReceiptLineItem.Create(receipt.Id, line.POLineItemId,
                line.QuantityReceived, line.QuantityRejected, line.Condition);
            entity.CampusId = po.CampusId;
            _db.GoodsReceiptLineItems.Add(entity);
        }
        await _db.SaveChangesAsync(cancellationToken);

        // If every PO line is fully received, mark PO Delivered
        var totalsByLine = await _db.GoodsReceiptLineItems.AsNoTracking()
            .Where(l => _db.GoodsReceipts.Where(g => g.PurchaseOrderId == po.Id).Select(g => g.Id).Contains(l.GoodsReceiptId))
            .GroupBy(l => l.POLineItemId)
            .Select(g => new { POLineItemId = g.Key, Received = g.Sum(x => x.QuantityReceived) })
            .ToListAsync(cancellationToken);

        bool fullyDelivered = po.LineItems.All(li =>
            (totalsByLine.FirstOrDefault(t => t.POLineItemId == li.Id)?.Received ?? 0) >= li.Quantity);

        if (fullyDelivered)
        {
            po.MarkDelivered();
            await _db.SaveChangesAsync(cancellationToken);
        }

        return Result<Guid>.Success(receipt.Id);
    }
}

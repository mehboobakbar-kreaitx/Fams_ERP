using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Procurement.PurchaseOrders.Commands.CreatePurchaseOrder;

public class CreatePurchaseOrderCommandHandler : IRequestHandler<CreatePurchaseOrderCommand, Result<Guid>>
{
    private readonly IFamsDbContext _db;

    public CreatePurchaseOrderCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<Guid>> Handle(CreatePurchaseOrderCommand request, CancellationToken cancellationToken)
    {
        if (request.LineItems.Count == 0)
            return Result<Guid>.Failure("Purchase order must have at least one line item.");

        var sequence = await _db.PurchaseOrders.CountAsync(cancellationToken) + 1;
        var poNumber = $"PO-{DateTime.UtcNow:yyyyMM}-{sequence:D5}";
        var total = request.LineItems.Sum(i => i.Quantity * i.UnitPrice);

        var po = PurchaseOrder.Create(poNumber, request.VendorId, DateTime.UtcNow, total, request.ExpectedDelivery, request.Notes);
        _db.PurchaseOrders.Add(po);
        await _db.SaveChangesAsync(cancellationToken);

        foreach (var li in request.LineItems)
        {
            var lineItem = POLineItem.Create(po.Id, li.Description, li.Quantity, li.UnitPrice, li.Unit);
            lineItem.CampusId = po.CampusId;
            _db.POLineItems.Add(lineItem);
        }
        await _db.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(po.Id);
    }
}

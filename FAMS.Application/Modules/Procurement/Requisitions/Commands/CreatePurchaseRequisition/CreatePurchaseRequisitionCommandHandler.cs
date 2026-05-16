using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Procurement.Requisitions.Commands.CreatePurchaseRequisition;

public class CreatePurchaseRequisitionCommandHandler
    : IRequestHandler<CreatePurchaseRequisitionCommand, Result<Guid>>
{
    private readonly IFamsDbContext _db;

    public CreatePurchaseRequisitionCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<Guid>> Handle(CreatePurchaseRequisitionCommand request, CancellationToken cancellationToken)
    {
        var sequence = await _db.PurchaseRequisitions.CountAsync(cancellationToken) + 1;
        var number = $"PR-{DateTime.UtcNow:yyyyMM}-{sequence:D5}";
        var estimatedTotal = request.LineItems.Sum(li => li.Quantity * li.EstimatedUnitPrice);

        var pr = PurchaseRequisition.Create(number, request.RequestedById,
            request.Department, request.Justification, estimatedTotal, request.NeededBy);

        _db.PurchaseRequisitions.Add(pr);
        await _db.SaveChangesAsync(cancellationToken);

        foreach (var li in request.LineItems)
        {
            var lineItem = RequisitionLineItem.Create(pr.Id, li.Description, li.Quantity, li.EstimatedUnitPrice, li.Unit);
            lineItem.CampusId = pr.CampusId;
            _db.RequisitionLineItems.Add(lineItem);
        }

        await _db.SaveChangesAsync(cancellationToken);
        return Result<Guid>.Success(pr.Id);
    }
}

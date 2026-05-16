using FAMS.Application.Common.Exceptions;
using FAMS.Application.Common.Interfaces;
using FAMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Result = FAMS.Application.Common.Models.Result;

namespace FAMS.Application.Modules.Procurement.PurchaseOrders.Commands.ApprovePurchaseOrder;

public class ApprovePurchaseOrderCommandHandler : IRequestHandler<ApprovePurchaseOrderCommand, Result>
{
    private readonly IFamsDbContext _db;

    public ApprovePurchaseOrderCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result> Handle(ApprovePurchaseOrderCommand request, CancellationToken cancellationToken)
    {
        var po = await _db.PurchaseOrders.FirstOrDefaultAsync(p => p.Id == request.PurchaseOrderId, cancellationToken)
            ?? throw new NotFoundException(nameof(PurchaseOrder), request.PurchaseOrderId);

        po.Approve(request.ApprovedById);
        await _db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

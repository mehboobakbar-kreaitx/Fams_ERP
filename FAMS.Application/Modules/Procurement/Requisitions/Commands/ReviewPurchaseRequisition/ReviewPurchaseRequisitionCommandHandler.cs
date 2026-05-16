using FAMS.Application.Common.Exceptions;
using FAMS.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Result = FAMS.Application.Common.Models.Result;
using PurchaseRequisitionEntity = FAMS.Domain.Entities.PurchaseRequisition;

namespace FAMS.Application.Modules.Procurement.Requisitions.Commands.ReviewPurchaseRequisition;

public class ReviewPurchaseRequisitionCommandHandler : IRequestHandler<ReviewPurchaseRequisitionCommand, Result>
{
    private readonly IFamsDbContext _db;

    public ReviewPurchaseRequisitionCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result> Handle(ReviewPurchaseRequisitionCommand request, CancellationToken cancellationToken)
    {
        var pr = await _db.PurchaseRequisitions
            .FirstOrDefaultAsync(p => p.Id == request.RequisitionId, cancellationToken)
            ?? throw new NotFoundException(nameof(PurchaseRequisitionEntity), request.RequisitionId);

        try
        {
            if (request.Approved) pr.Approve(request.ReviewerId, request.Notes);
            else
            {
                if (string.IsNullOrWhiteSpace(request.Notes))
                    return Result.Failure("Rejection notes are required.");
                pr.Reject(request.ReviewerId, request.Notes);
            }
        }
        catch (InvalidOperationException ex)
        {
            return Result.Failure(ex.Message);
        }

        await _db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Finance.Fee.Queries.GetCollectionSummary;

public class GetCollectionSummaryQueryHandler : IRequestHandler<GetCollectionSummaryQuery, Result<CollectionSummaryDto>>
{
    private readonly IFamsDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetCollectionSummaryQueryHandler(IFamsDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Result<CollectionSummaryDto>> Handle(GetCollectionSummaryQuery request, CancellationToken cancellationToken)
    {
        if (_currentUser.SchoolId.HasValue &&
            !await _db.Campuses.AnyAsync(c => c.Id == request.CampusId, cancellationToken))
            return Result<CollectionSummaryDto>.Failure("Campus not found or not accessible.");

        var query = _db.FeeInvoices.AsNoTracking().Where(i => i.CampusId == request.CampusId);
        if (!string.IsNullOrWhiteSpace(request.TermName))
            query = query.Where(i => i.TermName == request.TermName);

        var today = DateTime.UtcNow.Date;
        var totalBilled = await query.SumAsync(i => i.TotalAmount + i.LateFee - i.Discount, cancellationToken);
        var totalCollected = await query.SumAsync(i => i.PaidAmount, cancellationToken);
        var lateFee = await query.SumAsync(i => i.LateFee, cancellationToken);
        var discount = await query.SumAsync(i => i.Discount, cancellationToken);
        var overdueCount = await query.CountAsync(
            i => i.DueDate < today && i.Status != PaymentStatus.Paid && i.Status != PaymentStatus.Waived,
            cancellationToken);

        var outstanding = totalBilled - totalCollected;
        var rate = totalBilled == 0
            ? 0m
            : Math.Round(totalCollected / totalBilled * 100m, 2);

        return Result<CollectionSummaryDto>.Success(new CollectionSummaryDto(
            totalBilled, totalCollected, outstanding, lateFee, discount, rate, overdueCount));
    }
}

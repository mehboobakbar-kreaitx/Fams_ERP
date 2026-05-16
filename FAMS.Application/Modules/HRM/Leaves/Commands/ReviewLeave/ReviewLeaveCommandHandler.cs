using FAMS.Application.Common.Exceptions;
using FAMS.Application.Common.Interfaces;
using FAMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Result = FAMS.Application.Common.Models.Result;

namespace FAMS.Application.Modules.HRM.Leaves.Commands.ReviewLeave;

public class ReviewLeaveCommandHandler : IRequestHandler<ReviewLeaveCommand, Result>
{
    private readonly IFamsDbContext _db;

    public ReviewLeaveCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result> Handle(ReviewLeaveCommand request, CancellationToken cancellationToken)
    {
        var leave = await _db.Leaves.FirstOrDefaultAsync(l => l.Id == request.LeaveId, cancellationToken)
            ?? throw new NotFoundException(nameof(Leave), request.LeaveId);

        if (request.Approved) leave.Approve(request.ReviewedById, request.Remarks);
        else leave.Reject(request.ReviewedById, request.Remarks);

        await _db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

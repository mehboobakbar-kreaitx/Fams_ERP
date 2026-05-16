using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Entities;
using MediatR;

namespace FAMS.Application.Modules.HRM.Leaves.Commands.ApplyLeave;

public class ApplyLeaveCommandHandler : IRequestHandler<ApplyLeaveCommand, Result<Guid>>
{
    private readonly IFamsDbContext _db;

    public ApplyLeaveCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<Guid>> Handle(ApplyLeaveCommand request, CancellationToken cancellationToken)
    {
        var leave = Leave.Create(request.StaffId, request.LeaveType, request.StartDate, request.EndDate, request.Reason);
        _db.Leaves.Add(leave);
        await _db.SaveChangesAsync(cancellationToken);
        return Result<Guid>.Success(leave.Id);
    }
}

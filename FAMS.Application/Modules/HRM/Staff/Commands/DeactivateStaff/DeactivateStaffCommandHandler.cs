using FAMS.Application.Common.Exceptions;
using FAMS.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Result = FAMS.Application.Common.Models.Result;
using StaffEntity = FAMS.Domain.Entities.Staff;

namespace FAMS.Application.Modules.HRM.Staff.Commands.DeactivateStaff;

public class DeactivateStaffCommandHandler : IRequestHandler<DeactivateStaffCommand, Result>
{
    private readonly IFamsDbContext _db;

    public DeactivateStaffCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result> Handle(DeactivateStaffCommand request, CancellationToken cancellationToken)
    {
        var staff = await _db.StaffMembers.FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(StaffEntity), request.Id);

        if (!staff.IsActive) return Result.Failure("Staff member is already inactive.");

        staff.Deactivate();
        await _db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

using FAMS.Application.Common.Exceptions;
using FAMS.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Result = FAMS.Application.Common.Models.Result;
using StaffEntity = FAMS.Domain.Entities.Staff;

namespace FAMS.Application.Modules.HRM.Staff.Commands.UpdateStaff;

public class UpdateStaffCommandHandler : IRequestHandler<UpdateStaffCommand, Result>
{
    private readonly IFamsDbContext _db;

    public UpdateStaffCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result> Handle(UpdateStaffCommand request, CancellationToken cancellationToken)
    {
        var staff = await _db.StaffMembers.FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(StaffEntity), request.Id);

        staff.Update(request.Designation, request.Department, request.BasicSalary, request.Photo);
        await _db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

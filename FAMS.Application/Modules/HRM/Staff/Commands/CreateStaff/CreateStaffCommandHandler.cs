using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;
using StaffEntity = FAMS.Domain.Entities.Staff;

namespace FAMS.Application.Modules.HRM.Staff.Commands.CreateStaff;

public class CreateStaffCommandHandler : IRequestHandler<CreateStaffCommand, Result<Guid>>
{
    private readonly IFamsDbContext _db;

    public CreateStaffCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<Guid>> Handle(CreateStaffCommand request, CancellationToken cancellationToken)
    {
        if (await _db.StaffMembers.AnyAsync(s => s.CNIC == request.CNIC, cancellationToken))
            return Result<Guid>.Failure($"A staff member with CNIC '{request.CNIC}' already exists.");

        if (await _db.StaffMembers.AnyAsync(s => s.Email == request.Email, cancellationToken))
            return Result<Guid>.Failure($"A staff member with email '{request.Email}' already exists.");

        var staff = StaffEntity.Create(
            request.FirstName, request.LastName, request.FatherName, request.CNIC,
            request.Phone, request.Email, request.DateOfBirth, request.Gender,
            request.JoiningDate, request.Designation, request.Department,
            request.Qualification, request.BasicSalary, request.EmploymentType);

        staff.CampusId = request.CampusId;
        _db.StaffMembers.Add(staff);
        await _db.SaveChangesAsync(cancellationToken);
        return Result<Guid>.Success(staff.Id);
    }
}

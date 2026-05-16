using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.HRM.Staff.Queries.GetStaffById;

public class GetStaffByIdQueryHandler : IRequestHandler<GetStaffByIdQuery, Result<StaffDetailDto>>
{
    private readonly IFamsDbContext _db;

    public GetStaffByIdQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<StaffDetailDto>> Handle(GetStaffByIdQuery request, CancellationToken cancellationToken)
    {
        var dto = await _db.StaffMembers.AsNoTracking()
            .Where(s => s.Id == request.Id)
            .Select(s => new StaffDetailDto(
                s.Id, s.CampusId, s.FirstName, s.LastName, s.FatherName, s.CNIC,
                s.Phone, s.Email, s.DateOfBirth, s.Gender, s.JoiningDate,
                s.Designation, s.Department, s.Qualification, s.EmploymentType,
                s.BasicSalary, s.IsActive, s.Photo))
            .FirstOrDefaultAsync(cancellationToken);

        return dto is null
            ? Result<StaffDetailDto>.Failure($"Staff member '{request.Id}' not found.")
            : Result<StaffDetailDto>.Success(dto);
    }
}

using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.HRM.Staff.Queries.GetStaffList;

public class GetStaffListQueryHandler
    : IRequestHandler<GetStaffListQuery, Result<PaginatedList<StaffListItemDto>>>
{
    private readonly IFamsDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetStaffListQueryHandler(IFamsDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Result<PaginatedList<StaffListItemDto>>> Handle(
        GetStaffListQuery request, CancellationToken cancellationToken)
    {
        if (_currentUser.SchoolId.HasValue &&
            !await _db.Campuses.AnyAsync(c => c.Id == request.CampusId, cancellationToken))
            return Result<PaginatedList<StaffListItemDto>>.Failure("Campus not found or not accessible.");

        var query = _db.StaffMembers.AsNoTracking()
            .Where(s => s.CampusId == request.CampusId);

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim().ToLower();
            query = query.Where(s =>
                s.FirstName.ToLower().Contains(term) ||
                s.LastName.ToLower().Contains(term) ||
                s.CNIC.Contains(term) ||
                s.Email.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(request.Department))
            query = query.Where(s => s.Department == request.Department);

        if (request.IsActive.HasValue)
            query = query.Where(s => s.IsActive == request.IsActive.Value);

        var projected = query
            .OrderBy(s => s.Department).ThenBy(s => s.LastName).ThenBy(s => s.FirstName)
            .Select(s => new StaffListItemDto(
                s.Id, s.FirstName, s.LastName, s.FirstName + " " + s.LastName,
                s.CNIC, s.Phone, s.Email, s.Gender, s.Designation, s.Department,
                s.EmploymentType, s.JoiningDate, s.BasicSalary, s.IsActive, s.Photo));

        var paged = await PaginatedList<StaffListItemDto>.CreateAsync(
            projected, request.PageNumber, request.PageSize, cancellationToken);

        return Result<PaginatedList<StaffListItemDto>>.Success(paged);
    }
}

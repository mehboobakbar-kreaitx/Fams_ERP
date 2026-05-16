using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.SuperAdmin.Schools.Queries.GetSchools;

public class GetSchoolsQueryHandler : IRequestHandler<GetSchoolsQuery, Result<PaginatedList<SchoolDto>>>
{
    private readonly IFamsDbContext _db;

    public GetSchoolsQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<PaginatedList<SchoolDto>>> Handle(GetSchoolsQuery request, CancellationToken cancellationToken)
    {
        var query = _db.Schools.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim().ToLower();
            query = query.Where(s =>
                s.Name.ToLower().Contains(term) ||
                s.Code.ToLower().Contains(term) ||
                s.City.ToLower().Contains(term));
        }

        if (request.IsActive.HasValue)
            query = query.Where(s => s.IsActive == request.IsActive.Value);

        var projected = query.OrderBy(s => s.Name).Select(s => new SchoolDto(
            s.Id,
            s.Name,
            s.Code,
            s.City,
            s.IsActive,
            _db.Campuses.Count(c => c.SchoolId == s.Id),
            _db.Students.Count(st => _db.Campuses.Any(c => c.SchoolId == s.Id && c.Id == st.CampusId)),
            _db.StaffMembers.Count(sf => _db.Campuses.Any(c => c.SchoolId == s.Id && c.Id == sf.CampusId)),
            s.LogoUrl));

        var result = await PaginatedList<SchoolDto>.CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken);
        return Result<PaginatedList<SchoolDto>>.Success(result);
    }
}

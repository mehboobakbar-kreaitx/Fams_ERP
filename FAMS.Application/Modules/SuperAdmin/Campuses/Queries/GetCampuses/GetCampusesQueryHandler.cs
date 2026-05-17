using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.SuperAdmin.Campuses.Queries.GetCampuses;

public class GetCampusesQueryHandler : IRequestHandler<GetCampusesQuery, Result<IReadOnlyList<CampusListItemDto>>>
{
    private readonly IFamsDbContext _db;

    public GetCampusesQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<IReadOnlyList<CampusListItemDto>>> Handle(GetCampusesQuery request, CancellationToken cancellationToken)
    {
        var rows = await _db.Campuses.AsNoTracking()
            .OrderByDescending(c => c.IsMainCampus)
            .ThenBy(c => c.Code)
            .Select(c => new CampusListItemDto(
                c.Id, c.SchoolId, c.Name, c.Code, c.City, c.PrincipalName, c.MaxCapacity, c.IsActive, c.IsMainCampus,
                _db.Students.Count(s => s.CampusId == c.Id &&
                    (s.Status == StudentStatus.Enrolled || s.Status == StudentStatus.Active)),
                _db.StaffMembers.Count(s => s.CampusId == c.Id && s.IsActive)))
            .ToListAsync(cancellationToken);

        return Result<IReadOnlyList<CampusListItemDto>>.Success(rows);
    }
}

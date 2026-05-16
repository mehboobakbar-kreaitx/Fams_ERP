using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.SuperAdmin.Schools.Queries.GetSchoolById;

public class GetSchoolByIdQueryHandler : IRequestHandler<GetSchoolByIdQuery, Result<SchoolDetailDto>>
{
    private readonly IFamsDbContext _db;

    public GetSchoolByIdQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<SchoolDetailDto>> Handle(GetSchoolByIdQuery request, CancellationToken cancellationToken)
    {
        var school = await _db.Schools
            .AsNoTracking()
            .Include(s => s.Campuses)
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        if (school is null)
            return Result<SchoolDetailDto>.Failure($"School {request.Id} not found.");

        var dto = new SchoolDetailDto(
            school.Id,
            school.Name,
            school.Code,
            school.City,
            school.Address,
            school.Phone,
            school.Email,
            school.Website,
            school.LogoUrl,
            school.IsActive,
            school.CreatedAt,
            school.Campuses
                .OrderBy(c => c.Code)
                .Select(c => new CampusSummaryDto(c.Id, c.Name, c.Code, c.City, c.IsActive, c.IsMainCampus))
                .ToList());

        return Result<SchoolDetailDto>.Success(dto);
    }
}

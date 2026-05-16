using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Admissions.Queries.GetApplications;

public class GetApplicationsQueryHandler : IRequestHandler<GetApplicationsQuery, Result<PaginatedList<ApplicationDto>>>
{
    private readonly IFamsDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetApplicationsQueryHandler(IFamsDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Result<PaginatedList<ApplicationDto>>> Handle(GetApplicationsQuery request, CancellationToken cancellationToken)
    {
        if (_currentUser.SchoolId.HasValue &&
            !await _db.Campuses.AnyAsync(c => c.Id == request.CampusId, cancellationToken))
            return Result<PaginatedList<ApplicationDto>>.Failure("Campus not found or not accessible.");

        var query = _db.Applications.AsNoTracking().Where(a => a.CampusId == request.CampusId);
        if (request.Status.HasValue) query = query.Where(a => a.Status == request.Status.Value);
        if (request.ProgramId.HasValue) query = query.Where(a => a.ProgramId == request.ProgramId.Value);

        var projected = query
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new ApplicationDto(a.Id, a.FirstName, a.LastName, a.Email, a.Phone,
                a.Status, a.TestMarks, a.Rank, a.CreatedAt));

        var paged = await PaginatedList<ApplicationDto>.CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken);
        return Result<PaginatedList<ApplicationDto>>.Success(paged);
    }
}

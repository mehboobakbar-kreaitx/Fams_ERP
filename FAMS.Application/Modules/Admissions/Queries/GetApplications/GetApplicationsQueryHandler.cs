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

        var projected =
            from a in query.OrderByDescending(a => a.CreatedAt)
            join p in _db.Programs on a.ProgramId equals p.Id into prog
            from p in prog.DefaultIfEmpty()
            select new ApplicationDto(
                a.Id,
                a.FirstName + " " + a.LastName,
                p != null ? p.Name : "—",
                a.Email,
                a.Phone,
                a.Status,
                a.CreatedAt,
                a.TestMarks,
                a.Rank);

        var paged = await PaginatedList<ApplicationDto>.CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken);
        return Result<PaginatedList<ApplicationDto>>.Success(paged);
    }
}

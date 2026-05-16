using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Platform.Config.Queries.GetAcademicTerms;

public class GetAcademicTermsQueryHandler
    : IRequestHandler<GetAcademicTermsQuery, Result<List<AcademicTermDto>>>
{
    private readonly IFamsDbContext _db;

    public GetAcademicTermsQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<List<AcademicTermDto>>> Handle(
        GetAcademicTermsQuery request, CancellationToken cancellationToken)
    {
        var terms = await _db.AcademicTerms.AsNoTracking()
            .OrderByDescending(t => t.StartDate)
            .Select(t => new AcademicTermDto(t.Id, t.Name, t.StartDate, t.EndDate, t.IsActive))
            .ToListAsync(cancellationToken);

        return Result<List<AcademicTermDto>>.Success(terms);
    }
}

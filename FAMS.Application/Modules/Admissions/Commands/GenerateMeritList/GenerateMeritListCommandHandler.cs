using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Admissions.Commands.GenerateMeritList;

public class GenerateMeritListCommandHandler : IRequestHandler<GenerateMeritListCommand, Result<List<MeritListEntry>>>
{
    private readonly IFamsDbContext _db;

    public GenerateMeritListCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<List<MeritListEntry>>> Handle(GenerateMeritListCommand request, CancellationToken cancellationToken)
    {
        var applications = await _db.Applications
            .Where(a => a.ProgramId == request.ProgramId
                && a.CampusId == request.CampusId
                && (a.Status == ApplicationStatus.UnderReview || a.Status == ApplicationStatus.Applied))
            .OrderByDescending(a => a.TestMarks)
            .ToListAsync(cancellationToken);

        var rank = 1;
        var list = new List<MeritListEntry>();
        foreach (var app in applications)
        {
            app.AssignRank(rank);
            list.Add(new MeritListEntry(app.Id, $"{app.FirstName} {app.LastName}", app.TestMarks, rank, app.Status.ToString()));
            rank++;
        }

        await _db.SaveChangesAsync(cancellationToken);
        return Result<List<MeritListEntry>>.Success(list);
    }
}

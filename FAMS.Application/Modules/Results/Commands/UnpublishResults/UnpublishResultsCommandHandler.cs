using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Results.Commands.UnpublishResults;

public class UnpublishResultsCommandHandler : IRequestHandler<UnpublishResultsCommand, Result<int>>
{
    private readonly IFamsDbContext _db;

    public UnpublishResultsCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<int>> Handle(UnpublishResultsCommand request, CancellationToken cancellationToken)
    {
        var results = await _db.Results
            .Where(r => r.SubjectId == request.SubjectId
                     && r.ExamType == request.ExamType
                     && r.TermName == request.TermName
                     && r.IsPublished)
            .ToListAsync(cancellationToken);

        if (results.Count == 0)
            return Result<int>.Failure("No published results found for the supplied subject/exam/term.");

        foreach (var r in results) r.Unpublish();
        await _db.SaveChangesAsync(cancellationToken);

        return Result<int>.Success(results.Count);
    }
}

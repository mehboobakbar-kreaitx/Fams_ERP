using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Results.Queries.GetStudentResults;

public class GetStudentResultsQueryHandler
    : IRequestHandler<GetStudentResultsQuery, Result<IReadOnlyList<StudentResultDto>>>
{
    private readonly IFamsDbContext _db;

    public GetStudentResultsQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<IReadOnlyList<StudentResultDto>>> Handle(
        GetStudentResultsQuery request, CancellationToken cancellationToken)
    {
        var query = _db.Results.AsNoTracking()
            .Where(r => r.StudentId == request.StudentId);

        if (request.PublishedOnly) query = query.Where(r => r.IsPublished);
        if (!string.IsNullOrWhiteSpace(request.TermName))
            query = query.Where(r => r.TermName == request.TermName);
        if (!string.IsNullOrWhiteSpace(request.ExamType))
            query = query.Where(r => r.ExamType == request.ExamType);

        var rows = await query
            .Join(_db.Subjects, r => r.SubjectId, s => s.Id,
                (r, s) => new StudentResultDto(
                    r.Id, r.StudentId, r.SubjectId, s.Name, s.Code,
                    r.ExamType, r.TermName, r.MarksObtained, r.TotalMarks,
                    r.TotalMarks == 0 ? 0 : Math.Round(r.MarksObtained / r.TotalMarks * 100m, 2),
                    r.Grade, r.Remarks, r.IsPublished, r.PublishedAt))
            .OrderBy(d => d.TermName).ThenBy(d => d.SubjectName)
            .ToListAsync(cancellationToken);

        return Result<IReadOnlyList<StudentResultDto>>.Success(rows);
    }
}

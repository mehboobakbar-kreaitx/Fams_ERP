using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Results.Queries.GetResultsAnalytics;

public class GetResultsAnalyticsQueryHandler
    : IRequestHandler<GetResultsAnalyticsQuery, Result<ResultsAnalyticsDto>>
{
    private readonly IFamsDbContext _db;

    public GetResultsAnalyticsQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<ResultsAnalyticsDto>> Handle(
        GetResultsAnalyticsQuery request, CancellationToken cancellationToken)
    {
        var rows = await _db.Results.AsNoTracking()
            .Where(r => r.SubjectId == request.SubjectId
                     && r.ExamType == request.ExamType
                     && r.TermName == request.TermName)
            .Select(r => new { r.MarksObtained, r.TotalMarks, r.Grade })
            .ToListAsync(cancellationToken);

        if (rows.Count == 0)
            return Result<ResultsAnalyticsDto>.Failure("No results found for the supplied subject/exam/term.");

        var percentages = rows
            .Select(r => r.TotalMarks == 0 ? 0m : Math.Round(r.MarksObtained / r.TotalMarks * 100m, 2))
            .ToList();

        var passCount = percentages.Count(p => p >= request.PassPercentageThreshold);
        var failCount = rows.Count - passCount;

        var subjectName = await _db.Subjects
            .Where(s => s.Id == request.SubjectId)
            .Select(s => s.Name)
            .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;

        var distribution = rows
            .GroupBy(r => r.Grade ?? "Ungraded")
            .Select(g => new GradeDistributionItem(g.Key, g.Count()))
            .OrderBy(g => g.Grade)
            .ToList();

        var dto = new ResultsAnalyticsDto(
            request.SubjectId,
            request.ExamType,
            request.TermName,
            rows.Count,
            passCount,
            failCount,
            rows.Count == 0 ? 0 : Math.Round((decimal)passCount / rows.Count * 100m, 2),
            Math.Round(percentages.Average(), 2),
            percentages.Max(),
            percentages.Min(),
            distribution);

        _ = subjectName;
        return Result<ResultsAnalyticsDto>.Success(dto);
    }
}

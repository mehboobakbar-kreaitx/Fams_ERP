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
        var baseQuery = _db.Results.AsNoTracking()
            .Where(r => r.SubjectId == request.SubjectId
                     && r.ExamType == request.ExamType
                     && r.TermName == request.TermName);

        if (request.CampusId.HasValue)
            baseQuery = baseQuery.Where(r => r.CampusId == request.CampusId.Value);

        // Pull grade distribution from DB using SQL GROUP BY — avoids loading all rows into memory.
        var distribution = await baseQuery
            .GroupBy(r => r.Grade ?? "Ungraded")
            .Select(g => new GradeDistributionItem(g.Key, g.Count()))
            .OrderBy(g => g.Grade)
            .ToListAsync(cancellationToken);

        var totalStudents = distribution.Sum(d => d.Count);
        if (totalStudents == 0)
            return Result<ResultsAnalyticsDto>.Failure("No results found for the supplied subject/exam/term.");

        // Compute aggregate statistics (AVG/MAX/MIN) in the database — avoids O(n) memory load.
        var stats = await baseQuery
            .Select(r => r.TotalMarks == 0 ? 0m : r.MarksObtained / r.TotalMarks * 100m)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Avg = g.Average(),
                Max = g.Max(),
                Min = g.Min(),
            })
            .FirstOrDefaultAsync(cancellationToken);

        // Pass count still requires per-row percentage comparison; do it with a targeted DB query.
        var passCount = await baseQuery
            .CountAsync(r => r.TotalMarks > 0
                && r.MarksObtained / r.TotalMarks * 100m >= request.PassPercentageThreshold,
                cancellationToken);
        var failCount = totalStudents - passCount;

        var dto = new ResultsAnalyticsDto(
            request.SubjectId,
            request.ExamType,
            request.TermName,
            totalStudents,
            passCount,
            failCount,
            totalStudents == 0 ? 0 : Math.Round((decimal)passCount / totalStudents * 100m, 2),
            Math.Round(stats?.Avg ?? 0m, 2),
            Math.Round(stats?.Max ?? 0m, 2),
            Math.Round(stats?.Min ?? 0m, 2),
            distribution);

        return Result<ResultsAnalyticsDto>.Success(dto);
    }
}

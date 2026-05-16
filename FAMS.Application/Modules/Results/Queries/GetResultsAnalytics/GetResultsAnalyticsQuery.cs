using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Results.Queries.GetResultsAnalytics;

public record GetResultsAnalyticsQuery(
    Guid SubjectId,
    string ExamType,
    string TermName,
    decimal PassPercentageThreshold = 40m) : IRequest<Result<ResultsAnalyticsDto>>;

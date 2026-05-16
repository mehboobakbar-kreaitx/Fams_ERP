namespace FAMS.Application.Modules.Results.Queries.GetResultsAnalytics;

public record GradeDistributionItem(string Grade, int Count);

public record SubjectAverageItem(Guid SubjectId, string SubjectName, decimal AveragePercentage);

public record ResultsAnalyticsDto(
    Guid SubjectId,
    string ExamType,
    string TermName,
    int TotalStudents,
    int PassCount,
    int FailCount,
    decimal PassPercentage,
    decimal AveragePercentage,
    decimal HighestPercentage,
    decimal LowestPercentage,
    IReadOnlyList<GradeDistributionItem> GradeDistribution);

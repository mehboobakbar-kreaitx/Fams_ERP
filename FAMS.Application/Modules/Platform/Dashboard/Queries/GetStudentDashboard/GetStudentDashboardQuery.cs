using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Platform.Dashboard.Queries.GetStudentDashboard;

public record UpcomingClass(
    string SubjectName,
    DayOfWeek Day,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string TeacherName,
    string? Room);

public record StudentResultSummary(
    string SubjectName,
    string TermName,
    decimal Percentage,
    string? Grade);

public record StudentDashboardDto(
    Guid StudentId,
    string StudentName,
    string RollNumber,
    string ClassName,
    string SectionName,
    decimal AttendancePercentLast30Days,
    decimal CurrentFeeBalance,
    int PublishedResultsThisTerm,
    IReadOnlyList<UpcomingClass> TodaysClasses,
    IReadOnlyList<StudentResultSummary> LatestResults);

public record GetStudentDashboardQuery(Guid StudentId) : IRequest<Result<StudentDashboardDto>>;

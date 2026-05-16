using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Platform.Dashboard.Queries.GetTeacherDashboard;

public record TodayClass(
    Guid SubjectId,
    string SubjectName,
    Guid SectionId,
    string SectionName,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string? Room);

public record TeacherDashboardDto(
    Guid StaffId,
    string TeacherName,
    int MySectionsCount,
    int MyStudentsCount,
    decimal MyAverageAttendanceLast30Days,
    int PendingLeaves,
    IReadOnlyList<TodayClass> TodaysClasses);

public record GetTeacherDashboardQuery(Guid StaffId) : IRequest<Result<TeacherDashboardDto>>;

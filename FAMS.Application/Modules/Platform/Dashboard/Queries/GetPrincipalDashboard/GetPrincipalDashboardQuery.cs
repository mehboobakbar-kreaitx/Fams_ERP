using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Platform.Dashboard.Queries.GetPrincipalDashboard;

public record RecentAdmission(Guid StudentId, string Name, string RollNumber, DateTime EnrollmentDate);

public record PrincipalDashboardDto(
    int TotalStudents,
    int TotalStaff,
    int ActiveClasses,
    decimal TodayAttendancePercent,
    decimal OutstandingFees,
    int PendingLeaves,
    int OpenApplications,
    int PublishedExamsThisTerm,
    IReadOnlyList<RecentAdmission> RecentAdmissions);

public record GetPrincipalDashboardQuery(Guid CampusId) : IRequest<Result<PrincipalDashboardDto>>;

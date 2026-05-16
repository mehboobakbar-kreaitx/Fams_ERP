using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Platform.Dashboard.Queries.GetExecutiveDashboard;

public record CampusKpi(
    Guid CampusId,
    string CampusName,
    int EnrolledStudents,
    int ActiveStaff,
    decimal MonthlyRevenue,
    decimal OutstandingFees);

public record ExecutiveDashboardDto(
    int TotalCampuses,
    int TotalEnrolledStudents,
    int TotalActiveStaff,
    int TotalApplicationsThisMonth,
    decimal TotalMonthlyRevenue,
    decimal TotalOutstandingFees,
    IReadOnlyList<CampusKpi> CampusBreakdown);

public record GetExecutiveDashboardQuery() : IRequest<Result<ExecutiveDashboardDto>>;

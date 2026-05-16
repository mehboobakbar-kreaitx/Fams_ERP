using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Platform.Dashboard.Queries.GetParentDashboard;

public record ChildSummary(
    Guid StudentId,
    string Name,
    string RollNumber,
    string ClassName,
    string SectionName,
    decimal AttendancePercentLast30Days,
    decimal FeeBalance,
    int PublishedResultsThisTerm);

public record ParentDashboardDto(
    Guid ParentId,
    string ParentName,
    int ChildrenCount,
    decimal TotalOutstandingFees,
    IReadOnlyList<ChildSummary> Children);

public record GetParentDashboardQuery(Guid ParentId) : IRequest<Result<ParentDashboardDto>>;

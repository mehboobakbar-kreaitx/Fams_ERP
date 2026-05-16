using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.HRM.Leaves.Queries.GetLeaves;

public record GetLeavesQuery(
    Guid CampusId,
    Guid? StaffId = null,
    string? Status = null,
    int PageNumber = 1,
    int PageSize = 20) : IRequest<Result<PaginatedList<LeaveDto>>>;

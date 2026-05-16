using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.HRM.Staff.Queries.GetStaffList;

public record GetStaffListQuery(
    Guid CampusId,
    int PageNumber = 1,
    int PageSize = 20,
    string? SearchTerm = null,
    string? Department = null,
    bool? IsActive = null) : IRequest<Result<PaginatedList<StaffListItemDto>>>;

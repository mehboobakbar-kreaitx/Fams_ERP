using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.SuperAdmin.Schools.Queries.GetSchools;

public record GetSchoolsQuery(
    int PageNumber = 1,
    int PageSize = 20,
    string? Search = null,
    bool? IsActive = null) : IRequest<Result<PaginatedList<SchoolDto>>>;

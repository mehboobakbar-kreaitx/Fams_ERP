using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;

namespace FAMS.Application.Modules.Admissions.Queries.GetApplications;

public record GetApplicationsQuery(
    Guid CampusId,
    ApplicationStatus? Status = null,
    Guid? ProgramId = null,
    int PageNumber = 1,
    int PageSize = 20) : IRequest<Result<PaginatedList<ApplicationDto>>>;

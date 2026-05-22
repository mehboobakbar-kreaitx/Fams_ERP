using FAMS.Application.Common.Models;
using FAMS.Application.Common.Security;
using MediatR;

namespace FAMS.Application.Modules.SuperAdmin.Campuses.Queries.GetCampuses;

[Authorize(Roles = "SystemAdmin,Executive")]
public record GetCampusesQuery() : IRequest<Result<IReadOnlyList<CampusListItemDto>>>;

using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.SuperAdmin.Campuses.Queries.GetCampuses;

public record GetCampusesQuery() : IRequest<Result<IReadOnlyList<CampusListItemDto>>>;

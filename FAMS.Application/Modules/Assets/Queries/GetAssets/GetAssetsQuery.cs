using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;

namespace FAMS.Application.Modules.Assets.Queries.GetAssets;

public record GetAssetsQuery(
    Guid CampusId,
    string? Category = null,
    AssetStatus? Status = null,
    int PageNumber = 1,
    int PageSize = 50) : IRequest<Result<PaginatedList<AssetDto>>>;

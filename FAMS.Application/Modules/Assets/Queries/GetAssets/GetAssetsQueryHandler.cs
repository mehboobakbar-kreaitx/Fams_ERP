using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Assets.Queries.GetAssets;

public class GetAssetsQueryHandler : IRequestHandler<GetAssetsQuery, Result<PaginatedList<AssetDto>>>
{
    private readonly IFamsDbContext _db;
    public GetAssetsQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<PaginatedList<AssetDto>>> Handle(GetAssetsQuery request, CancellationToken cancellationToken)
    {
        var query = _db.Assets.AsNoTracking().Where(a => a.CampusId == request.CampusId);
        if (!string.IsNullOrWhiteSpace(request.Category)) query = query.Where(a => a.Category == request.Category);
        if (request.Status.HasValue) query = query.Where(a => a.Status == request.Status.Value);

        var projected = query
            .OrderBy(a => a.Name)
            .Select(a => new AssetDto(a.Id, a.Name, a.AssetCode, a.Category, a.PurchaseDate,
                a.PurchasePrice, a.CurrentValue, a.Status, a.Location, a.SerialNumber,
                a.WarrantyExpiry, a.LastMaintenanceDate));

        var paged = await PaginatedList<AssetDto>.CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken);
        return Result<PaginatedList<AssetDto>>.Success(paged);
    }
}

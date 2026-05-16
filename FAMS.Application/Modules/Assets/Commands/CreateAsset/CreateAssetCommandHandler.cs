using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Assets.Commands.CreateAsset;

public class CreateAssetCommandHandler : IRequestHandler<CreateAssetCommand, Result<Guid>>
{
    private readonly IFamsDbContext _db;
    public CreateAssetCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<Guid>> Handle(CreateAssetCommand request, CancellationToken cancellationToken)
    {
        var exists = await _db.Assets.AnyAsync(a => a.AssetCode == request.AssetCode, cancellationToken);
        if (exists) return Result<Guid>.Failure($"Asset code '{request.AssetCode}' already exists.");

        var asset = Asset.Create(request.Name, request.AssetCode, request.Category, request.PurchaseDate,
            request.PurchasePrice, request.Location, request.SerialNumber, request.WarrantyExpiry, request.CustodianId);
        _db.Assets.Add(asset);
        await _db.SaveChangesAsync(cancellationToken);
        return Result<Guid>.Success(asset.Id);
    }
}

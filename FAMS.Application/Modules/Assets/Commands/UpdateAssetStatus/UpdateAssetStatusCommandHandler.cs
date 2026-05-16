using FAMS.Application.Common.Exceptions;
using FAMS.Application.Common.Interfaces;
using FAMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Result = FAMS.Application.Common.Models.Result;

namespace FAMS.Application.Modules.Assets.Commands.UpdateAssetStatus;

public class UpdateAssetStatusCommandHandler : IRequestHandler<UpdateAssetStatusCommand, Result>
{
    private readonly IFamsDbContext _db;
    public UpdateAssetStatusCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result> Handle(UpdateAssetStatusCommand request, CancellationToken cancellationToken)
    {
        var asset = await _db.Assets.FirstOrDefaultAsync(a => a.Id == request.AssetId, cancellationToken)
            ?? throw new NotFoundException(nameof(Asset), request.AssetId);
        asset.ChangeStatus(request.NewStatus);
        await _db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

public class RecordMaintenanceCommandHandler : IRequestHandler<RecordMaintenanceCommand, Result>
{
    private readonly IFamsDbContext _db;
    public RecordMaintenanceCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result> Handle(RecordMaintenanceCommand request, CancellationToken cancellationToken)
    {
        var asset = await _db.Assets.FirstOrDefaultAsync(a => a.Id == request.AssetId, cancellationToken)
            ?? throw new NotFoundException(nameof(Asset), request.AssetId);
        asset.RecordMaintenance();
        await _db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}

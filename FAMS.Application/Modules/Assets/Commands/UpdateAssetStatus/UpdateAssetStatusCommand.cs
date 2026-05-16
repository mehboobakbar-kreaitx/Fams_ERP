using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;

namespace FAMS.Application.Modules.Assets.Commands.UpdateAssetStatus;

public record UpdateAssetStatusCommand(Guid AssetId, AssetStatus NewStatus) : IRequest<Result>;

public record RecordMaintenanceCommand(Guid AssetId) : IRequest<Result>;

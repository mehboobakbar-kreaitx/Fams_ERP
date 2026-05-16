using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Assets.Commands.CreateAsset;

public record CreateAssetCommand(
    string Name,
    string AssetCode,
    string Category,
    DateTime PurchaseDate,
    decimal PurchasePrice,
    string Location,
    string? SerialNumber = null,
    DateTime? WarrantyExpiry = null,
    Guid? CustodianId = null) : IRequest<Result<Guid>>;

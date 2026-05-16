using FAMS.Domain.Enums;

namespace FAMS.Application.Modules.Assets.Queries.GetAssets;

public record AssetDto(
    Guid Id,
    string Name,
    string AssetCode,
    string Category,
    DateTime PurchaseDate,
    decimal PurchasePrice,
    decimal CurrentValue,
    AssetStatus Status,
    string Location,
    string? SerialNumber,
    DateTime? WarrantyExpiry,
    DateTime? LastMaintenanceDate);

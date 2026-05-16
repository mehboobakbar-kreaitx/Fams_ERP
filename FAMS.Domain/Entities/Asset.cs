using FAMS.Domain.Common;
using FAMS.Domain.Enums;

namespace FAMS.Domain.Entities;

public class Asset : BaseAuditableEntity
{
    public string Name { get; private set; } = string.Empty;
    public string AssetCode { get; private set; } = string.Empty;
    public string Category { get; private set; } = string.Empty;
    public DateTime PurchaseDate { get; private set; }
    public decimal PurchasePrice { get; private set; }
    public decimal CurrentValue { get; private set; }
    public AssetStatus Status { get; private set; } = AssetStatus.Active;
    public string Location { get; private set; } = string.Empty;
    public Guid? CustodianId { get; private set; }
    public string? SerialNumber { get; private set; }
    public DateTime? WarrantyExpiry { get; private set; }
    public DateTime? LastMaintenanceDate { get; private set; }

    private Asset() { }

    public static Asset Create(string name, string assetCode, string category, DateTime purchaseDate,
        decimal purchasePrice, string location, string? serialNumber = null,
        DateTime? warrantyExpiry = null, Guid? custodianId = null)
    {
        return new Asset
        {
            Name = name,
            AssetCode = assetCode,
            Category = category,
            PurchaseDate = purchaseDate,
            PurchasePrice = purchasePrice,
            CurrentValue = purchasePrice,
            Status = AssetStatus.Active,
            Location = location,
            CustodianId = custodianId,
            SerialNumber = serialNumber,
            WarrantyExpiry = warrantyExpiry
        };
    }

    public void RecordMaintenance() => LastMaintenanceDate = DateTime.UtcNow;
    public void ChangeStatus(AssetStatus newStatus) => Status = newStatus;
    public void UpdateValue(decimal newValue) => CurrentValue = newValue;
    public void AssignCustodian(Guid custodianId) => CustodianId = custodianId;
}

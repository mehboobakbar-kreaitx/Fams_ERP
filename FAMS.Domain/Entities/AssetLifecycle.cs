using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class AssetMaintenanceEvent : BaseAuditableEntity
{
    public Guid AssetId { get; private set; }
    public DateTime EventDate { get; private set; }
    public string EventType { get; private set; } = string.Empty; // Repair/Service/Inspection
    public decimal Cost { get; private set; }
    public string? Notes { get; private set; }

    public Asset Asset { get; private set; } = null!;

    private AssetMaintenanceEvent() { }
    public static AssetMaintenanceEvent Create(Guid assetId, DateTime date, string eventType, decimal cost, string? notes)
        => new() { AssetId = assetId, EventDate = DateTime.SpecifyKind(date, DateTimeKind.Utc), EventType = eventType, Cost = cost, Notes = notes };
}

public class AssetDepreciation : BaseAuditableEntity
{
    public Guid AssetId { get; private set; }
    public DateTime CalculatedAt { get; private set; }
    public decimal DepreciationAmount { get; private set; }
    public decimal AccumulatedDepreciation { get; private set; }
    public decimal NetBookValue { get; private set; }
    public string Method { get; private set; } = "StraightLine";

    public Asset Asset { get; private set; } = null!;

    private AssetDepreciation() { }
    public static AssetDepreciation Create(Guid assetId, decimal depAmount, decimal accumulated, decimal nbv, string method = "StraightLine")
        => new()
        {
            AssetId = assetId,
            CalculatedAt = DateTime.UtcNow,
            DepreciationAmount = depAmount,
            AccumulatedDepreciation = accumulated,
            NetBookValue = nbv,
            Method = method,
        };
}

public class AssetAllocation : BaseAuditableEntity
{
    public Guid AssetId { get; private set; }
    public Guid AllocatedToStaffId { get; private set; }
    public DateTime AllocatedAt { get; private set; }
    public DateTime? ReturnedAt { get; private set; }
    public string? Notes { get; private set; }

    public Asset Asset { get; private set; } = null!;
    public Staff AllocatedTo { get; private set; } = null!;

    private AssetAllocation() { }
    public static AssetAllocation Create(Guid assetId, Guid staffId, string? notes)
        => new()
        {
            AssetId = assetId,
            AllocatedToStaffId = staffId,
            AllocatedAt = DateTime.UtcNow,
            Notes = notes,
        };
    public void MarkReturned() => ReturnedAt = DateTime.UtcNow;
}

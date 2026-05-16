using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class InventoryItem : BaseAuditableEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Category { get; private set; } = string.Empty;
    public string Unit { get; private set; } = "Each";
    public decimal CurrentStock { get; private set; }
    public decimal ReorderPoint { get; private set; }
    public decimal UnitPrice { get; private set; }
    public bool IsActive { get; private set; } = true;

    private InventoryItem() { }

    public static InventoryItem Create(string name, string category, string unit, decimal openingStock, decimal reorderPoint, decimal unitPrice)
        => new()
        {
            Name = name,
            Category = category,
            Unit = unit,
            CurrentStock = openingStock,
            ReorderPoint = reorderPoint,
            UnitPrice = unitPrice,
            IsActive = true,
        };

    public void Adjust(decimal delta) => CurrentStock += delta;
    public bool BelowReorderPoint() => CurrentStock <= ReorderPoint;
}

public enum StockTransactionType { Receipt = 1, Issue = 2, Return = 3, Adjustment = 4 }

public class StockTransaction : BaseAuditableEntity
{
    public Guid ItemId { get; private set; }
    public StockTransactionType Type { get; private set; }
    public decimal Quantity { get; private set; }
    public string? Department { get; private set; }
    public Guid RequestedById { get; private set; }
    public string? Notes { get; private set; }

    public InventoryItem Item { get; private set; } = null!;

    private StockTransaction() { }

    public static StockTransaction Create(Guid itemId, StockTransactionType type, decimal quantity, Guid requestedById, string? department = null, string? notes = null)
        => new()
        {
            ItemId = itemId,
            Type = type,
            Quantity = quantity,
            Department = department,
            RequestedById = requestedById,
            Notes = notes,
        };
}

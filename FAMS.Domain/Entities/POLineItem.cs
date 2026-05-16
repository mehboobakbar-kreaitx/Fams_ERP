using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class POLineItem : BaseAuditableEntity
{
    public Guid POId { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public decimal Quantity { get; private set; }
    public decimal UnitPrice { get; private set; }
    public decimal TotalPrice { get; private set; }
    public string Unit { get; private set; } = "pcs";

    public PurchaseOrder PurchaseOrder { get; private set; } = null!;

    private POLineItem() { }

    public static POLineItem Create(Guid poId, string description, decimal quantity, decimal unitPrice, string unit = "pcs")
    {
        return new POLineItem
        {
            POId = poId,
            Description = description,
            Quantity = quantity,
            UnitPrice = unitPrice,
            TotalPrice = quantity * unitPrice,
            Unit = unit
        };
    }
}

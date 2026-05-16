using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class GoodsReceipt : BaseAuditableEntity
{
    public string ReceiptNumber { get; private set; } = string.Empty;
    public Guid PurchaseOrderId { get; private set; }
    public Guid ReceivedById { get; private set; }
    public DateTime ReceivedAt { get; private set; }
    public string? Notes { get; private set; }
    public string? DeliveryNoteRef { get; private set; }

    public PurchaseOrder PurchaseOrder { get; private set; } = null!;
    public ICollection<GoodsReceiptLineItem> LineItems { get; private set; } = new List<GoodsReceiptLineItem>();

    private GoodsReceipt() { }

    public static GoodsReceipt Create(string receiptNumber, Guid purchaseOrderId,
        Guid receivedById, string? deliveryNoteRef = null, string? notes = null)
    {
        return new GoodsReceipt
        {
            ReceiptNumber = receiptNumber,
            PurchaseOrderId = purchaseOrderId,
            ReceivedById = receivedById,
            ReceivedAt = DateTime.UtcNow,
            DeliveryNoteRef = deliveryNoteRef,
            Notes = notes
        };
    }
}

public class GoodsReceiptLineItem : BaseAuditableEntity
{
    public Guid GoodsReceiptId { get; private set; }
    public Guid POLineItemId { get; private set; }
    public decimal QuantityReceived { get; private set; }
    public decimal QuantityRejected { get; private set; }
    public string? Condition { get; private set; }

    public GoodsReceipt GoodsReceipt { get; private set; } = null!;
    public POLineItem POLineItem { get; private set; } = null!;

    private GoodsReceiptLineItem() { }

    public static GoodsReceiptLineItem Create(Guid goodsReceiptId, Guid poLineItemId,
        decimal quantityReceived, decimal quantityRejected = 0, string? condition = null)
    {
        if (quantityReceived < 0) throw new ArgumentException("QuantityReceived cannot be negative.");
        if (quantityRejected < 0) throw new ArgumentException("QuantityRejected cannot be negative.");
        return new GoodsReceiptLineItem
        {
            GoodsReceiptId = goodsReceiptId,
            POLineItemId = poLineItemId,
            QuantityReceived = quantityReceived,
            QuantityRejected = quantityRejected,
            Condition = condition
        };
    }
}

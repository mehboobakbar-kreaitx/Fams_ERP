namespace FAMS.Application.Modules.Procurement.GoodsReceipts.Queries.GetGoodsReceipts;

public record GoodsReceiptLineItemDto(
    Guid Id,
    Guid POLineItemId,
    string Description,
    decimal QuantityOrdered,
    decimal QuantityReceived,
    decimal QuantityRejected,
    string? Condition);

public record GoodsReceiptDto(
    Guid Id,
    string ReceiptNumber,
    Guid PurchaseOrderId,
    string PurchaseOrderNumber,
    Guid ReceivedById,
    string ReceiverName,
    DateTime ReceivedAt,
    string? DeliveryNoteRef,
    string? Notes,
    IReadOnlyList<GoodsReceiptLineItemDto> Lines);

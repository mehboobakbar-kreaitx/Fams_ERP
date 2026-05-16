using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Procurement.GoodsReceipts.Commands.RecordGoodsReceipt;

public record GoodsReceiptLineInput(
    Guid POLineItemId,
    decimal QuantityReceived,
    decimal QuantityRejected,
    string? Condition);

public record RecordGoodsReceiptCommand(
    Guid PurchaseOrderId,
    Guid ReceivedById,
    string? DeliveryNoteRef,
    string? Notes,
    IReadOnlyList<GoodsReceiptLineInput> Lines) : IRequest<Result<Guid>>;

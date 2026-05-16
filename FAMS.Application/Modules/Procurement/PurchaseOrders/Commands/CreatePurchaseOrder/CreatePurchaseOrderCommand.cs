using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Procurement.PurchaseOrders.Commands.CreatePurchaseOrder;

public record POLineItemInput(string Description, decimal Quantity, decimal UnitPrice, string Unit);

public record CreatePurchaseOrderCommand(
    Guid VendorId,
    DateTime? ExpectedDelivery,
    List<POLineItemInput> LineItems,
    string? Notes = null) : IRequest<Result<Guid>>;

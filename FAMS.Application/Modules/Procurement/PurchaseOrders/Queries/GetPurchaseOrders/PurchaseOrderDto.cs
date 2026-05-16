namespace FAMS.Application.Modules.Procurement.PurchaseOrders.Queries.GetPurchaseOrders;

public record PurchaseOrderDto(
    Guid Id,
    string PONumber,
    Guid VendorId,
    string VendorName,
    DateTime OrderDate,
    DateTime? ExpectedDelivery,
    decimal TotalAmount,
    string Status,
    int LineItemCount);

using FAMS.Domain.Enums;

namespace FAMS.Application.Modules.Procurement.Requisitions.Queries.GetRequisitions;

public record RequisitionLineItemDto(
    Guid Id,
    string Description,
    decimal Quantity,
    decimal EstimatedUnitPrice,
    string Unit,
    decimal LineTotal);

public record RequisitionDto(
    Guid Id,
    string RequisitionNumber,
    Guid RequestedById,
    string RequesterName,
    string Department,
    string Justification,
    DateTime? NeededBy,
    decimal EstimatedTotal,
    RequisitionStatus Status,
    DateTime? ReviewedAt,
    string? ReviewNotes,
    Guid? LinkedPurchaseOrderId,
    DateTime CreatedAt,
    IReadOnlyList<RequisitionLineItemDto> LineItems);

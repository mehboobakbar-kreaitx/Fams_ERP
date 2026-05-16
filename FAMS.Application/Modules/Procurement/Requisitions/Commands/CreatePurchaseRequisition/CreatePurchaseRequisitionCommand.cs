using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Procurement.Requisitions.Commands.CreatePurchaseRequisition;

public record RequisitionLineItemInput(
    string Description,
    decimal Quantity,
    decimal EstimatedUnitPrice,
    string Unit);

public record CreatePurchaseRequisitionCommand(
    Guid RequestedById,
    string Department,
    string Justification,
    DateTime? NeededBy,
    IReadOnlyList<RequisitionLineItemInput> LineItems) : IRequest<Result<Guid>>;

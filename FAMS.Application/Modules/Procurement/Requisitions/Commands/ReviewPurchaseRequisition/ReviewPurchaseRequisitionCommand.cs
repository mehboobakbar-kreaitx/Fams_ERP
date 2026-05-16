using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Procurement.Requisitions.Commands.ReviewPurchaseRequisition;

public record ReviewPurchaseRequisitionCommand(
    Guid RequisitionId,
    Guid ReviewerId,
    bool Approved,
    string? Notes) : IRequest<Result>;

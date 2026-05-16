using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Procurement.PurchaseOrders.Commands.ApprovePurchaseOrder;

public record ApprovePurchaseOrderCommand(Guid PurchaseOrderId, Guid ApprovedById) : IRequest<Result>;

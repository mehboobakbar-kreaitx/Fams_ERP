using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;

namespace FAMS.Application.Modules.Procurement.Requisitions.Queries.GetRequisitions;

public record GetRequisitionsQuery(
    Guid CampusId,
    RequisitionStatus? Status = null,
    Guid? RequestedById = null,
    int PageNumber = 1,
    int PageSize = 20) : IRequest<Result<PaginatedList<RequisitionDto>>>;

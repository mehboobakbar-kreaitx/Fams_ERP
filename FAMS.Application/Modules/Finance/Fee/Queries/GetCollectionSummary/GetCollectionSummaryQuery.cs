using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Finance.Fee.Queries.GetCollectionSummary;

public record GetCollectionSummaryQuery(Guid CampusId, string? TermName = null) : IRequest<Result<CollectionSummaryDto>>;

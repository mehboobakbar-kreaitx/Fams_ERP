using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Platform.Config.Queries.GetFeeStructures;

public record GetFeeStructuresQuery : IRequest<Result<List<FeeStructureDto>>>;

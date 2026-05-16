using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Platform.Config.Queries.GetGradingScale;

public record GetGradingScaleQuery : IRequest<Result<GradingScaleDto>>;

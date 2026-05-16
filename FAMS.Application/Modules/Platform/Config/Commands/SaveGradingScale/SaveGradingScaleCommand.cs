using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Platform.Config.Commands.SaveGradingScale;

public record SaveGradingScaleCommand(
    List<GradingRuleInput> Rules) : IRequest<Result>;

public record GradingRuleInput(
    string Grade,
    decimal MinPercent,
    decimal MaxPercent,
    decimal GpaPoint);

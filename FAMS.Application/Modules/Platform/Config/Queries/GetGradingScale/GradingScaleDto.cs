namespace FAMS.Application.Modules.Platform.Config.Queries.GetGradingScale;

public record GradingScaleDto(
    Guid? ScaleId,
    IReadOnlyList<GradingRuleDto> Rules);

public record GradingRuleDto(
    Guid? Id,
    string Grade,
    decimal MinPercent,
    decimal MaxPercent,
    decimal GpaPoint);

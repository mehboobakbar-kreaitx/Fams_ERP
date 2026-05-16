namespace FAMS.Application.Modules.Platform.Config.Queries.GetFeeStructures;

public record FeeStructureDto(
    Guid Id,
    string TermName,
    string ProgramName,
    decimal TotalAmount,
    bool IsActive,
    IReadOnlyList<FeeHeadDto> Heads);

public record FeeHeadDto(
    Guid Id,
    string Name,
    decimal Amount,
    int DueDayOfMonth);

namespace FAMS.Application.Modules.Platform.Config.Queries.GetAcademicTerms;

public record AcademicTermDto(
    Guid Id,
    string Name,
    DateTime StartDate,
    DateTime EndDate,
    bool IsActive);

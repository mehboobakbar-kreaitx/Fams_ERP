using FAMS.Domain.Enums;

namespace FAMS.Application.Modules.Admissions.Queries.GetApplications;

public record ApplicationDto(
    Guid Id,
    string CandidateName,
    string ProgramName,
    string Email,
    string Phone,
    ApplicationStatus Status,
    DateTime SubmittedOn,
    decimal? Score,
    int? Rank);

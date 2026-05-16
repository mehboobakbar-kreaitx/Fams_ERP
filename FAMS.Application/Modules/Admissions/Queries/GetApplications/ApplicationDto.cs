using FAMS.Domain.Enums;

namespace FAMS.Application.Modules.Admissions.Queries.GetApplications;

public record ApplicationDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    string Phone,
    ApplicationStatus Status,
    decimal? TestMarks,
    int? Rank,
    DateTime CreatedAt);

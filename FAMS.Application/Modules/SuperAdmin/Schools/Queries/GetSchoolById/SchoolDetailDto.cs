namespace FAMS.Application.Modules.SuperAdmin.Schools.Queries.GetSchoolById;

public record SchoolDetailDto(
    Guid Id,
    string Name,
    string Code,
    string City,
    string? Address,
    string? Phone,
    string? Email,
    string? Website,
    string? LogoUrl,
    bool IsActive,
    DateTime CreatedAt,
    IReadOnlyList<CampusSummaryDto> Campuses);

public record CampusSummaryDto(
    Guid Id,
    string Name,
    string Code,
    string City,
    bool IsActive,
    bool IsMainCampus);

namespace FAMS.Application.Modules.SuperAdmin.Schools.Queries.GetSchools;

public record SchoolDto(
    Guid Id,
    string Name,
    string Code,
    string City,
    bool IsActive,
    int CampusCount,
    int StudentCount,
    int StaffCount,
    string? LogoUrl);

namespace FAMS.Application.Modules.SuperAdmin.Campuses.Queries.GetCampuses;

public record CampusListItemDto(
    Guid Id,
    string Name,
    string Code,
    string City,
    string PrincipalName,
    int MaxCapacity,
    bool IsActive,
    bool IsMainCampus,
    int EnrolledStudents,
    int ActiveStaff);

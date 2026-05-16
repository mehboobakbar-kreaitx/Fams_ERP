namespace FAMS.Application.Modules.SuperAdmin.Schools.Commands.CreateSchool;

public record CreateSchoolResult(
    Guid SchoolId,
    string AdminEmail,
    string AdminPassword);

using FAMS.Domain.Enums;

namespace FAMS.Application.Modules.HRM.Staff.Queries.GetStaffById;

public record StaffDetailDto(
    Guid Id,
    Guid CampusId,
    string FirstName,
    string LastName,
    string FatherName,
    string CNIC,
    string Phone,
    string Email,
    DateTime DateOfBirth,
    Gender Gender,
    DateTime JoiningDate,
    string Designation,
    string Department,
    string Qualification,
    string EmploymentType,
    decimal BasicSalary,
    bool IsActive,
    string? Photo);

using FAMS.Domain.Enums;

namespace FAMS.Application.Modules.HRM.Staff.Queries.GetStaffList;

public record StaffListItemDto(
    Guid Id,
    string FirstName,
    string LastName,
    string FullName,
    string CNIC,
    string Phone,
    string Email,
    Gender Gender,
    string Designation,
    string Department,
    string EmploymentType,
    DateTime JoiningDate,
    decimal BasicSalary,
    bool IsActive,
    string? Photo);

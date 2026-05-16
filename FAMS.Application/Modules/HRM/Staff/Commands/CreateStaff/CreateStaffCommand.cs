using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;

namespace FAMS.Application.Modules.HRM.Staff.Commands.CreateStaff;

public record CreateStaffCommand(
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
    decimal BasicSalary,
    string EmploymentType = "FullTime") : IRequest<Result<Guid>>;

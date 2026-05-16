using FAMS.Domain.Enums;

namespace FAMS.Application.Modules.CRM.Queries.GetStudentById;

public record StudentDetailDto(
    Guid Id,
    string FirstName,
    string LastName,
    string FatherName,
    DateTime DateOfBirth,
    Gender Gender,
    string? NIC,
    string? BForm,
    string Address,
    string Phone,
    string? Email,
    string RollNumber,
    StudentStatus Status,
    string EmergencyContactName,
    string EmergencyContactPhone,
    string? MedicalNotes,
    string? BloodGroup,
    string? Photo,
    DateTime EnrollmentDate,
    string? ParentName,
    string? ParentPhone,
    string CampusName,
    decimal OutstandingFees,
    decimal AttendancePercentage);

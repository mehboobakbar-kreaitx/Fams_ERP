using FAMS.Domain.Enums;

namespace FAMS.Application.Modules.CRM.Queries.GetStudents;

public record StudentDto(
    Guid Id,
    string FirstName,
    string LastName,
    string FatherName,
    string RollNumber,
    StudentStatus Status,
    Guid ProgramId,
    string? ProgramName,
    Guid ClassId,
    string? ClassName,
    Guid SectionId,
    string? SectionName,
    string Phone,
    string? Email,
    string? Photo,
    DateTime EnrollmentDate);

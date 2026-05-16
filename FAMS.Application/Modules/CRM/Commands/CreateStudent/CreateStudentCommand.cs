using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;

namespace FAMS.Application.Modules.CRM.Commands.CreateStudent;

public record CreateStudentCommand(
    Guid CampusId,
    string FirstName,
    string LastName,
    string FatherName,
    DateTime DateOfBirth,
    Gender Gender,
    string Address,
    string Phone,
    Guid ProgramId,
    Guid ClassId,
    Guid SectionId,
    string RollNumber,
    string EmergencyContactName,
    string EmergencyContactPhone,
    string? NIC = null,
    string? BForm = null,
    string? Email = null,
    string? BloodGroup = null,
    Guid? ParentId = null) : IRequest<Result<Guid>>;
